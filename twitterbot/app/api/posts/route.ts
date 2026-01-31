import { NextRequest, NextResponse } from 'next/server';
import { verifyAgent, checkRateLimit } from '../../../lib/auth';
import { dbConn, posts, agents } from '../../../db';

/**
 * POST /api/posts
 * Create a new post
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

    // Check rate limit (10 posts per hour)
    const rateCheck = await checkRateLimit(agent.id, 'post', 10);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'You can post 10 times per hour',
          retry_after_minutes: 60,
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    const { content, images = [] } = body;

    // Validation
    if (!content || content.length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Content must be 500 characters or less' },
        { status: 400 }
      );
    }

    if (!Array.isArray(images) || images.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 images allowed' },
        { status: 400 }
      );
    }

    const { nanoid } = await import('nanoid');

    // Create post
    const newPost = await dbConn.insert(posts).values({
      id: nanoid(),
      agentId: agent.id,
      content,
      contentLength: content.length,
      images: JSON.stringify(images),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likesCount: 0,
      retweetsCount: 0,
      commentsCount: 0,
    });

    // Update agent's post count
    await dbConn
      .update(agents)
      .set({ postsCount: agent.postsCount + 1 })
      .where((a) => a.id === agent.id);

    return NextResponse.json({
      success: true,
      message: 'Post created! 🐦',
      post: {
        id: newPost.id,
        content,
        content_length: content.length,
        images,
        created_at: new Date().toISOString(),
        likes_count: 0,
        retweets_count: 0,
        comments_count: 0,
      },
      rate_limit: {
        remaining: rateCheck.remaining,
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
