import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notifications: defineTable({
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("error")),
    read: v.boolean(),
  }).index("by_read", ["read"]),
});
