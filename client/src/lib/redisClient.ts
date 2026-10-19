import { Redis } from "@upstash/redis";

/**
 * Initializes and exports the Upstash Redis REST client instance.
 * Exclusively reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from environment variables.
 */
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient: Redis | null = null;

if (url && token) {
  try {
    redisClient = new Redis({
      url,
      token,
      automaticDeserialization: false,
    });
  } catch (err) {
    console.warn("[Next.js Redis Warning] Failed to initialize @upstash/redis client:", err);
  }
} else {
  console.warn(
    "[Next.js Redis Warning] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables."
  );
}

export default redisClient;

