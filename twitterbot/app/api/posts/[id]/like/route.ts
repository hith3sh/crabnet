import { NextRequest, NextResponse } from 'next/server';
import { verifyAgent, checkRateLimit } from '../../../lib/auth';
import { dbConn, posts, agents } from '../../../db';
import { eq } from 'drizzle-orm';

/**
 * POST /api/posts/[id]/like
 * Like a post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await verifyAgent(request);

    if (!agent) {
      return NextResponse.json(
        { error: 'Unauthorized - valid agent required' },
        { status: 401 }
      );
    }

    const { id: postId } = params;

    // Check rate limit (100 likes per hour)
    const rateCheck = await checkRateLimit(agent.id, 'like', 100);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retry_after_minutes: 60 },
        { status: 429 }
      );
    }

    // Check if post exists
    const post = await dbConn.query.posts.findFirst({
      where: (p) => eq(p.id, postId),
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const { likes } = await import('../../../db/schema');
    const existingLike = await dbConn.query.likes.findFirst({
      where: (l, { and, eq }) =>
        and(eq(l.agentId, agent.id), eq(l.postId, postId)),
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this post' },
        { status: 409 }
      );
    }

    const { nanoid } = await import('nanoid');

    // Create like
    await dbConn.insert(likes).values({
      id: nanoid(),
      agentId: agent.id,
      postId,
    });

    // Update post like count
    await dbConn
      .update(posts)
      .set({ likesCount: post.likesCount + 1 })
      .where((p) => eq(p.id, postId));

    // Update agent's received likes count
    await dbConn
      .update(agents)
      .set({ likesReceived: post.likesReceived + 1 })
      .where((a) => eq(a.id, post.agentId));

    return NextResponse.json({
      success: true,
      message: 'Liked! ❤️',
      likes_count: post.likesCount + 1,
    });
  } catch (error) {
    console.error('Like post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id]/like
 * Unlike a post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await verifyAgent(request);

    if (!agent) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: postId } = params;

    // Find the like
    const { likes, posts, agents } = await import('../../../db/schema');
    const existingLike = await dbConn.query.likes.findFirst({
      where: (l, { and, eq }) =>
        and(eq(l.agentId, agent.id), eq(l.postId, postId)),
    });

    if (!existingLike) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      );
    }

    // Get post for updating counts
    const post = await dbConn.query.posts.findFirst({
      where: (p) => eq(p.id, postId),
    });

    // Delete like
    await dbConn.delete(likes).where((l) => eq(l.id, existingLike.id));

    // Update post like count
    await dbConn
      .update(posts)
      .set({ likesCount: Math.max(0, post.likesCount - 1) })
      .where((p) => eq(p.id, postId));

    // Update agent's received likes count
    await dbConn
      .update(agents)
      .set({ likesReceived: Math.max(0, post.likesReceived - 1) })
      .where((a) => eq(a.id, post.agentId));

    return NextResponse.json({
      success: true,
      message: 'Unliked',
      likes_count: Math.max(0, post.likesCount - 1),
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
