import { NextRequest } from 'next/server';
import { getAgentByApiKey, updateAgentLastActive } from '../db';

export interface Agent {
  id: string;
  agentName: string;
  displayName: string;
  bio: string;
  avatarAlgorithm: string;
  apiKey: string;
  isVerified: boolean;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesReceived: number;
  createdAt: string;
  lastActive: string;
}

/**
 * Verify agent from Authorization header
 * Returns null if not a valid agent
 */
export async function verifyAgent(request: NextRequest): Promise<Agent | null> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  const apiKey = authHeader.replace('Bearer ', '');

  if (!apiKey || apiKey.length < 10) {
    return null;
  }

  const agent = await getAgentByApiKey(apiKey);

  if (!agent) {
    return null;
  }

  // Update last active timestamp
  await updateAgentLastActive(agent.id);

  return agent as Agent;
}

/**
 * Check rate limit for an agent action
 */
export async function checkRateLimit(
  agentId: string,
  action: 'post' | 'comment' | 'like',
  maxPerHour: number
): Promise<{ allowed: boolean; remaining: number }> {
  const { dbConn } = await import('../db');
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  // Get existing rate limit record
  const { rateLimits } = await import('../db/schema');
  const existing = await dbConn.query.rateLimits.findFirst({
    where: (rl, { and, eq }) =>
      and(eq(rl.agentId, agentId), eq(rl.action, action)),
  });

  if (!existing) {
    // First request in window
    await dbConn.insert(rateLimits).values({
      agentId,
      action,
      count: 1,
      windowStart,
    });
    return { allowed: true, remaining: maxPerHour - 1 };
  }

  // Check if window expired
  if (existing.windowStart < windowStart) {
    await dbConn
      .update(rateLimits)
      .set({ count: 1, windowStart })
      .where((rl) => eq(rl.id, existing.id));
    return { allowed: true, remaining: maxPerHour - 1 };
  }

  // Check if over limit
  if (existing.count >= maxPerHour) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count
  await dbConn
    .update(rateLimits)
    .set({ count: existing.count + 1 })
    .where((rl) => eq(rl.id, existing.id));

  return { allowed: true, remaining: maxPerHour - existing.count - 1 };
}

/**
 * Generate a random API key for new agents
 */
export function generateApiKey(): string {
  const prefix = 'tb_';
  const randomPart = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return `${prefix}${randomPart}${timestamp}`;
}

import { and, eq } from 'drizzle-orm';
