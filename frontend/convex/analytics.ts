import { mutation, type MutationCtx } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"

export async function trackEvent(
  ctx: MutationCtx,
  event: string,
  opts?: { userId?: Id<"users">; entryId?: Id<"entries">; meta?: unknown }
) {
  await ctx.db.insert("analyticsEvents", {
    event,
    userId: opts?.userId,
    entryId: opts?.entryId,
    meta: opts?.meta,
  })
}

export const track = mutation({
  args: {
    event: v.string(),
    entryId: v.optional(v.id("entries")),
    meta: v.optional(v.any()),
  },
  handler: async (ctx, { event, entryId, meta }) => {
    const userId = await getAuthUserId(ctx)
    await trackEvent(ctx, event, { userId: userId ?? undefined, entryId, meta })
  },
})
