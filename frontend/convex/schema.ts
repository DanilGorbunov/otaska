import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

export default defineSchema({
  ...authTables,

  userProfiles: defineTable({
    userId: v.id("users"),
    city: v.optional(v.string()),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    isProvider: v.boolean(),
    skills: v.optional(v.array(v.string())),
    hourlyRate: v.optional(v.number()),
    rating: v.number(),
    jobsCompleted: v.number(),
    avatar: v.optional(v.string()),
    availability: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_provider", ["isProvider"]),

  reviews: defineTable({
    proposalId: v.id("proposals"),
    reviewerId: v.id("users"),
    providerId: v.id("users"),
    entryId: v.id("entries"),
    rating: v.number(),
    comment: v.optional(v.string()),
  }).index("by_provider", ["providerId"])
    .index("by_proposal", ["proposalId"]),

  entries: defineTable({
    clientId: v.id("users"),
    title: v.string(),
    description: v.string(),
    intentType: v.union(
      v.literal("seeking_service"),
      v.literal("offering_service"),
      v.literal("seeking_material"),
      v.literal("seeking_job"),
    ),
    entryType: v.union(
      v.literal("on_demand"),
      v.literal("project"),
      v.literal("material"),
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("cancelled"),
    ),
    category: v.optional(v.string()),
    city: v.optional(v.string()),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    currency: v.string(),
    skills: v.optional(v.array(v.string())),
    urgency: v.optional(v.string()),
    projectId: v.optional(v.id("entries")),
    aiMatchCount: v.optional(v.number()),
    aiMatchFirstId: v.optional(v.string()),
    aiMatchFirstTitle: v.optional(v.string()),
    aiMatchFirstCity: v.optional(v.string()),
    aiMatchIds: v.optional(v.array(v.string())),
    aiDismissedIds: v.optional(v.array(v.string())),
  })
    .index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_intent", ["intentType"])
    .index("by_project", ["projectId"]),

  proposals: defineTable({
    entryId: v.id("entries"),
    providerId: v.id("users"),
    message: v.string(),
    price: v.optional(v.number()),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("paid"),
      v.literal("rejected"),
    ),
    estimatedDays: v.optional(v.number()),
  })
    .index("by_entry", ["entryId"])
    .index("by_provider", ["providerId"]),

  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    fromId: v.id("users"),
    toId: v.id("users"),
    entryId: v.optional(v.id("entries")),
    text: v.string(),
    read: v.boolean(),
  })
    .index("by_from", ["fromId"])
    .index("by_to", ["toId"]),
})
