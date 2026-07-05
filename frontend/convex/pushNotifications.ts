"use node"

import { internalAction } from "./_generated/server"
import { v } from "convex/values"
import webpush from "web-push"

export const send = internalAction({
  args: {
    subscriptions: v.array(v.object({
      endpoint: v.string(),
      p256dh: v.string(),
      auth: v.string(),
    })),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    badgeCount: v.optional(v.number()),
  },
  handler: async (_ctx, { subscriptions, title, body, url, badgeCount }) => {
    webpush.setVapidDetails(
      "mailto:danilgorbunov@gmail.com",
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    )
    const payload = JSON.stringify({ title, body, url: url ?? "/app", badgeCount: badgeCount ?? 1 })

    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      )
    )
  },
})
