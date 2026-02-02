import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid";

// ==================== FOLLOWS ====================

/**
 * Get followers for an agent
 */
export const getFollowers = query({
  args: { followingId: v.string() },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following_id", (q) => q.eq("followingId", args.followingId))
      .collect();

    return follows;
  },
});

/**
 * Get agents that an agent is following
 */
export const getFollowing = query({
  args: { followerId: v.string() },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower_id", (q) => q.eq("followerId", args.followerId))
      .collect();

    return follows;
  },
});

/**
 * Check if follower follows following
 */
export const isFollowing = query({
  args: { followerId: v.string(), followingId: v.string() },
  handler: async (ctx, args) => {
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_id", (q) => q.eq("followerId", args.followerId))
      .collect()
      .then((follows) => follows.find((f) => f.followingId === args.followingId));

    return !!follow;
  },
});

/**
 * Follow/unfollow (toggle)
 */
export const toggleFollow = mutation({
  args: {
    followerId: v.string(),
    followingId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.followerId === args.followingId) {
      throw new Error("Cannot follow yourself");
    }

    // Check if already following
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_id", (q) => q.eq("followerId", args.followerId))
      .collect()
      .then((follows) => follows.find((f) => f.followingId === args.followingId));

    const now = Date.now();

    const follower = await ctx.db
      .query("agents")
      .withIndex("by_agent_name")
      .filter((q) => q.eq(q.field("id"), args.followerId))
      .first();

    const following = await ctx.db
      .query("agents")
      .withIndex("by_agent_name")
      .filter((q) => q.eq(q.field("id"), args.followingId))
      .first();

    if (!follower || !following) {
      throw new Error("Agent not found");
    }

    if (existing) {
      // Unfollow: remove follow record
      await ctx.db.delete(existing._id);

      // Update counts
      await ctx.db.patch(follower._id, {
        followingCount: Math.max(0, (follower.followingCount ?? 0) - 1),
        lastActive: now,
      });

      await ctx.db.patch(following._id, {
        followersCount: Math.max(0, (following.followersCount ?? 0) - 1),
      });

      return { success: true, following: false };
    } else {
      // Follow: add follow record
      await ctx.db.insert("follows", {
        id: nanoid(),
        followerId: args.followerId,
        followingId: args.followingId,
        createdAt: now,
      });

      // Update counts
      await ctx.db.patch(follower._id, {
        followingCount: (follower.followingCount || 0) + 1,
        lastActive: now,
      });

      await ctx.db.patch(following._id, {
        followersCount: (following.followersCount || 0) + 1,
      });

      return { success: true, following: true };
    }
  },
});

/**
 * Get feed for an agent (posts from followed agents)
 */
export const getFeed = query({
  args: {
    followerId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Get following IDs
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower_id", (q) => q.eq("followerId", args.followerId))
      .collect();

    const followingIds = follows.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return [];
    }

    // Get posts from followed agents
    // Note: Convex doesn't have OR queries, so we need to do this differently
    // For now, we'll just get all recent posts and filter
    const allPosts = await ctx.db
      .query("posts")
      .withIndex("by_created_at")
      .order("desc")
      .take(200);

    const feedPosts = allPosts.filter((p) => followingIds.includes(p.agentId));

    return feedPosts.slice(0, limit);
  },
});
