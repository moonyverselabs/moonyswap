import { NextRequest, NextResponse } from 'next/server';
import { redis, VOTES_KEY, VOTED_IPS_PREFIX } from '@/lib/redis';
import { EXAMPLE_APPS } from '@/lib/apps';

// Hash the IP for privacy (we don't need to store raw IPs)
function hashIP(ip: string): string {
  // Simple hash - in production you might want crypto.subtle
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// GET: Fetch all vote counts
export async function GET() {
  try {
    // Get all vote counts from Redis
    const votes = await redis.hgetall(VOTES_KEY) as Record<string, number> | null;

    // Build response with base interest + votes
    const voteCounts: Record<string, number> = {};

    for (const app of EXAMPLE_APPS) {
      const baseInterest = app.interest || 0;
      const additionalVotes = votes?.[app.id] || 0;
      voteCounts[app.id] = baseInterest + Number(additionalVotes);
    }

    return NextResponse.json({ votes: voteCounts });
  } catch (error) {
    console.error('Error fetching votes:', error);
    // Fallback to base interest counts if Redis fails
    const fallback: Record<string, number> = {};
    for (const app of EXAMPLE_APPS) {
      fallback[app.id] = app.interest || 0;
    }
    return NextResponse.json({ votes: fallback });
  }
}

// POST: Cast a vote
export async function POST(request: NextRequest) {
  try {
    const { appId } = await request.json();

    // Validate appId
    const app = EXAMPLE_APPS.find(a => a.id === appId);
    if (!app) {
      return NextResponse.json({ error: 'Invalid app ID' }, { status: 400 });
    }

    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const ipHash = hashIP(ip);

    // Check if this IP already voted for this app
    const votedKey = `${VOTED_IPS_PREFIX}${appId}`;
    const hasVoted = await redis.sismember(votedKey, ipHash);

    if (hasVoted) {
      return NextResponse.json({ error: 'Already voted', alreadyVoted: true }, { status: 409 });
    }

    // Record the vote
    await redis.hincrby(VOTES_KEY, appId, 1);
    await redis.sadd(votedKey, ipHash);

    // Get updated count
    const newCount = await redis.hget(VOTES_KEY, appId) as number;
    const totalVotes = (app.interest || 0) + Number(newCount);

    return NextResponse.json({
      success: true,
      votes: totalVotes,
      appId
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
  }
}
