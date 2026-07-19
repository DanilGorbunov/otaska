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
    locale: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    priceFrom: v.optional(v.number()),
    priceTo: v.optional(v.number()),
    availability: v.optional(v.string()),
    avatar: v.optional(v.string()),
    isCompany: v.optional(v.boolean()),
    companyName: v.optional(v.string()),
    companyLegalForm: v.optional(v.string()),
    companyRegNumber: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    companyCountry: v.optional(v.string()),
    companyAddress: v.optional(v.string()),
    companyWebsite: v.optional(v.string()),
    companyPhone: v.optional(v.string()),
    companyIban: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const { name, ...profileArgs } = args
    if (name) await ctx.db.patch(userId, { name })
    const existing = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", userId)).first()
    // Discoverable as a performer the moment skills are filled in — no manual toggle.
    const skillsAfter = profileArgs.skills !== undefined ? profileArgs.skills : existing?.skills
    const isProvider = (skillsAfter?.length ?? 0) > 0
    if (existing) {
      await ctx.db.patch(existing._id, { ...profileArgs, isProvider })
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        isProvider,
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

// Manual verification toggle — gated to a hardcoded admin allowlist (no role system yet)
export const setVerified = mutation({
  args: { userId: v.id("users"), verified: v.boolean() },
  handler: async (ctx, { userId, verified }) => {
    const callerId = await getAuthUserId(ctx)
    if (!callerId) throw new Error("Not authenticated")
    const caller = await ctx.db.get(callerId)
    const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
    if (!caller?.email || !admins.includes(caller.email.toLowerCase())) throw new Error("Not authorized")

    const profile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", userId)).first()
    if (!profile) throw new Error("Profile not found")
    await ctx.db.patch(profile._id, { verified, verifiedAt: verified ? Date.now() : undefined })
  },
})
