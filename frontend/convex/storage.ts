import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    return await ctx.storage.generateUploadUrl()
  },
})

export const saveAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", userId)).first()
    if (profile) {
      await ctx.db.patch(profile._id, { avatarStorageId: storageId })
    } else {
      await ctx.db.insert("userProfiles", { userId, isProvider: false, rating: 0, jobsCompleted: 0, avatarStorageId: storageId })
    }
  },
})

export const saveCover = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", userId)).first()
    if (profile) {
      await ctx.db.patch(profile._id, { coverStorageId: storageId })
    } else {
      await ctx.db.insert("userProfiles", { userId, isProvider: false, rating: 0, jobsCompleted: 0, coverStorageId: storageId })
    }
  },
})

export const addPortfolioItem = mutation({
  args: { storageId: v.id("_storage"), caption: v.optional(v.string()) },
  handler: async (ctx, { storageId, caption }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", userId)).first()
    const item = { storageId, caption }
    if (profile) {
      const items = [...(profile.portfolioItems ?? []), item]
      await ctx.db.patch(profile._id, { portfolioItems: items })
    } else {
      await ctx.db.insert("userProfiles", { userId, isProvider: false, rating: 0, jobsCompleted: 0, portfolioItems: [item] })
    }
  },
})

export const removePortfolioItem = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", userId)).first()
    if (!profile) return
    await ctx.db.patch(profile._id, {
      portfolioItems: (profile.portfolioItems ?? []).filter(i => i.storageId !== storageId),
    })
    await ctx.storage.delete(storageId)
  },
})

export const updatePortfolioCaption = mutation({
  args: { storageId: v.id("_storage"), caption: v.string() },
  handler: async (ctx, { storageId, caption }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", userId)).first()
    if (!profile) return
    await ctx.db.patch(profile._id, {
      portfolioItems: (profile.portfolioItems ?? []).map(i =>
        i.storageId === storageId ? { ...i, caption } : i
      ),
    })
  },
})

export const getMyProfileFull = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const user = await ctx.db.get(userId)
    const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", userId)).first()
    if (!profile) return { user, profile: null, avatarUrl: null, coverUrl: null, portfolioUrls: [] }

    const avatarUrl = profile.avatarStorageId ? await ctx.storage.getUrl(profile.avatarStorageId) : null
    const coverUrl = profile.coverStorageId ? await ctx.storage.getUrl(profile.coverStorageId) : null
    const portfolioUrls = await Promise.all(
      (profile.portfolioItems ?? []).map(async item => ({
        storageId: item.storageId,
        caption: item.caption,
        url: await ctx.storage.getUrl(item.storageId),
      }))
    )

    return { user, profile, avatarUrl, coverUrl, portfolioUrls }
  },
})

export const getProviderProfileFull = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId)
    const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", userId)).first()
    if (!profile) return { user, profile: null, avatarUrl: null, coverUrl: null, portfolioUrls: [] }

    const avatarUrl = profile.avatarStorageId ? await ctx.storage.getUrl(profile.avatarStorageId) : null
    const coverUrl = profile.coverStorageId ? await ctx.storage.getUrl(profile.coverStorageId) : null
    const portfolioUrls = await Promise.all(
      (profile.portfolioItems ?? []).map(async item => ({
        storageId: item.storageId,
        caption: item.caption,
        url: await ctx.storage.getUrl(item.storageId),
      }))
    )

    return { user, profile, avatarUrl, coverUrl, portfolioUrls }
  },
})
