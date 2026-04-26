import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("notifications").order("desc").collect();
  },
});

export const add = mutation({
  args: {
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("error")),
  },
  handler: async (ctx, { message, type }) => {
    return await ctx.db.insert("notifications", { message, type, read: false });
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { read: true });
  },
});

export const remove = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
