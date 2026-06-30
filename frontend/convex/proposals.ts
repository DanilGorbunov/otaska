import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"

export const listForEntry = query({
  args: { entryId: v.id("entries") },
  handler: async (ctx, { entryId }) => {
    const props = await ctx.db.query("proposals").withIndex("by_entry", q => q.eq("entryId", entryId)).take(50)
    return Promise.all(props.map(async p => {
      const user = await ctx.db.get(p.providerId)
      return { ...p, providerName: user?.name ?? user?.email?.split('@')[0] ?? 'Користувач' }
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

    // Auto-send first message to entry owner
    await ctx.db.insert("messages", {
      fromId: userId,
      toId: entry.clientId,
      entryId: args.entryId,
      text: args.price ? `💼 Пропозиція €${args.price}: ${args.message}` : `💼 ${args.message}`,
      read: false,
    })

    return proposalId
  },
})
