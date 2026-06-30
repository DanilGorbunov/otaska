import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"

const intentTypeV = v.union(
  v.literal("seeking_service"),
  v.literal("offering_service"),
  v.literal("seeking_material"),
  v.literal("seeking_job"),
)

const entryTypeV = v.union(
  v.literal("on_demand"),
  v.literal("project"),
  v.literal("material"),
)

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []
    return ctx.db
      .query("entries")
      .withIndex("by_client", (q) => q.eq("clientId", userId))
      .order("desc")
      .take(50)
  },
})

export const listOpen = query({
  args: {
    city: v.optional(v.string()),
    intentType: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { city, intentType, category }) => {
    const results = await ctx.db
      .query("entries")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(100)
    return results.filter((e) => {
      if (intentType && e.intentType !== intentType) return false
      if (category && e.category !== category) return false
      if (city && e.city && !e.city.toLowerCase().includes(city.toLowerCase())) return false
      return true
    })
  },
})

export const get = query({
  args: { id: v.id("entries") },
  handler: async (ctx, { id }) => ctx.db.get(id),
})

export const saveAiMatchCache = mutation({
  args: {
    entryId: v.id("entries"),
    count: v.number(),
    firstId: v.optional(v.string()),
    firstTitle: v.optional(v.string()),
    firstCity: v.optional(v.string()),
  },
  handler: async (ctx, { entryId, count, firstId, firstTitle, firstCity }) => {
    await ctx.db.patch(entryId, { aiMatchCount: count, aiMatchFirstId: firstId, aiMatchFirstTitle: firstTitle, aiMatchFirstCity: firstCity })
  },
})

// Returns match counts for each of the user's entries:
// opposite intentType in same category+city
export const listMatchCounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return {}
    const mine = await ctx.db
      .query("entries")
      .withIndex("by_client", (q) => q.eq("clientId", userId))
      .take(50)
    const allOpen = await ctx.db
      .query("entries")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .take(200)
    const others = allOpen.filter(e => e.clientId !== userId)

    const counts: Record<string, { count: number; first?: { _id: string; title: string; city?: string; intentType: string } }> = {}
    for (const entry of mine) {
      const matched = others.filter(o => {
        if (o.entryType === 'project') return false
        const cityMatch = !entry.city || !o.city ||
          o.city.toLowerCase().includes(entry.city.toLowerCase()) ||
          entry.city.toLowerCase().includes(o.city.toLowerCase())
        return cityMatch
      })
      counts[entry._id] = {
        count: matched.length,
        first: matched[0] ? { _id: matched[0]._id, title: matched[0].title, city: matched[0].city, intentType: matched[0].intentType } : undefined,
      }
    }
    return counts
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    intentType: intentTypeV,
    entryType: entryTypeV,
    category: v.optional(v.string()),
    city: v.optional(v.string()),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    skills: v.optional(v.array(v.string())),
    urgency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    return ctx.db.insert("entries", {
      ...args,
      clientId: userId,
      status: "draft",
      currency: "EUR",
    })
  },
})

export const publish = mutation({
  args: { id: v.id("entries") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const entry = await ctx.db.get(id)
    if (!entry || entry.clientId !== userId) throw new Error("Not found")
    await ctx.db.patch(id, { status: "open" })
  },
})

export const update = mutation({
  args: {
    id: v.id("entries"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    city: v.optional(v.string()),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const entry = await ctx.db.get(id)
    if (!entry || entry.clientId !== userId) throw new Error("Not found")
    await ctx.db.patch(id, fields)
  },
})

export const remove = mutation({
  args: { id: v.id("entries") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const entry = await ctx.db.get(id)
    if (!entry || entry.clientId !== userId) throw new Error("Not found")
    await ctx.db.delete(id)
  },
})

export const listTasks = query({
  args: { projectId: v.id("entries") },
  handler: async (ctx, { projectId }) => {
    return ctx.db
      .query("entries")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("desc")
      .take(100)
  },
})

export const createTask = mutation({
  args: {
    projectId: v.id("entries"),
    title: v.string(),
    category: v.optional(v.string()),
    intentType: intentTypeV,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const project = await ctx.db.get(args.projectId)
    if (!project || project.clientId !== userId) throw new Error("Not found")
    return ctx.db.insert("entries", {
      clientId: userId,
      title: args.title,
      description: args.title,
      intentType: args.intentType,
      entryType: "on_demand",
      status: "draft",
      category: args.category,
      city: project.city,
      currency: "EUR",
      projectId: args.projectId,
    })
  },
})

export const publishTask = mutation({
  args: {
    id: v.id("entries"),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    category: v.optional(v.string()),
    intentType: v.optional(intentTypeV),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const entry = await ctx.db.get(id)
    if (!entry || entry.clientId !== userId) throw new Error("Not found")
    await ctx.db.patch(id, { ...fields, status: "open" })
  },
})

export const createAndPublish = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    intentType: intentTypeV,
    entryType: entryTypeV,
    category: v.optional(v.string()),
    city: v.optional(v.string()),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    skills: v.optional(v.array(v.string())),
    urgency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const id = await ctx.db.insert("entries", {
      ...args,
      clientId: userId,
      status: "open",
      currency: "EUR",
    })
    return id
  },
})
