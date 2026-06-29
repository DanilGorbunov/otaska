import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const user = await ctx.db.get(userId)
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    return { ...user, profile }
  },
})

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    city: v.optional(v.string()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const { name, ...profileArgs } = args
    if (name) await ctx.db.patch(userId, { name })
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, profileArgs)
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        isProvider: false,
        rating: 0,
        jobsCompleted: 0,
        ...profileArgs,
      })
    }
  },
})

export const ensureProfile = mutation({
  args: {
    city: v.optional(v.string()),
    firstTask: v.optional(v.string()),
  },
  handler: async (ctx, { city, firstTask: _firstTask }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    if (city) await ctx.db.patch(userId, {})
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    if (!existing) {
      await ctx.db.insert("userProfiles", {
        userId,
        city,
        isProvider: false,
        rating: 0,
        jobsCompleted: 0,
      })
    }
  },
})
