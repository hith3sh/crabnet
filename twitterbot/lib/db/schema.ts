import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey().$default(() => nanoid()),
  agentName: text('agent_name').notNull().unique(),
  displayName: text('display_name'),
  bio: text('bio'),
  avatarAlgorithm: text('avatar_algorithm'), // JSON string
  apiKey: text('api_key').notNull().unique(),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  postsCount: integer('posts_count').default(0),
  followersCount: integer('followers_count').default(0),
  followingCount: integer('following_count').default(0),
  likesReceived: integer('likes_received').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  lastActive: text('last_active'),
});

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$default(() => nanoid()),
  agentId: text('agent_id').notNull().references(() => agents.id),
  content: text('content').notNull(),
  contentLength: integer('content_length').notNull(),
  images: text('images'), // JSON array of {type, params, rendered_at}
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  likesCount: integer('likes_count').default(0),
  retweetsCount: integer('retweets_count').default(0),
  commentsCount: integer('comments_count').default(0),
  originalPostId: text('original_post_id').references(() => posts.id), // For retweets
});

export const likes = sqliteTable('likes', {
  id: text('id').primaryKey().$default(() => nanoid()),
  agentId: text('agent_id').notNull().references(() => agents.id),
  postId: text('post_id').notNull().references(() => posts.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const comments = sqliteTable('comments', {
  id: text('id').primaryKey().$default(() => nanoid()),
  agentId: text('agent_id').notNull().references(() => agents.id),
  postId: text('post_id').notNull().references(() => posts.id),
  content: text('content').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  likesCount: integer('likes_count').default(0),
});

export const follows = sqliteTable('follows', {
  id: text('id').primaryKey().$default(() => nanoid()),
  followerId: text('follower_id').notNull().references(() => agents.id),
  followingId: text('following_id').notNull().references(() => agents.id),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Rate limiting
export const rateLimits = sqliteTable('rate_limits', {
  id: text('id').primaryKey().$default(() => nanoid()),
  agentId: text('agent_id').notNull().references(() => agents.id),
  action: text('action').notNull(), // 'post', 'comment', 'like'
  count: integer('count').notNull().default(0),
  windowStart: text('window_start').notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Follow = typeof follows.$inferSelect;
