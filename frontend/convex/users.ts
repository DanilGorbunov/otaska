import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId)
    if (!user) return null
    const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", userId)).first()
    return { ...user, profile }
  },
})

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
    isProvider: v.optional(v.boolean()),
    skills: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    priceFrom: v.optional(v.number()),
    priceTo: v.optional(v.number()),
    availability: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const { name, ...profileArgs } = args
    if (name) await ctx.db.patch(userId, { name })
    const existing = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", userId)).first()
    if (existing) {
      await ctx.db.patch(existing._id, profileArgs)
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        isProvider: profileArgs.isProvider ?? false,
        rating: 0,
        jobsCompleted: 0,
        ...profileArgs,
      })
    }
  },
})

export const searchProvidersForTask = query({
  args: { taskTitle: v.string(), city: v.optional(v.string()) },
  handler: async (ctx, { taskTitle, city }) => {
    const profiles = await ctx.db.query("userProfiles")
      .withIndex("by_provider", q => q.eq("isProvider", true))
      .collect()

    const keyword = taskTitle.toLowerCase()
    const matches = profiles.filter(p => {
      const cityMatch = !city || !p.city || p.city.toLowerCase().includes(city.toLowerCase())
      const skillMatch = p.skills?.some(s => s.toLowerCase().includes(keyword) || keyword.includes(s.toLowerCase()))
      return cityMatch && skillMatch
    })

    return Promise.all(matches.slice(0, 5).map(async p => {
      const user = await ctx.db.get(p.userId)
      return { userId: p.userId, name: user?.name ?? user?.email?.split('@')[0] ?? 'Майстер', rating: p.rating, jobsCompleted: p.jobsCompleted }
    }))
  },
})

export const listProviders = query({
  args: { city: v.optional(v.string()), skill: v.optional(v.string()) },
  handler: async (ctx, { city, skill }) => {
    const profiles = await ctx.db.query("userProfiles")
      .withIndex("by_provider", q => q.eq("isProvider", true))
      .collect()

    const filtered = profiles.filter(p => {
      if (city && p.city?.toLowerCase() !== city.toLowerCase()) return false
      if (skill && !p.skills?.some(s => s.toLowerCase().includes(skill.toLowerCase()))) return false
      return true
    })

    return Promise.all(filtered.map(async p => {
      const user = await ctx.db.get(p.userId)
      return { ...p, name: user?.name ?? user?.email?.split('@')[0] ?? 'Майстер', email: user?.email }
    }))
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
