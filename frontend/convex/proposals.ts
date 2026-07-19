import { query, mutation, internalMutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import { trackEvent } from "./analytics"

export const listForEntry = query({
  args: { entryId: v.id("entries") },
  handler: async (ctx, { entryId }) => {
    const props = await ctx.db.query("proposals").withIndex("by_entry", q => q.eq("entryId", entryId)).take(50)
    return Promise.all(props.map(async p => {
      const user = await ctx.db.get(p.providerId)
      const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", p.providerId)).first()
      return { ...p, providerName: user?.name ?? user?.email?.split('@')[0] ?? 'Користувач', providerVerified: profile?.verified ?? false }
    }))
  },
})

export const myProposalForEntry = query({
  args: { entryId: v.id("entries") },
  handler: async (ctx, { entryId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const props = await ctx.db.query("proposals").withIndex("by_entry", q => q.eq("entryId", entryId)).take(50)
    return props.find(p => p.providerId === userId) ?? null
  },
})

export const create = mutation({
  args: {
    entryId: v.id("entries"),
    message: v.string(),
    price: v.optional(v.number()),
    estimatedDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const entry = await ctx.db.get(args.entryId)
    if (!entry) throw new Error("Entry not found")
    if (entry.clientId === userId) throw new Error("Cannot propose on own entry")

    const existing = await ctx.db.query("proposals").withIndex("by_entry", q => q.eq("entryId", args.entryId)).take(50)
    if (existing.find(p => p.providerId === userId)) throw new Error("Already proposed")

    const proposalId = await ctx.db.insert("proposals", {
      entryId: args.entryId,
      providerId: userId,
      message: args.message,
      price: args.price,
      currency: "EUR",
      status: "pending",
      estimatedDays: args.estimatedDays,
    })

    // Push notification to entry owner
    const ownerSubs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", entry.clientId))
      .collect()
    if (ownerSubs.length > 0) {
      const provider = await ctx.db.get(userId)
      const providerName = provider?.name ?? "Майстер"
      await ctx.scheduler.runAfter(0, internal.pushNotifications.send, {
        subscriptions: ownerSubs.map(s => ({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth })),
        title: "Нова пропозиція на ваш запис",
        body: `${providerName}: ${args.message.slice(0, 80)}`,
        url: `/app/entries/${args.entryId}`,
      })
    }

    // Auto-send first message to entry owner
    await ctx.db.insert("messages", {
      fromId: userId,
      toId: entry.clientId,
      entryId: args.entryId,
      text: args.price ? `💼 Пропозиція €${args.price}: ${args.message}` : `💼 ${args.message}`,
      read: false,
    })

    await trackEvent(ctx, "proposal_made", { userId, entryId: args.entryId, meta: { price: args.price } })

    return proposalId
  },
})

export const accept = mutation({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, { proposalId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const proposal = await ctx.db.get(proposalId)
    if (!proposal) throw new Error("Not found")
    const entry = await ctx.db.get(proposal.entryId)
    if (!entry || entry.clientId !== userId) throw new Error("Not authorized")

    await ctx.db.patch(proposalId, { status: "in_progress" })
    await ctx.db.patch(proposal.entryId, { status: "in_progress" })

    // Notify provider
    const providerSubs = await ctx.db.query("pushSubscriptions").withIndex("by_user", q => q.eq("userId", proposal.providerId)).collect()
    if (providerSubs.length > 0) {
      await ctx.scheduler.runAfter(0, internal.pushNotifications.send, {
        subscriptions: providerSubs.map(s => ({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth })),
        title: "Вашу пропозицію прийнято! 🎉",
        body: `Клієнт прийняв вашу пропозицію на «${entry.title}»`,
        url: `/app/chat/${userId}`,
      })
    }

    await ctx.db.insert("messages", {
      fromId: userId,
      toId: proposal.providerId,
      entryId: proposal.entryId,
      text: "✅ Я прийняв вашу пропозицію! Можемо починати.",
      read: false,
    })

    await trackEvent(ctx, "proposal_accepted", { userId, entryId: proposal.entryId })
  },
})

const AUTO_CONFIRM_MS = 60 * 60 * 60 * 1000 // 60h — client silence is treated as acceptance, not as a stuck deal

// Provider saw the real scope on-site and the original price no longer fits — client must
// confirm before the new price takes effect, so nobody gets billed for a number they never agreed to.
export const proposeRequote = mutation({
  args: { proposalId: v.id("proposals"), newPrice: v.number(), reason: v.string() },
  handler: async (ctx, { proposalId, newPrice, reason }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const proposal = await ctx.db.get(proposalId)
    if (!proposal) throw new Error("Not found")
    if (proposal.providerId !== userId) throw new Error("Not authorized")
    if (proposal.status !== "in_progress") throw new Error("Can only requote work in progress")

    await ctx.db.patch(proposalId, { requotedPrice: newPrice, requoteReason: reason, requoteStatus: "pending" })

    const entry = await ctx.db.get(proposal.entryId)
    if (!entry) throw new Error("Entry not found")

    const clientSubs = await ctx.db.query("pushSubscriptions").withIndex("by_user", q => q.eq("userId", entry.clientId)).collect()
    if (clientSubs.length > 0) {
      await ctx.scheduler.runAfter(0, internal.pushNotifications.send, {
        subscriptions: clientSubs.map(s => ({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth })),
        title: "Виконавець пропонує нову ціну",
        body: `€${newPrice}: ${reason.slice(0, 80)}`,
        url: `/app/chat/${userId}`,
      })
    }

    await ctx.db.insert("messages", {
      fromId: userId,
      toId: entry.clientId,
      entryId: proposal.entryId,
      text: `💬 Пропоную нову ціну €${newPrice}: ${reason}`,
      read: false,
    })
  },
})

export const respondToRequote = mutation({
  args: { proposalId: v.id("proposals"), accept: v.boolean() },
  handler: async (ctx, { proposalId, accept }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const proposal = await ctx.db.get(proposalId)
    if (!proposal) throw new Error("Not found")
    const entry = await ctx.db.get(proposal.entryId)
    if (!entry || entry.clientId !== userId) throw new Error("Not authorized")
    if (proposal.requoteStatus !== "pending") throw new Error("No pending requote")

    if (accept && proposal.requotedPrice != null) {
      await ctx.db.patch(proposalId, { price: proposal.requotedPrice, requoteStatus: "accepted" })
    } else {
      await ctx.db.patch(proposalId, { requoteStatus: "rejected" })
    }

    await ctx.db.insert("messages", {
      fromId: userId,
      toId: proposal.providerId,
      entryId: proposal.entryId,
      text: accept ? `✅ Нову ціну €${proposal.requotedPrice} прийнято.` : `✗ Нову ціну відхилено. Працюємо за €${proposal.price}.`,
      read: false,
    })
  },
})

export const markDone = mutation({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, { proposalId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const proposal = await ctx.db.get(proposalId)
    if (!proposal) throw new Error("Not found")
    if (proposal.providerId !== userId) throw new Error("Not authorized")

    await ctx.db.patch(proposalId, { status: "done", doneAt: Date.now() })
    await ctx.scheduler.runAfter(AUTO_CONFIRM_MS, internal.proposals.autoConfirm, { proposalId })

    const entry = await ctx.db.get(proposal.entryId)
    // Notify client
    const clientSubs = await ctx.db.query("pushSubscriptions").withIndex("by_user", q => q.eq("userId", entry!.clientId)).collect()
    if (clientSubs.length > 0) {
      await ctx.scheduler.runAfter(0, internal.pushNotifications.send, {
        subscriptions: clientSubs.map(s => ({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth })),
        title: "Майстер завершив роботу 🏁",
        body: `Підтвердіть виконання і оплатіть`,
        url: `/app/chat/${userId}`,
      })
    }

    await ctx.db.insert("messages", {
      fromId: userId,
      toId: entry!.clientId,
      entryId: proposal.entryId,
      text: "🏁 Роботу завершено! Прошу підтвердити і оплатити.",
      read: false,
    })
  },
})

export const mockPay = mutation({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, { proposalId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const proposal = await ctx.db.get(proposalId)
    if (!proposal) throw new Error("Not found")
    const entry = await ctx.db.get(proposal.entryId)
    if (!entry || entry.clientId !== userId) throw new Error("Not authorized")

    await ctx.db.patch(proposalId, { status: "paid" })
    await ctx.db.patch(proposal.entryId, { status: "done" })

    // Notify provider
    const providerSubs = await ctx.db.query("pushSubscriptions").withIndex("by_user", q => q.eq("userId", proposal.providerId)).collect()
    if (providerSubs.length > 0) {
      await ctx.scheduler.runAfter(0, internal.pushNotifications.send, {
        subscriptions: providerSubs.map(s => ({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth })),
        title: "Оплата отримана 💰",
        body: `Клієнт оплатив €${proposal.price ?? '—'}. Дякуємо за роботу!`,
        url: `/app/chat/${userId}`,
      })
    }

    await ctx.db.insert("messages", {
      fromId: userId,
      toId: proposal.providerId,
      entryId: proposal.entryId,
      text: `💰 Оплату €${proposal.price ?? '—'} надіслано! Дякуємо за роботу.`,
      read: false,
    })

    await trackEvent(ctx, "booking_done", { userId, entryId: proposal.entryId, meta: { price: proposal.price } })
  },
})

export const dispute = mutation({
  args: { proposalId: v.id("proposals"), reason: v.string() },
  handler: async (ctx, { proposalId, reason }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const proposal = await ctx.db.get(proposalId)
    if (!proposal) throw new Error("Not found")
    const entry = await ctx.db.get(proposal.entryId)
    if (!entry || entry.clientId !== userId) throw new Error("Not authorized")
    if (proposal.status !== "done") throw new Error("Can only dispute work marked as done")

    await ctx.db.patch(proposalId, { status: "disputed", disputeReason: reason })

    const providerSubs = await ctx.db.query("pushSubscriptions").withIndex("by_user", q => q.eq("userId", proposal.providerId)).collect()
    if (providerSubs.length > 0) {
      await ctx.scheduler.runAfter(0, internal.pushNotifications.send, {
        subscriptions: providerSubs.map(s => ({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth })),
        title: "Клієнт оскаржив виконання",
        body: reason.slice(0, 100),
        url: `/app/chat/${userId}`,
      })
    }

    await ctx.db.insert("messages", {
      fromId: userId,
      toId: proposal.providerId,
      entryId: proposal.entryId,
      text: `⚠️ Спір: ${reason}`,
      read: false,
    })

    await trackEvent(ctx, "booking_disputed", { userId, entryId: proposal.entryId })
  },
})

// Client silence 60h after "done" is not the same as a satisfied client — but a permanently
// stuck deal is worse for both sides, so payout releases automatically unless disputed first.
export const autoConfirm = internalMutation({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, { proposalId }) => {
    const proposal = await ctx.db.get(proposalId)
    if (!proposal || proposal.status !== "done") return // already paid, disputed, or gone
    const entry = await ctx.db.get(proposal.entryId)
    if (!entry) return

    await ctx.db.patch(proposalId, { status: "paid" })
    await ctx.db.patch(proposal.entryId, { status: "done" })

    await ctx.db.insert("messages", {
      fromId: proposal.providerId,
      toId: entry.clientId,
      entryId: proposal.entryId,
      text: `✅ Минуло 60 год без відповіді — оплату €${proposal.price ?? "—"} підтверджено автоматично.`,
      read: false,
    })

    const clientSubs = await ctx.db.query("pushSubscriptions").withIndex("by_user", q => q.eq("userId", entry.clientId)).collect()
    if (clientSubs.length > 0) {
      await ctx.scheduler.runAfter(0, internal.pushNotifications.send, {
        subscriptions: clientSubs.map(s => ({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth })),
        title: "Оплату підтверджено автоматично",
        body: `Ви не відповіли протягом 60 год — вважаємо роботу прийнятою.`,
        url: `/app/chat/${proposal.providerId}`,
      })
    }
  },
})

export const getActiveForChat = query({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, { otherUserId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    // Check if current user is client (other is provider)
    const asClient = await ctx.db.query("proposals")
      .withIndex("by_provider", q => q.eq("providerId", otherUserId))
      .collect()
    for (const p of asClient) {
      const entry = await ctx.db.get(p.entryId)
      if (entry?.clientId === userId && ["accepted","in_progress","done"].includes(p.status)) {
        return { ...p, role: "client" as const, entryTitle: entry.title }
      }
    }

    // Check if current user is provider (other is client)
    const asProvider = await ctx.db.query("proposals")
      .withIndex("by_provider", q => q.eq("providerId", userId))
      .collect()
    for (const p of asProvider) {
      const entry = await ctx.db.get(p.entryId)
      if (entry?.clientId === otherUserId && ["accepted","in_progress","done"].includes(p.status)) {
        return { ...p, role: "provider" as const, entryTitle: entry.title }
      }
    }

    return null
  },
})
