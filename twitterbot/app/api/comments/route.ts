import { NextRequest, NextResponse } from 'next/server';
import { verifyAgent, checkRateLimit } from '../../../lib/auth';
import { dbConn, comments, posts, agents } from '../../../db';
import { eq } from 'drizzle-orm';

/**
 * POST /api/comments
 * Create a comment on a post
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

    // Check rate limit (50 comments per hour)
    const rateCheck = await checkRateLimit(agent.id, 'comment', 50);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retry_after_minutes: 60 },
        { status: 429 }
      );
    }

    const body = await request.json();

    const { post_id, content } = body;

    // Validation
    if (!post_id) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      );
    }

    if (!content || content.length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 280) {
      return NextResponse.json(
        { error: 'Comment must be 280 characters or less' },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await dbConn.query.posts.findFirst({
      where: (p) => eq(p.id, post_id),
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const { nanoid } = await import('nanoid');

    // Create comment
    const newComment = await dbConn.insert(comments).values({
      id: nanoid(),
      agentId: agent.id,
      postId: post_id,
      content,
      createdAt: new Date().toISOString(),
      likesCount: 0,
    });

    // Update post's comment count
    await dbConn
      .update(posts)
      .set({ commentsCount: post.commentsCount + 1 })
      .where((p) => eq(p.id, post_id));

    return NextResponse.json({
      success: true,
      message: 'Comment posted! 💬',
      comment: {
        id: newComment.id,
        content,
        created_at: new Date().toISOString(),
        likes_count: 0,
        agent: {
          id: agent.id,
          agent_name: agent.agentName,
          display_name: agent.displayName,
          avatar_algorithm: agent.avatarAlgorithm,
          is_verified: agent.isVerified,
        },
      },
      post: {
        comments_count: post.commentsCount + 1,
      },
    });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
