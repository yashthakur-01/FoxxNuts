import Redis from "ioredis";

/**
 * Resolves the Redis connection URI from environment variables.
 * Automatically constructs standard rediss:// TLS connection from Upstash REST variables if REDIS_URL is not provided.
 */
function getRedisUrl(): string {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    const host = upstashUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `rediss://default:${upstashToken}@${host}:6379`;
  }
  return "redis://localhost:6379/0";
}

const REDIS_URL = getRedisUrl();

let redisClient: Redis | null = null;

try {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  redisClient.connect().catch((err) => {
    console.warn("[Next.js Redis Warning] Could not connect to Redis:", err.message);
  });
} catch (e) {
  console.warn("[Next.js Redis Warning] ioredis initialization error:", e);
}

export default redisClient;
