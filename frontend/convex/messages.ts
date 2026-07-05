import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"

// All conversations for current user (unique partners)
export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const sent = await ctx.db.query("messages").withIndex("by_from", q => q.eq("fromId", userId)).take(200)
    const received = await ctx.db.query("messages").withIndex("by_to", q => q.eq("toId", userId)).take(200)

    // Group by partner
    const partnerMap = new Map<string, { lastMsg: typeof sent[0]; unread: number }>()
    for (const m of [...sent, ...received]) {
      const partnerId = m.fromId === userId ? m.toId : m.fromId
      const existing = partnerMap.get(partnerId)
      const isNewer = !existing || m._creationTime > existing.lastMsg._creationTime
      const unread = (existing?.unread ?? 0) + (m.toId === userId && !m.read ? 1 : 0)
      if (isNewer) {
        partnerMap.set(partnerId, { lastMsg: m, unread: existing?.unread ?? 0 })
      } else {
        partnerMap.set(partnerId, { ...existing!, unread })
      }
    }

    // Load partner profiles
    const result = []
    for (const [partnerId, { lastMsg, unread }] of partnerMap) {
      const partner = await ctx.db.get(partnerId as typeof userId)
      result.push({ partnerId, partnerName: partner?.name ?? partner?.email?.split('@')[0] ?? 'Користувач', lastText: lastMsg.text, lastTime: lastMsg._creationTime, unread, entryId: lastMsg.entryId })
    }
    return result.sort((a, b) => b.lastTime - a.lastTime)
  },
})

// Messages between current user and a partner
export const listWithUser = query({
  args: { partnerId: v.id("users") },
  handler: async (ctx, { partnerId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const sent = await ctx.db.query("messages").withIndex("by_from", q => q.eq("fromId", userId)).take(200)
    const received = await ctx.db.query("messages").withIndex("by_to", q => q.eq("toId", userId)).take(200)

    const all = [...sent.filter(m => m.toId === partnerId), ...received.filter(m => m.fromId === partnerId)]
    return all.sort((a, b) => a._creationTime - b._creationTime)
  },
})

export const send = mutation({
  args: { toId: v.id("users"), text: v.string(), entryId: v.optional(v.id("entries")) },
  handler: async (ctx, { toId, text, entryId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error("Not authenticated")

    await ctx.db.insert("messages", { fromId: userId, toId, text, read: false, entryId })

    // Push notification to recipient
    const recipientSubs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", toId))
      .collect()
    if (recipientSubs.length > 0) {
      const sender = await ctx.db.get(userId)
      const senderName = sender?.name ?? "Повідомлення"
      await ctx.scheduler.runAfter(0, internal.pushNotifications.send, {
        subscriptions: recipientSubs.map(s => ({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth })),
        title: senderName,
        body: text.slice(0, 100),
        url: `/app/chat/${userId}`,
      })
    }
  },
})

export const markRead = mutation({
  args: { partnerId: v.id("users") },
  handler: async (ctx, { partnerId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return
    const msgs = await ctx.db.query("messages").withIndex("by_to", q => q.eq("toId", userId)).take(200)
    for (const m of msgs.filter(m => m.fromId === partnerId && !m.read)) {
      await ctx.db.patch(m._id, { read: true })
    }
  },
})

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return 0
    const msgs = await ctx.db.query("messages").withIndex("by_to", q => q.eq("toId", userId)).take(200)
    return msgs.filter(m => !m.read).length
  },
})
