// Stripe Connect escrow — "separate charges and transfers" pattern.
//
// Money flow: client pays via Checkout → funds land in the PLATFORM's own Stripe balance
// (no transfer_data on the session, so nothing moves automatically) → once the client confirms
// the work (or the 60h auto-confirm fires), we call Transfers to move price minus commission to
// the performer's connected Express account. The commission simply never gets transferred out.
//
// This file is a complete, correct scaffold against Stripe's REST API — it cannot be exercised
// end-to-end in this environment because STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET aren't set.
// Every function fails the same documented way ai.ts does when its key is missing, rather than
// silently pretending to work. Wire it up and walk a real Stripe test-mode payment before trusting
// it with production money — nothing here has been exercised against Stripe's actual API.
//
// Not yet wired into the existing accept → in_progress → done → paid flow (see proposals.ts) —
// that's a UX decision (when exactly does the client get asked to pay?) this scaffold doesn't
// make for you. createEscrowCheckout and releaseEscrowTransfer are ready to be called from
// wherever that decision lands.

import { action, internalMutation, internalQuery } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { internal, api } from "./_generated/api"
import { PLATFORM_COMMISSION_RATE } from "./config"

function flattenParams(obj: Record<string, unknown>, prefix = ""): [string, string][] {
  return Object.entries(obj).flatMap(([key, value]) => {
    if (value === undefined || value === null) return []
    const paramKey = prefix ? `${prefix}[${key}]` : key
    if (typeof value === "object" && !Array.isArray(value)) {
      return flattenParams(value as Record<string, unknown>, paramKey)
    }
    if (Array.isArray(value)) {
      return value.flatMap((item, i) =>
        typeof item === "object"
          ? flattenParams(item as Record<string, unknown>, `${paramKey}[${i}]`)
          : ([[`${paramKey}[${i}]`, String(item)]] as [string, string][])
      )
    }
    return [[paramKey, String(value)]] as [string, string][]
  })
}

async function stripeRequest(path: string, params: Record<string, unknown>) {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY not set")

  const body = new URLSearchParams(flattenParams(params))
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Stripe ${path} failed: ${data?.error?.message ?? res.statusText}`)
  return data
}

// Performer onboarding — creates their Express connected account (once) and returns a
// fresh hosted onboarding link. Safe to call repeatedly; Stripe account links expire quickly.
export const createProviderOnboardingLink = action({
  args: { returnUrl: v.string(), refreshUrl: v.string() },
  handler: async (ctx, { returnUrl, refreshUrl }): Promise<{ url: string }> => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    const profile: { stripeAccountId?: string } | null = await ctx.runQuery(api.users.getMe).then((me) => me?.profile ?? null)

    let accountId = profile?.stripeAccountId
    if (!accountId) {
      const account = await stripeRequest("accounts", {
        type: "express",
        capabilities: { transfers: { requested: "true" } },
      })
      accountId = account.id as string
      await ctx.runMutation(internal.payments.saveStripeAccountId, { userId, stripeAccountId: accountId })
    }

    const link = await stripeRequest("account_links", {
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    })
    return { url: link.url as string }
  },
})

export const saveStripeAccountId = internalMutation({
  args: { userId: v.id("users"), stripeAccountId: v.string() },
  handler: async (ctx, { userId, stripeAccountId }) => {
    const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", userId)).first()
    if (profile) await ctx.db.patch(profile._id, { stripeAccountId })
  },
})

// Client funds escrow for an accepted proposal — redirect them to the returned Checkout URL.
export const createEscrowCheckout = action({
  args: { proposalId: v.id("proposals"), successUrl: v.string(), cancelUrl: v.string() },
  handler: async (ctx, { proposalId, successUrl, cancelUrl }): Promise<{ url: string }> => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    const proposal = await ctx.runQuery(internal.payments.getProposalForCheckout, { proposalId })
    if (!proposal) throw new Error("Proposal not found")
    if (proposal.clientId !== userId) throw new Error("Not authorized")
    if (!proposal.price) throw new Error("Proposal has no price")

    const session = await stripeRequest("checkout/sessions", {
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: proposal.entryTitle ?? "Taskont task" },
          unit_amount: Math.round(proposal.price * 100),
        },
        quantity: 1,
      }],
      metadata: { proposalId },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    await ctx.runMutation(internal.payments.saveCheckoutSession, { proposalId, sessionId: session.id as string })
    return { url: session.url as string }
  },
})

// Called once work is confirmed (client approval or the 60h auto-confirm) — moves
// price minus platform commission to the performer. Skips cleanly if escrow was never
// funded (e.g. Stripe isn't configured yet), so it's safe to call unconditionally.
export const releaseEscrowTransfer = action({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, { proposalId }): Promise<void> => {
    const proposal = await ctx.runQuery(internal.payments.getProposalForCheckout, { proposalId })
    if (!proposal || !proposal.escrowFunded || !proposal.price) return
    if (!proposal.providerStripeAccountId) throw new Error("Performer has no connected Stripe account")

    const payout = Math.round(proposal.price * (1 - PLATFORM_COMMISSION_RATE) * 100)
    const transfer = await stripeRequest("transfers", {
      amount: payout,
      currency: "eur",
      destination: proposal.providerStripeAccountId,
      transfer_group: proposalId,
    })

    await ctx.runMutation(internal.payments.saveTransferId, { proposalId, transferId: transfer.id as string })
  },
})

export const getProposalForCheckout = internalQuery({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, { proposalId }) => {
    const proposal = await ctx.db.get(proposalId)
    if (!proposal) return null
    const entry = await ctx.db.get(proposal.entryId)
    const providerProfile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", proposal.providerId)).first()
    return {
      clientId: entry?.clientId,
      entryTitle: entry?.title,
      price: proposal.price,
      escrowFunded: proposal.escrowFunded ?? false,
      providerStripeAccountId: providerProfile?.stripeAccountId,
    }
  },
})

export const saveCheckoutSession = internalMutation({
  args: { proposalId: v.id("proposals"), sessionId: v.string() },
  handler: async (ctx, { proposalId, sessionId }) => {
    await ctx.db.patch(proposalId, { stripeCheckoutSessionId: sessionId })
  },
})

export const markEscrowFunded = internalMutation({
  args: { sessionId: v.string(), paymentIntentId: v.string() },
  handler: async (ctx, { sessionId, paymentIntentId }) => {
    const proposal = await ctx.db
      .query("proposals")
      .filter(q => q.eq(q.field("stripeCheckoutSessionId"), sessionId))
      .first()
    if (!proposal) return
    await ctx.db.patch(proposal._id, { escrowFunded: true, stripePaymentIntentId: paymentIntentId })
  },
})

export const saveTransferId = internalMutation({
  args: { proposalId: v.id("proposals"), transferId: v.string() },
  handler: async (ctx, { proposalId, transferId }) => {
    await ctx.db.patch(proposalId, { stripeTransferId: transferId })
  },
})
