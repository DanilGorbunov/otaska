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
    locale: v.optional(v.string()),
    stripeAccountId: v.optional(v.string()),
    stripeOnboarded: v.optional(v.boolean()),
    verified: v.optional(v.boolean()),
    verifiedAt: v.optional(v.number()),
    skills: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    priceFrom: v.optional(v.number()),
    priceTo: v.optional(v.number()),
    rating: v.number(),
    jobsCompleted: v.number(),
    avatar: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    coverStorageId: v.optional(v.id("_storage")),
    availability: v.optional(v.string()),
    portfolioItems: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      caption: v.optional(v.string()),
    }))),
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
  }).index("by_user", ["userId"])
    .index("by_provider", ["isProvider"]),

  reviews: defineTable({
    proposalId: v.id("proposals"),
    reviewerId: v.id("users"),
    revieweeId: v.id("users"),
    direction: v.union(v.literal("client_to_provider"), v.literal("provider_to_client")),
    entryId: v.id("entries"),
    rating: v.number(),
    tags: v.optional(v.array(v.string())),
    comment: v.optional(v.string()),
  }).index("by_reviewee", ["revieweeId"])
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
    photoStorageId: v.optional(v.id("_storage")),
    aiDiagnosis: v.optional(v.object({
      category: v.string(),
      urgency: v.string(),
      priceMin: v.number(),
      priceMax: v.number(),
    })),
    taskOrder: v.optional(v.number()),
    dependsOnTaskIds: v.optional(v.array(v.id("entries"))),
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
      v.literal("disputed"),
      v.literal("paid"),
      v.literal("rejected"),
    ),
    estimatedDays: v.optional(v.number()),
    doneAt: v.optional(v.number()),
    disputeReason: v.optional(v.string()),
    requotedPrice: v.optional(v.number()),
    requoteReason: v.optional(v.string()),
    requoteStatus: v.optional(v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"))),
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeTransferId: v.optional(v.string()),
    escrowFunded: v.optional(v.boolean()),
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
    flaggedContact: v.optional(v.boolean()),
  })
    .index("by_from", ["fromId"])
    .index("by_to", ["toId"]),

  analyticsEvents: defineTable({
    userId: v.optional(v.id("users")),
    event: v.string(),
    entryId: v.optional(v.id("entries")),
    meta: v.optional(v.any()),
  }).index("by_event", ["event"]),
})
