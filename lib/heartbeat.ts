/**
 * Heartbeat System for Crabnet
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

