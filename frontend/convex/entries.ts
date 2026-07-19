import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { trackEvent } from "./analytics"

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
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
  },
  handler: async (ctx, { city, intentType, category, budgetMin, budgetMax }) => {
    const userId = await getAuthUserId(ctx)
    const results = await ctx.db
      .query("entries")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(100)
    const filtered = results.filter((e) => {
      if (userId && e.clientId === userId) return false
      if (intentType && e.intentType !== intentType) return false
      if (category && e.category !== category) return false
      if (city && e.city && !e.city.toLowerCase().includes(city.toLowerCase())) return false
      if (budgetMin != null && e.budgetMax != null && e.budgetMax < budgetMin) return false
      if (budgetMax != null && e.budgetMin != null && e.budgetMin > budgetMax) return false
      return true
    })
    return Promise.all(filtered.map(async (e) => ({
      ...e,
      photoUrl: e.photoStorageId ? await ctx.storage.getUrl(e.photoStorageId) : null,
    })))
  },
})

export const get = query({
  args: { id: v.id("entries") },
  handler: async (ctx, { id }) => {
    const entry = await ctx.db.get(id)
    if (!entry) return null
    const photoUrl = entry.photoStorageId ? await ctx.storage.getUrl(entry.photoStorageId) : null
    return { ...entry, photoUrl }
  },
})

export const getByIds = query({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, { ids }) => {
    const results = await Promise.all(ids.map(id => ctx.db.get(id as Id<"entries">)))
    return results.filter(Boolean)
  },
})

export const dismissAiMatch = mutation({
  args: { entryId: v.id("entries"), dismissId: v.string() },
  handler: async (ctx, { entryId, dismissId }) => {
    const entry = await ctx.db.get(entryId)
    if (!entry) return
    const dismissed = [...(entry.aiDismissedIds ?? []), dismissId]
    const matchIds = (entry.aiMatchIds ?? []).filter(id => id !== dismissId)
    await ctx.db.patch(entryId, { aiDismissedIds: dismissed, aiMatchIds: matchIds, aiMatchCount: matchIds.length, aiMatchFirstId: matchIds[0] ?? undefined })
  },
})

export const saveAiMatchCache = mutation({
  args: {
    entryId: v.id("entries"),
    count: v.number(),
    firstId: v.optional(v.string()),
    firstTitle: v.optional(v.string()),
    firstCity: v.optional(v.string()),
    matchIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { entryId, count, firstId, firstTitle, firstCity, matchIds }) => {
    const entry = await ctx.db.get(entryId)
    const previousIds = new Set(entry?.aiMatchIds ?? [])
    const newIds = (matchIds ?? []).filter((id) => !previousIds.has(id))

    await ctx.db.patch(entryId, { aiMatchCount: count, aiMatchFirstId: firstId, aiMatchFirstTitle: firstTitle, aiMatchFirstCity: firstCity, aiMatchIds: matchIds })

    if (newIds.length > 0 && entry) {
      const ownerSubs = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_user", (q) => q.eq("userId", entry.clientId))
        .collect()
      if (ownerSubs.length > 0) {
        await ctx.scheduler.runAfter(0, internal.pushNotifications.send, {
          subscriptions: ownerSubs.map((s) => ({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth })),
          title: "Знайдено відповідність 🎯",
          body: firstTitle ? `${firstTitle}${firstCity ? ` · ${firstCity}` : ''}` : `Знайдено нові збіги для «${entry.title}»`,
          url: `/app/entries/${entryId}`,
        })
      }
    }
  },
})

