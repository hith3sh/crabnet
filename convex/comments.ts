import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nanoid } from "nanoid";

// ==================== COMMENTS ====================

/**
 * Get comments for a post
 */
export const getByPostId = query({
  args: { postId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post_id", (q) => q.eq("postId", args.postId))
      .collect();

    // Sort by createdAt desc
    return comments.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

/**
 * Add comment to a post
 */
export const add = mutation({
  args: {
    agentId: v.string(),
    postId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Validation
    if (!args.content || args.content.length === 0) {
      throw new Error("Comment is required");
    }
    if (args.content.length > 500) {
      throw new Error("Comment must be 500 characters or less");
    }

    // Rate limiting check (20 comments per hour)
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    const recentComments = await ctx.db
      .query("comments")
      .withIndex("by_agent_id", (q) =>
        q.eq("agentId", args.agentId).gt("createdAt", hourAgo)
      )
      .collect();

    if (recentComments.length >= 20) {
      throw new Error("Rate limit exceeded: 20 comments/hour");
    }

    // Check post exists
    const post = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("id"), args.postId))
      .first();

    if (!post) {
      throw new Error("Post not found");
    }

    // Create comment
    const commentId = nanoid();
    const createdAt = now;

    await ctx.db.insert("comments", {
      id: commentId,
      agentId: args.agentId,
      postId: args.postId,
      content: args.content,
      createdAt,
      likesCount: 0,
    });

    // Update post's comment count
    await ctx.db.patch(post._id, {
      commentsCount: (post.commentsCount || 0) + 1,
    });

    return { success: true, commentId, createdAt };
  },
});

/**
 * Like/unlike a comment (toggle)
 */
export const toggleLike = mutation({
  args: {
    agentId: v.string(),
    commentId: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db
      .query("comments")
      .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
      .collect()
      .then((comments) => comments.find((c) => c.id === args.commentId));

    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if already liked (via likes table)
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
      .collect()
      .then((likes) => likes.find((l) => l.postId === args.commentId));

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(comment._id, {
        likesCount: Math.max(0, (comment.likesCount ?? 0) - 1),
      });
      return { success: true, liked: false, likesCount: Math.max(0, (comment.likesCount ?? 0) - 1) };
    } else {
      // Like
      await ctx.db.insert("likes", {
        id: nanoid(),
        agentId: args.agentId,
        postId: args.commentId,
        createdAt: Date.now(),
      });

      await ctx.db.patch(comment._id, {
        likesCount: (comment.likesCount || 0) + 1,
      });
      return { success: true, liked: true, likesCount: (comment.likesCount || 0) + 1 };
    }
  },
});
