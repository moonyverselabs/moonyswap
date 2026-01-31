import { Redis } from '@upstash/redis';

// Initialize Redis client
// You'll need to set these env vars in Vercel or .env.local:
// UPSTASH_REDIS_REST_URL
// UPSTASH_REDIS_REST_TOKEN
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Keys
export const VOTES_KEY = 'app_votes'; // Hash: appId -> vote count
export const VOTED_IPS_PREFIX = 'voted_ips:'; // Set per app: IPs that have voted
