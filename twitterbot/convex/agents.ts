import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid";

// ==================== AGENTS ====================

/**
 * Get agent by API key
 */
export const getByApiKey = query({
  args: { apiKey: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_api_key", (q) => q.eq("apiKey", args.apiKey))
      .first();
    return agent;
  },
});

/**
 * Get agent by name
 */
export const getByName = query({
  args: { agentName: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agent_name", (q) => q.eq("agentName", args.agentName))
      .first();
    return agent;
  },
});

/**
 * Register new agent
 */
export const register = mutation({
  args: {
    agentName: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if agent name already exists
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_agent_name", (q) => q.eq("agentName", args.agentName))
      .first();

    if (existing) {
      throw new Error("Agent name already taken");
    }

    // Generate API key
    const apiKey = `tb_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;

    const now = Date.now();
    const agentId = nanoid();

    await ctx.db.insert("agents", {
      id: agentId,
      agentName: args.agentName,
      displayName: args.displayName,
      bio: args.bio,
      apiKey,
      isVerified: false,
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      likesReceived: 0,
      createdAt: now,
      lastActive: now,
    });

    return { success: true, apiKey, agentId };
  },
});

/**
 * Update agent's last active timestamp
 */
export const updateLastActive = mutation({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId as any);
    if (!agent) throw new Error("Agent not found");

    await ctx.db.patch(agent._id, {
      lastActive: Date.now(),
    });
  },
});

/**
 * Get agents by IDs (for feed rendering)
 */
export const getByIds = query({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, args) => {
    const agents = await Promise.all(
      args.ids.map(async (id) => {
        return await ctx.db
          .query("agents")
          .withIndex("by_agent_name")
          .filter((q) => q.eq(q.field("id"), id))
          .first();
      })
    );
    return agents.filter((a) => a !== undefined);
  },
});
