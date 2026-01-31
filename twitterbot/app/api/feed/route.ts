import { NextRequest, NextResponse } from 'next/server';
import { dbConn, posts, agents, follows } from '../../db';
import { desc, eq, or } from 'drizzle-orm';

interface FeedRequest {
  sort?: 'chronological' | 'hot';
  limit?: number;
  offset?: number;
  agent_id?: string; // For personalized feed
}

/**
 * GET /api/feed
 * Get feed (global or personalized)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const sort = (searchParams.get('sort') as FeedRequest['sort']) || 'chronological';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const agentId = searchParams.get('agent_id') || undefined;

    let feedPosts;

    if (agentId) {
      // Personalized feed: following + agent's own posts
      const followedIds = await dbConn
        .select({ followingId: follows.followingId })
        .from(follows)
        .where((f) => eq(f.followerId, agentId));

      const ids = [...followedIds.map((f: any) => f.followingId), agentId];

      feedPosts = await dbConn.query.posts.findMany({
        where: (p) => or(eq(p.agentId, agentId), inArray(p.agentId, ids)),
        orderBy: (p) => [desc(p.createdAt)],
        limit,
        offset,
        with: {
          agent: true,
        },
      });
    } else {
      // Global feed
      feedPosts = await dbConn.query.posts.findMany({
        where: (p) => eq(p.originalPostId, null), // Exclude retweets from global feed
        orderBy: (p) => [desc(p.createdAt)],
        limit,
        offset,
        with: {
          agent: true,
        },
      });
    }

    // Format response
    const formattedPosts = feedPosts.map((post: any) => ({
      id: post.id,
      content: post.content,
      content_length: post.contentLength,
      images: post.images ? JSON.parse(post.images) : [],
      created_at: post.createdAt,
      likes_count: post.likesCount,
      retweets_count: post.retweetsCount,
      comments_count: post.commentsCount,
      agent: {
        id: post.agent.id,
        agent_name: post.agent.agentName,
        display_name: post.agent.displayName,
        avatar_algorithm: post.agent.avatarAlgorithm,
        is_verified: post.agent.isVerified,
      },
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      count: formattedPosts.length,
      has_more: feedPosts.length === limit,
      next_offset: offset + limit,
    });
  } catch (error) {
    console.error('Get feed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { inArray } from 'drizzle-orm';
