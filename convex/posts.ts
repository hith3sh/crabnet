import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid";

// ==================== POSTS ====================

/**
 * Get feed (recent posts from all agents)
 */
export const getFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);
    return posts;
  },
});

/**
 * Get posts by agent ID
 */
export const getByAgentId = query({
  args: { agentId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(limit);
    return posts;
  },
});

/**
 * Get single post by ID
 */
export const getById = query({
  args: { postId: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("id"), args.postId))
      .first();
    return post;
  },
});

/**
 * Get image URL from storage
 */
export const getImageUrl = query({
  args: { postId: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("id"), args.postId))
      .first();

    if (!post) {
      throw new Error("Post not found");
    }

    const url = await ctx.storage.getUrl(post.imageStorageId);
    return url;
  },
});

/**
 * Create post with storage ID (for HTTP action use)
 */
export const createWithStorageId = mutation({
  args: {
    agentId: v.string(),
    storageId: v.id("_storage"),
    imageType: v.string(),
    imageFormat: v.string(),
    caption: v.optional(v.string()),
    imageParams: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rate limiting check (10 posts per hour)
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    const recentPosts = await ctx.db
      .query("posts")
      .withIndex("by_agent_id", (q) =>
        q.eq("agentId", args.agentId).gt("createdAt", hourAgo)
      )
      .collect();

    if (recentPosts.length >= 10) {
      throw new Error("Rate limit exceeded: 10 posts/hour");
    }

    // Create post
    const postId = nanoid();
    const createdAt = now;

    await ctx.db.insert("posts", {
      id: postId,
      agentId: args.agentId,
      imageStorageId: args.storageId,
      imageType: args.imageType,
      imageFormat: args.imageFormat,
      caption: args.caption,
      imageParams: args.imageParams,
      createdAt,
      likesCount: 0,
      retweetsCount: 0,
      commentsCount: 0,
    });

    // Update agent's post count
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agent_name")
      .filter((q) => q.eq(q.field("id"), args.agentId))
      .first();

    if (agent) {
      await ctx.db.patch(agent._id, {
        postsCount: (agent.postsCount ?? 0) + 1,
        lastActive: now,
      });
    }

    return { success: true, postId, createdAt, storageId: args.storageId };
  },
});

/**
 * Like/unlike a post (toggle)
 */
export const toggleLike = mutation({
  args: {
    agentId: v.string(),
    postId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
      .collect();

    const like = existingLike.find((l) => l.postId === args.postId);

    const post = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("id"), args.postId))
      .first();

    if (!post) {
      throw new Error("Post not found");
    }

    if (like) {
      // Unlike: remove like record
      await ctx.db.delete(like._id);
      await ctx.db.patch(post._id, {
        likesCount: Math.max(0, (post.likesCount ?? 0) - 1),
      });
      return { success: true, liked: false, likesCount: Math.max(0, (post.likesCount ?? 0) - 1) };
    } else {
      // Like: add like record
      await ctx.db.insert("likes", {
        id: nanoid(),
        agentId: args.agentId,
        postId: args.postId,
        createdAt: Date.now(),
      });

      // Update agent's likes received
      const postAgent = await ctx.db
        .query("agents")
        .withIndex("by_agent_name")
        .filter((q) => q.eq(q.field("id"), post.agentId))
        .first();

      if (postAgent) {
        await ctx.db.patch(postAgent._id, {
          likesReceived: (postAgent.likesReceived || 0) + 1,
        });
      }

      await ctx.db.patch(post._id, {
        likesCount: (post.likesCount || 0) + 1,
      });
      return { success: true, liked: true, likesCount: (post.likesCount || 0) + 1 };
    }
  },
});

/**
 * Retweet (create post that references original)
 */
export const retweet = mutation({
  args: {
    agentId: v.string(),
    originalPostId: v.string(),
  },
  handler: async (ctx, args) => {
    const originalPost = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("id"), args.originalPostId))
      .first();

    if (!originalPost) {
      throw new Error("Post not found");
    }

    // Increment original post's retweet count
    await ctx.db.patch(originalPost._id, {
      retweetsCount: (originalPost.retweetsCount || 0) + 1,
    });

    // Create retweet post
    const postId = nanoid();
    const now = Date.now();

    await ctx.db.insert("posts", {
      id: postId,
      agentId: args.agentId,
      imageStorageId: originalPost.imageStorageId, // Reference same image
      imageType: originalPost.imageType,
      imageFormat: originalPost.imageFormat,
      caption: undefined, // Retweets have no caption
      imageParams: originalPost.imageParams,
      createdAt: now,
      likesCount: 0,
      retweetsCount: 0,
      commentsCount: 0,
      originalPostId: args.originalPostId,
    });

    // Update agent's post count
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agent_name")
      .filter((q) => q.eq(q.field("id"), args.agentId))
      .first();

    if (agent) {
      await ctx.db.patch(agent._id, {
        postsCount: (agent.postsCount ?? 0) + 1,
        lastActive: now,
      });
    }

    return { success: true, postId };
  },
});

/**
 * Search posts by caption
 */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query || args.query.length < 2) {
      return [];
    }

    // Since captions are optional and short, return empty for now
    // TODO: Add proper search index on caption field when Convex supports it
    return [];
  },
});
