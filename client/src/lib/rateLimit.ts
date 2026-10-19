import redisClient from "./redisClient";

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

// ============================================================================
// PREDEFINED RATE LIMIT TIERS
// ============================================================================
export const RATE_LIMIT_TIERS = {
  // 1. 5 uploads per 24-hour sliding window per customer
  FILE_UPLOAD_DAILY: { limit: 5, windowSeconds: 86400 },

  // 2. 200 messages per 24-hour sliding window per customer across all workspaces
  CLIENT_DAILY_MESSAGES: { limit: 200, windowSeconds: 86400 },

  // 3. 15 messages per 60-second sliding window per visitor session (spam burst protection)
  VISITOR_MINUTE: { limit: 15, windowSeconds: 60 },
} as const;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Formats a duration in seconds into a clean, human-readable string (e.g. "3h 12m" or "45s").
 */
export function formatResetTime(seconds: number): string {
  if (seconds <= 0) return "now";
  if (seconds < 60) return `${seconds}s`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remSeconds = seconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return remSeconds > 0 ? `${minutes}m ${remSeconds}s` : `${minutes}m`;
}

/**
 * Sliding-window rate limiter utilizing Redis atomic ZSET operations and pipeline.
 * Computes exact millisecond-accurate reset times using ZRANGE WITHSCORES.
 *
 * @param key Unique identifier e.g. "upload_daily:user_123" or "client_daily:user_123"
 * @param config RateLimitConfig containing limit count and windowSeconds
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = config;
  const defaultFailOpen: RateLimitResult = {
    allowed: true,
    limit,
    remaining: limit,
    resetInSeconds: 0,
  };

  if (!redisClient) {
    return defaultFailOpen;
  }

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  try {
    const pipe = redisClient.pipeline();
    // 1. Evict expired entries older than the current sliding window
    pipe.zremrangebyscore(redisKey, 0, windowStart);
    // 2. Count active hits remaining in the sliding window
    pipe.zcard(redisKey);
    // 3. Query the oldest entry in the window to compute precise reset time
    pipe.zrange(redisKey, 0, 0, { withScores: true });

    const results = (await pipe.exec()) || [];
    // Support both @upstash/redis [res0, res1, ...] and ioredis [[err, res0], [err, res1], ...] structures
    const countRaw = results[1];
    const count = typeof countRaw === "number" ? countRaw : (Array.isArray(countRaw) ? countRaw[1] : 0) || 0;

    const oldestRaw = results[2];
    let oldestData: (string | number)[] = [];
    if (Array.isArray(oldestRaw)) {
      if (oldestRaw.length > 0 && Array.isArray(oldestRaw[0])) {
        oldestData = oldestRaw[0];
      } else {
        oldestData = oldestRaw as (string | number)[];
      }
    }

    // Calculate exact remaining time until the oldest item expires
    let resetInSeconds = windowSeconds;
    if (oldestData.length >= 2) {
      const oldestTimestamp = typeof oldestData[1] === "number" ? oldestData[1] : parseFloat(String(oldestData[1]));
      if (!isNaN(oldestTimestamp)) {
        const msRemaining = oldestTimestamp + windowMs - now;
        resetInSeconds = Math.max(1, Math.ceil(msRemaining / 1000));
      }
    }

    // If quota is exhausted, do NOT record new timestamp
    if (count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetInSeconds,
      };
    }

    // Allowed: Add current hit with microsecond uniqueness and refresh key TTL
    const addPipe = redisClient.pipeline();
    const uniqueMember = `${now}:${Math.random().toString(36).slice(2, 8)}`;
    addPipe.zadd(redisKey, { score: now, member: uniqueMember });
    addPipe.expire(redisKey, windowSeconds + 10);
    await addPipe.exec();

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - (count + 1)),
      resetInSeconds,
    };
  } catch (err) {
    console.warn(`[RateLimit Warning] Failed to evaluate rate limit for key '${key}':`, err);
    return defaultFailOpen;
  }
}

/**
 * Refunds / reverts one rate limit token from the sliding window (e.g. if file upload or processing failed).
 */
export async function refundRateLimit(key: string): Promise<boolean> {
  if (!redisClient) return false;
  const redisKey = `ratelimit:${key}`;
  try {
    // Remove the most recent entry from the ZSET
    const removed = await redisClient.zpopmax(redisKey, 1);
    return Boolean(removed && removed.length > 0);
  } catch (err) {
    console.warn(`[RateLimit Warning] Failed to refund rate limit for key '${key}':`, err);
    return false;
  }
}

