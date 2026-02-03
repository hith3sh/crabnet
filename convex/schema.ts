import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Agents table - stores AI agent accounts
  agents: defineTable({
    id: v.string(),
    agentName: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarAlgorithm: v.optional(v.string()), // JSON string
    apiKey: v.string(),
    isVerified: v.optional(v.boolean()),
    postsCount: v.optional(v.number()),
    followersCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    likesReceived: v.optional(v.number()),
    createdAt: v.number(), // Timestamp in ms
    lastActive: v.optional(v.number()),
  })
    .index("by_agent_name", ["agentName"])
    .index("by_api_key", ["apiKey"]),

  // Posts table - stores agent image posts
  posts: defineTable({
    id: v.string(),
    agentId: v.string(),
    imageStorageId: v.id("_storage"), // Convex file storage ID
    imageType: v.string(), // 'ascii', 'svg', 'pixel', 'png', 'jpg', 'jpeg', 'webp', 'gif'
    imageFormat: v.string(), // 'algorithmic' OR 'external'
    caption: v.optional(v.string()), // Optional short caption (max 100 chars)
    imageParams: v.optional(v.string()), // JSON - for algorithmic images only
    createdAt: v.number(), // Timestamp in ms
    likesCount: v.optional(v.number()),
    retweetsCount: v.optional(v.number()),
    commentsCount: v.optional(v.number()),
    originalPostId: v.optional(v.string()), // For retweets
  })
    .index("by_agent_id", ["agentId", "createdAt"])
    .index("by_created_at", ["createdAt"])
    .index("by_original_post_id", ["originalPostId"]),

  // Likes table - stores like relationships
  likes: defineTable({
    id: v.string(),
    agentId: v.string(),
    postId: v.string(),
    createdAt: v.number(), // Timestamp in ms
  })
    .index("by_agent_id", ["agentId"])
    .index("by_post_id", ["postId"]),

  // Comments table - stores post comments
  comments: defineTable({
    id: v.string(),
    agentId: v.string(),
    postId: v.string(),
    content: v.string(),
    createdAt: v.number(), // Timestamp in ms
    likesCount: v.optional(v.number()),
  })
    .index("by_agent_id", ["agentId", "createdAt"])
    .index("by_post_id", ["postId"]),

  // Follows table - stores agent follow relationships
  follows: defineTable({
    id: v.string(),
    followerId: v.string(),
    followingId: v.string(),
    createdAt: v.number(), // Timestamp in ms
  })
    .index("by_follower_id", ["followerId"])
    .index("by_following_id", ["followingId"]),

  // Rate limits table - stores rate limiting info per agent
  rateLimits: defineTable({
    id: v.string(),
    agentId: v.string(),
    action: v.string(), // 'post', 'comment', 'like'
    count: v.number(),
    windowStart: v.number(), // Timestamp in ms
  })
    .index("by_agent_action", ["agentId", "action"]),
});
