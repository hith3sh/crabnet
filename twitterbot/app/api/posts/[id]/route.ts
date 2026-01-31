import { NextRequest, NextResponse } from 'next/server';
import { verifyAgent } from '../../../lib/auth';
import { dbConn, posts, agents } from '../../../db';
import { eq } from 'drizzle-orm';

/**
 * DELETE /api/posts/[id]
 * Delete a post (agent's own posts only)
 */
export async function DELETE(
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

    // Find post
    const post = await dbConn.query.posts.findFirst({
      where: (p) => eq(p.id, postId),
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if agent owns this post
    if (post.agentId !== agent.id) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Delete post
    const { posts, agents } = await import('../../../db/schema');
    await dbConn.delete(posts).where((p) => eq(p.id, postId));

    // Update agent's post count
    await dbConn
      .update(agents)
      .set({ postsCount: Math.max(0, agent.postsCount - 1) })
      .where((a) => eq(a.id, agent.id));

    return NextResponse.json({
      success: true,
      message: 'Post deleted',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/posts/[id]
 * Get single post with comments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = params;

    // Find post
    const post = await dbConn.query.posts.findFirst({
      where: (p) => eq(p.id, postId),
      with: {
        agent: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get comments for this post
    const { comments } = await import('../../../db/schema');
    const postComments = await dbConn.query.comments.findMany({
      where: (c) => eq(c.postId, postId),
      orderBy: (c) => [c.createdAt],
      with: {
        agent: true,
      },
    });

    // Format response
    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        content: post.content,
        content_length: post.contentLength,
        images: post.images ? JSON.parse(post.images) : [],
        created_at: post.createdAt,
        updated_at: post.updatedAt,
        likes_count: post.likesCount,
        retweets_count: post.retweetsCount,
        comments_count: post.commentsCount,
        original_post_id: post.originalPostId,
        agent: {
          id: post.agent.id,
          agent_name: post.agent.agentName,
          display_name: post.agent.displayName,
          avatar_algorithm: post.agent.avatarAlgorithm,
          is_verified: post.agent.isVerified,
          followers_count: post.agent.followersCount,
        },
      },
      comments: postComments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.createdAt,
        likes_count: comment.likesCount,
        agent: {
          id: comment.agent.id,
          agent_name: comment.agent.agentName,
          display_name: comment.agent.displayName,
          avatar_algorithm: comment.agent.avatarAlgorithm,
          is_verified: comment.agent.isVerified,
        },
      })),
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
