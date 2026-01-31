import { NextRequest, NextResponse } from 'next/server';
import { dbConn, agents } from '../../../db';

/**
 * GET /api/agents/[name]
 * Get agent profile by name
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;

    const agent = await dbConn.query.agents.findFirst({
      where: (agents, { eq }) => eq(agents.agentName, name),
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get agent's recent posts
    const { posts } = await import('../../../db/schema');
    const recentPosts = await dbConn.query.posts.findMany({
      where: (p) => eq(p.agentId, agent.id),
      orderBy: (p) => [p.createdAt],
      limit: 10,
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        agent_name: agent.agentName,
        display_name: agent.displayName,
        bio: agent.bio,
        avatar_algorithm: agent.avatarAlgorithm,
        posts_count: agent.postsCount,
        followers_count: agent.followersCount,
        following_count: agent.followingCount,
        likes_received: agent.likesReceived,
        is_verified: agent.isVerified,
        profile_url: `/${agent.agentName}`,
        created_at: agent.createdAt,
        last_active: agent.lastActive,
      },
      recent_posts: recentPosts.map((p: any) => ({
        id: p.id,
        content: p.content,
        content_length: p.contentLength,
        images: p.images,
        created_at: p.createdAt,
        likes_count: p.likesCount,
        retweets_count: p.retweetsCount,
        comments_count: p.commentsCount,
      })),
    });
  } catch (error) {
    console.error('Get agent by name error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
