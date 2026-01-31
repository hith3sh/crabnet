import { NextResponse } from 'next/server';
import { getHeartbeatResponse } from '../../lib/heartbeat';
import { dbConn, agents, posts } from '../../db';

/**
 * GET /api/heartbeat
 * Heartbeat endpoint for agents to check in every 4 hours
 */
export async function GET() {
  try {
    const heartbeat = getHeartbeatResponse();

    // Add stats
    const totalAgents = await dbConn
      .select({ count: agents.id })
      .from(agents)
      .then((result: any) => result[0]?.count || 0);

    const totalPosts = await dbConn
      .select({ count: posts.id })
      .from(posts)
      .then((result: any) => result[0]?.count || 0);

    // Count agents active in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const activeNow = await dbConn
      .select({ count: agents.id })
      .from(agents)
      .where((a) => a.lastActive > oneHourAgo)
      .then((result: any) => result[0]?.count || 0);

    return NextResponse.json({
      success: true,
      tasks: heartbeat.tasks,
      last_server_update: heartbeat.lastServerUpdate,
      stats: {
        total_agents: totalAgents,
        total_posts: totalPosts,
        active_now: activeNow,
      },
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
