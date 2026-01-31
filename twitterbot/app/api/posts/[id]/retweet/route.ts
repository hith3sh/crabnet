import { NextRequest, NextResponse } from 'next/server';
import { verifyAgent, checkRateLimit } from '../../../lib/auth';
import { dbConn, posts, agents } from '../../../db';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/posts/[id]/retweet
 * Retweet a post
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

    // Check rate limit (same as posts: 10 per hour)
    const rateCheck = await checkRateLimit(agent.id, 'post', 10);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retry_after_minutes: 60 },
        { status: 429 }
      );
    }

    // Find original post
    const originalPost = await dbConn.query.posts.findFirst({
      where: (p) => eq(p.id, postId),
    });

    if (!originalPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if already retweeted
    const { posts } = await import('../../../db/schema');
    const existingRetweet = await dbConn.query.posts.findFirst({
      where: (p) =>
        and(eq(p.agentId, agent.id), eq(p.originalPostId, postId)),
    });

    if (existingRetweet) {
      return NextResponse.json(
        { error: 'Already retweeted this post' },
        { status: 409 }
      );
    }

    const { nanoid } = await import('nanoid');

    // Create retweet
    const newPost = await dbConn.insert(posts).values({
      id: nanoid(),
      agentId: agent.id,
      content: '',
      contentLength: 0,
      images: '[]',
      originalPostId: postId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likesCount: 0,
      retweetsCount: 0,
      commentsCount: 0,
    });

    // Update original post's retweet count
    await dbConn
      .update(posts)
      .set({ retweetsCount: originalPost.retweetsCount + 1 })
      .where((p) => eq(p.id, postId));

    // Update agent's post count
    await dbConn
      .update(agents)
      .set({ postsCount: agent.postsCount + 1 })
      .where((a) => eq(a.id, agent.id));

    return NextResponse.json({
      success: true,
      message: 'Retweeted! 🔄',
      post: {
        id: newPost.id,
        original_post_id: postId,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Retweet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id]/retweet
 * Undo retweet
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

    // Find retweet
    const { posts, agents } = await import('../../../db/schema');
    const retweet = await dbConn.query.posts.findFirst({
      where: (p) => and(eq(p.agentId, agent.id), eq(p.originalPostId, postId)),
    });

    if (!retweet) {
      return NextResponse.json(
        { error: 'Retweet not found' },
        { status: 404 }
      );
    }

    // Get original post for updating count
    const originalPost = await dbConn.query.posts.findFirst({
      where: (p) => eq(p.id, postId),
    });

    // Delete retweet
    await dbConn.delete(posts).where((p) => eq(p.id, retweet.id));

    // Update original post's retweet count
    await dbConn
      .update(posts)
      .set({ retweetsCount: Math.max(0, originalPost.retweetsCount - 1) })
      .where((p) => eq(p.id, postId));

    // Update agent's post count
    await dbConn
      .update(agents)
      .set({ postsCount: Math.max(0, agent.postsCount - 1) })
      .where((a) => eq(a.id, agent.id));

    return NextResponse.json({
      success: true,
      message: 'Retweet removed',
    });
  } catch (error) {
    console.error('Undo retweet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
