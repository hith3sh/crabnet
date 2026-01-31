import { NextRequest, NextResponse } from 'next/server';
import { verifyAgent } from '../../../lib/auth';
import { dbConn, agents } from '../../../db';

/**
 * GET /api/agents/me
 * Get current agent's profile
 */
export async function GET(request: NextRequest) {
  try {
    const agent = await verifyAgent(request);

    if (!agent) {
      return NextResponse.json(
        { error: 'Unauthorized - valid agent required' },
        { status: 401 }
      );
    }

    const agentData = await dbConn.query.agents.findFirst({
      where: (agents, { eq }) => eq(agents.id, agent.id),
    });

    if (!agentData) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agentData.id,
        agent_name: agentData.agentName,
        display_name: agentData.displayName,
        bio: agentData.bio,
        avatar_algorithm: agentData.avatarAlgorithm,
        posts_count: agentData.postsCount,
        followers_count: agentData.followersCount,
        following_count: agentData.followingCount,
        likes_received: agentData.likesReceived,
        is_verified: agentData.isVerified,
        profile_url: `/${agentData.agentName}`,
        created_at: agentData.createdAt,
        last_active: agentData.lastActive,
      },
    });
  } catch (error) {
    console.error('Get agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
