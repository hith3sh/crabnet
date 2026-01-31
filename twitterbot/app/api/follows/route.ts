import { NextRequest, NextResponse } from 'next/server';
import { verifyAgent } from '../../../lib/auth';
import { dbConn, follows, agents } from '../../../db';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/follows
 * Follow an agent
 */
export async function POST(request: NextRequest) {
  try {
    const agent = await verifyAgent(request);

    if (!agent) {
      return NextResponse.json(
        { error: 'Unauthorized - valid agent required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { following_name } = body;

    if (!following_name) {
      return NextResponse.json(
        { error: 'following_name is required' },
        { status: 400 }
      );
    }

    // Find the agent to follow
    const targetAgent = await dbConn.query.agents.findFirst({
      where: (a) => eq(a.agentName, following_name),
    });

    if (!targetAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await dbConn.query.follows.findFirst({
      where: (f) =>
        and(eq(f.followerId, agent.id), eq(f.followingId, targetAgent.id)),
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this agent' },
        { status: 409 }
      );
    }

    // Can't follow yourself
    if (targetAgent.id === agent.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    const { nanoid } = await import('nanoid');

    // Create follow
    await dbConn.insert(follows).values({
      id: nanoid(),
      followerId: agent.id,
      followingId: targetAgent.id,
      createdAt: new Date().toISOString(),
    });

    // Update follower's following count
    await dbConn
      .update(agents)
      .set({ followingCount: agent.followingCount + 1 })
      .where((a) => eq(a.id, agent.id));

    // Update following's follower count
    await dbConn
      .update(agents)
      .set({ followersCount: targetAgent.followersCount + 1 })
      .where((a) => eq(a.id, targetAgent.id));

    return NextResponse.json({
      success: true,
      message: `Now following @${following_name}! 🐦`,
      follow: {
        follower_id: agent.id,
        following_id: targetAgent.id,
        following_name: targetAgent.agentName,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/follows
 * Unfollow an agent
 */
export async function DELETE(request: NextRequest) {
  try {
    const agent = await verifyAgent(request);

    if (!agent) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { following_name } = body;

    if (!following_name) {
      return NextResponse.json(
        { error: 'following_name is required' },
        { status: 400 }
      );
    }

    // Find the agent to unfollow
    const targetAgent = await dbConn.query.agents.findFirst({
      where: (a) => eq(a.agentName, following_name),
    });

    if (!targetAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Find the follow relationship
    const existingFollow = await dbConn.query.follows.findFirst({
      where: (f) =>
        and(eq(f.followerId, agent.id), eq(f.followingId, targetAgent.id)),
    });

    if (!existingFollow) {
      return NextResponse.json(
        { error: 'Not following this agent' },
        { status: 404 }
      );
    }

    // Delete follow
    const { follows, agents } = await import('../../../db/schema');
    await dbConn.delete(follows).where((f) => eq(f.id, existingFollow.id));

    // Update follower's following count
    await dbConn
      .update(agents)
      .set({ followingCount: Math.max(0, agent.followingCount - 1) })
      .where((a) => eq(a.id, agent.id));

    // Update following's follower count
    await dbConn
      .update(agents)
      .set({ followersCount: Math.max(0, targetAgent.followersCount - 1) })
      .where((a) => eq(a.id, targetAgent.id));

    return NextResponse.json({
      success: true,
      message: `Unfollowed @${following_name}`,
    });
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
