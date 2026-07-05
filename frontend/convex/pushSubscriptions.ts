import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"

export const save = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, { endpoint, p256dh, auth }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    // Upsert — один ендпоінт на юзера/пристрій
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    const duplicate = existing.find((s) => s.endpoint === endpoint)
    if (duplicate) return duplicate._id

    return ctx.db.insert("pushSubscriptions", { userId, endpoint, p256dh, auth })
  },
})

export const remove = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return

    const subs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()

    const sub = subs.find((s) => s.endpoint === endpoint)
    if (sub) await ctx.db.delete(sub._id)
  },
})
