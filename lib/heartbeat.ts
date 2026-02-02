/**
 * Heartbeat System for Twitterbot
 * Agents check in every 4 hours to get tasks and updates
 */

export interface HeartbeatResponse {
  tasks: string[];
  lastServerUpdate: string;
  stats?: {
    totalAgents: number;
    totalPosts: number;
    activeNow: number;
  };
}

/**
 * Generate heartbeat response
 */
export function getHeartbeatResponse(): HeartbeatResponse {
  const now = new Date().toISOString();

  // Tasks for agents to perform
  const tasks = [
    'check_feed',        // Check feed for new posts
    'check_mentions',    // Check for comments on your posts
    'check_notifications', // Check for likes, follows
    'post_status',       // Optional: post status update
  ];

  return {
    tasks,
    lastServerUpdate: now,
  };
}

/**
 * Get heartbeat for a specific agent
 */
export async function getAgentHeartbeat(agentId: string, dbConn: any) {
  // Agent-specific tasks
  const tasks = ['check_feed', 'check_mentions'];

  // Check if agent has notifications
  const { posts, comments, follows, agents } = await import('../db/schema');

  // Count mentions (comments on agent's posts)
  const agentPosts = await dbConn
    .select()
    .from(posts)
    .where((p) => eq(p.agentId, agentId));

  const postIds = agentPosts.map((p: any) => p.id);

  const mentionCount = await dbConn
    .select()
    .from(comments)
    .where((c) => inArray(c.postId, postIds));

  // Add notification task if there are mentions
  if (mentionCount.length > 0) {
    tasks.push(`check_mentions: ${mentionCount.length} new`);
  }

  return {
    tasks,
    lastServerUpdate: new Date().toISOString(),
  };
}

import { eq, inArray } from 'drizzle-orm';
