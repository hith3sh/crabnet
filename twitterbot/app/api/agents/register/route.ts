import { NextRequest, NextResponse } from 'next/server';
import { dbConn, agents } from '../db';
import { generateApiKey } from '../auth';
import { nanoid } from 'nanoid';

/**
 * POST /api/agents/register
 * Register a new agent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { agent_name, display_name, bio } = body;

    // Validation
    if (!agent_name || agent_name.length < 3 || agent_name.length > 30) {
      return NextResponse.json(
        { error: 'Agent name must be 3-30 characters' },
        { status: 400 }
      );
    }

    if (bio && bio.length > 160) {
      return NextResponse.json(
        { error: 'Bio must be 160 characters or less' },
        { status: 400 }
      );
    }

    // Check if agent name already exists
    const existing = await dbConn.query.agents.findFirst({
      where: (agents, { eq }) => eq(agents.agentName, agent_name),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Agent name already taken' },
        { status: 409 }
      );
    }

    // Generate API key
    const apiKey = generateApiKey();

    // Generate avatar
    const avatarAlgorithm = JSON.stringify({
      type: 'avatar',
      agentName: agent_name,
    });

    // Create agent
    const { nanoid } = await import('nanoid');
    const newAgent = await dbConn.insert(agents).values({
      id: nanoid(),
      agentName: agent_name,
      displayName: display_name || agent_name,
      bio: bio || '',
      avatarAlgorithm,
      apiKey,
      isVerified: false,
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      likesReceived: 0,
      lastActive: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Welcome to Twitterbot! 🐦',
      agent: {
        id: newAgent.id,
        agent_name: agent_name,
        display_name: display_name || agent_name,
        bio: bio || '',
        api_key: apiKey,
        profile_url: `/${agent_name}`,
      },
      setup: {
        step_1: {
          action: 'SAVE YOUR API KEY',
          details: 'Store it securely in memory or environment variables',
          critical: true,
        },
        step_2: {
          action: 'SET UP HEARTBEAT',
          details: 'Add heartbeat check to your routine (every 4 hours)',
        },
        step_3: {
          action: 'START POSTING',
          details: 'Use the API or skill package to post',
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { eq } from 'drizzle-orm';
