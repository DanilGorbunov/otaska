import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"

export const CLIENT_TAGS = ["Чіткий опис", "Оплатив вчасно", "Ввічливий", "Гнучкий графік"]
export const PROVIDER_TAGS = ["Прийшов вчасно", "Якісна робота", "Ввічливий", "Порадив би"]

export const create = mutation({
  args: {
    proposalId: v.id("proposals"),
    rating: v.number(),
    tags: v.optional(v.array(v.string())),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, { proposalId, rating, tags, comment }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    const proposal = await ctx.db.get(proposalId)
    if (!proposal) throw new Error("Not found")
    if (proposal.status !== "paid") throw new Error("Can only review after payment")

    const entry = await ctx.db.get(proposal.entryId)
    if (!entry) throw new Error("Entry not found")

    // Either side of a paid booking can review the other — the direction is inferred
    // from who's calling, never passed in, so nobody can review as the wrong party.
    const isClient = entry.clientId === userId
    const isProvider = proposal.providerId === userId
    if (!isClient && !isProvider) throw new Error("Not authorized")
    const direction = isClient ? "client_to_provider" as const : "provider_to_client" as const
    const revieweeId = isClient ? proposal.providerId : entry.clientId

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_proposal", q => q.eq("proposalId", proposalId))
      .filter(q => q.eq(q.field("direction"), direction))
      .first()
    if (existing) throw new Error("Already reviewed")

    await ctx.db.insert("reviews", {
      proposalId,
      reviewerId: userId,
      revieweeId,
      direction,
      entryId: proposal.entryId,
      rating,
      tags,
      comment,
    })

    // Only client_to_provider reviews feed a provider's public rating — a provider
    // rating their client shouldn't move the provider's own stats.
    if (direction === "client_to_provider") {
      const allReviews = await ctx.db
        .query("reviews")
        .withIndex("by_reviewee", q => q.eq("revieweeId", proposal.providerId))
        .collect()
      const providerReviews = allReviews.filter(r => r.direction === "client_to_provider")
      const avg = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length

      const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", proposal.providerId)).first()
      if (profile) {
        await ctx.db.patch(profile._id, {
          rating: Math.round(avg * 10) / 10,
          jobsCompleted: providerReviews.length,
        })
      }
    }
  },
})

export const listForProvider = query({
  args: { providerId: v.id("users") },
  handler: async (ctx, { providerId }) => {
    const reviews = await ctx.db.query("reviews").withIndex("by_reviewee", q => q.eq("revieweeId", providerId)).order("desc").take(20)
    return Promise.all(reviews.filter(r => r.direction === "client_to_provider").map(async r => {
      const reviewer = await ctx.db.get(r.reviewerId)
      const entry = await ctx.db.get(r.entryId)
      return {
        ...r,
        reviewerName: reviewer?.name ?? reviewer?.email?.split('@')[0] ?? 'Клієнт',
        entryTitle: entry?.title ?? '',
      }
    }))
  },
})

export const getForProposal = query({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, { proposalId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    return ctx.db
      .query("reviews")
      .withIndex("by_proposal", q => q.eq("proposalId", proposalId))
      .filter(q => q.eq(q.field("reviewerId"), userId))
      .first()
  },
})
