import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"

export const create = mutation({
  args: {
    proposalId: v.id("proposals"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, { proposalId, rating, comment }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    const proposal = await ctx.db.get(proposalId)
    if (!proposal) throw new Error("Not found")
    if (proposal.status !== "paid") throw new Error("Can only review after payment")

    const entry = await ctx.db.get(proposal.entryId)
    if (!entry || entry.clientId !== userId) throw new Error("Not authorized")

    const existing = await ctx.db.query("reviews").withIndex("by_proposal", q => q.eq("proposalId", proposalId)).first()
    if (existing) throw new Error("Already reviewed")

    await ctx.db.insert("reviews", {
      proposalId,
      reviewerId: userId,
      providerId: proposal.providerId,
      entryId: proposal.entryId,
      rating,
      comment,
    })

    // Recalculate provider rating
    const allReviews = await ctx.db.query("reviews").withIndex("by_provider", q => q.eq("providerId", proposal.providerId)).collect()
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

    const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", proposal.providerId)).first()
    if (profile) {
      await ctx.db.patch(profile._id, {
        rating: Math.round(avg * 10) / 10,
        jobsCompleted: allReviews.length,
      })
    }
  },
})

export const listForProvider = query({
  args: { providerId: v.id("users") },
  handler: async (ctx, { providerId }) => {
    const reviews = await ctx.db.query("reviews").withIndex("by_provider", q => q.eq("providerId", providerId)).order("desc").take(20)
    return Promise.all(reviews.map(async r => {
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
    return ctx.db.query("reviews").withIndex("by_proposal", q => q.eq("proposalId", proposalId)).first()
  },
})