// Sum of aiMatchCount across the caller's own open entries — used for the TabBar dot indicator
export const myMatchCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return 0
    const mine = await ctx.db
      .query("entries")
      .withIndex("by_client", (q) => q.eq("clientId", userId))
      .take(50)
    return mine.reduce((sum, e) => sum + (e.aiMatchCount ?? 0), 0)
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
    const projects = mine.filter(e => e.entryType === 'project')
    const nonProjects = mine.filter(e => e.entryType !== 'project' && !e.projectId)

    // Non-project entries: city-based count (AI cache takes priority in Dashboard)
    for (const entry of nonProjects) {
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

    // Projects: sum aiMatchCount of their open tasks
    for (const project of projects) {
      const tasks = await ctx.db.query("entries").withIndex("by_project", q => q.eq("projectId", project._id)).take(50)
      const openTasks = tasks.filter(t => t.status === 'open' && t.aiMatchCount != null)
      const total = openTasks.reduce((sum, t) => sum + (t.aiMatchCount ?? 0), 0)
      const firstTask = openTasks.find(t => (t.aiMatchCount ?? 0) > 0 && t.aiMatchFirstId)
      counts[project._id] = {
        count: total,
        first: firstTask?.aiMatchFirstId ? { _id: firstTask.aiMatchFirstId, title: firstTask.aiMatchFirstTitle ?? firstTask.title, city: firstTask.aiMatchFirstCity, intentType: '' } : undefined,
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
    photoStorageId: v.optional(v.id("_storage")),
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
    status: v.optional(v.union(v.literal("draft"), v.literal("open"), v.literal("in_progress"), v.literal("done"), v.literal("cancelled"))),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const entry = await ctx.db.get(id)
    if (!entry || entry.clientId !== userId) throw new Error("Not found")
    await ctx.db.patch(id, fields)
  },
})

// Moves a standalone entry into a project (making it a task), or moves a task
// out of a project back to standalone (projectId: null).
export const moveToProject = mutation({
  args: {
    id: v.id("entries"),
    projectId: v.union(v.id("entries"), v.null()),
  },
  handler: async (ctx, { id, projectId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    const entry = await ctx.db.get(id)
    if (!entry || entry.clientId !== userId) throw new Error("Not found")
    if (entry.entryType === "project") throw new Error("Projects can't be moved into other projects")
    if (projectId) {
      const project = await ctx.db.get(projectId)
      if (!project || project.clientId !== userId || project.entryType !== "project") throw new Error("Invalid project")
    }
    await ctx.db.patch(id, { projectId: projectId ?? undefined })
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

// Persists manual drag-to-reorder within a project's task list. Only touches
// taskOrder, leaving AI-inferred dependsOnTaskIds untouched.
export const reorderTasks = mutation({
  args: { orderedIds: v.array(v.id("entries")) },
  handler: async (ctx, { orderedIds }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    for (let i = 0; i < orderedIds.length; i++) {
      const task = await ctx.db.get(orderedIds[i])
      if (!task || task.clientId !== userId) continue
      await ctx.db.patch(orderedIds[i], { taskOrder: i })
    }
  },
})

// Bulk-applies AI-inferred sequencing (order + dependencies) to a project's tasks
export const setTaskOrder = mutation({
  args: {
    entries: v.array(v.object({
      id: v.id("entries"),
      order: v.number(),
      dependsOn: v.array(v.id("entries")),
    })),
  },
  handler: async (ctx, { entries }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")
    for (const e of entries) {
      const task = await ctx.db.get(e.id)
      if (!task || task.clientId !== userId) continue
      await ctx.db.patch(e.id, { taskOrder: e.order, dependsOnTaskIds: e.dependsOn })
    }
  },
})

export const createTask = mutation({
  args: {
    projectId: v.id("entries"),
    title: v.string(),
    category: v.optional(v.string()),
    intentType: intentTypeV,
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
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
      budgetMin: args.budgetMin,
      budgetMax: args.budgetMax,
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
    photoStorageId: v.optional(v.id("_storage")),
    aiDiagnosis: v.optional(v.object({
      category: v.string(),
      urgency: v.string(),
      priceMin: v.number(),
      priceMax: v.number(),
    })),
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
    await trackEvent(ctx, "entry_posted", { userId, entryId: id, meta: { entryType: args.entryType, category: args.category } })
    return id
  },
})
