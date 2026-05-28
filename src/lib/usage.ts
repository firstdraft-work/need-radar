/**
 * Usage tracking with Upstash Redis (persistent) + in-memory fallback.
 *
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in env
 * to enable Redis persistence. Without them, falls back to in-memory Map.
 */

import { Redis } from "@upstash/redis";

const FREE_QUERY_LIMIT = 20;

// In-memory fallback for local dev without Redis
const memoryMap = new Map<string, number>();

// Lazy Redis client
let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis !== null) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

const USAGE_PREFIX = "usage:";

/** Get current usage count for an invite code */
export async function getUsage(code: string): Promise<{ used: number; limit: number; remaining: number }> {
  const normalized = code.trim().toUpperCase();
  let used: number;

  const redis = getRedis();
  if (redis) {
    const val = await redis.get<number>(`${USAGE_PREFIX}${normalized}`);
    used = val ?? 0;
  } else {
    used = memoryMap.get(normalized) ?? 0;
  }

  return { used, limit: FREE_QUERY_LIMIT, remaining: Math.max(0, FREE_QUERY_LIMIT - used) };
}

/** Increment usage count for an invite code, return updated count */
export async function incrementUsage(code: string): Promise<{ used: number; limit: number; remaining: number }> {
  const normalized = code.trim().toUpperCase();
  let used: number;

  const redis = getRedis();
  if (redis) {
    const key = `${USAGE_PREFIX}${normalized}`;
    const newVal = await redis.incr(key);
    // Set TTL of 30 days on first use
    if (newVal === 1) {
      await redis.expire(key, 30 * 24 * 60 * 60);
    }
    used = newVal;
  } else {
    const current = memoryMap.get(normalized) ?? 0;
    used = current + 1;
    memoryMap.set(normalized, used);
  }

  return { used, limit: FREE_QUERY_LIMIT, remaining: Math.max(0, FREE_QUERY_LIMIT - used) };
}

/** Check if code has exceeded free limit */
export async function isLimitExceeded(code: string): Promise<boolean> {
  const { used } = await getUsage(code);
  return used >= FREE_QUERY_LIMIT;
}

export { FREE_QUERY_LIMIT };
