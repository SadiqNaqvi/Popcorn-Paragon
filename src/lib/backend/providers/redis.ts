import { Redis as UpstashRedis } from "@upstash/redis";
import Redis from "ioredis";

declare global {
  // allow global `redis` in dev
  // eslint-disable-next-line no-var
  var _upstash_redis: UpstashRedis | undefined;
  var _redis: Redis | undefined;
}

export const getRedis = async () => {
  if (!global._redis) {
    global._redis = new Redis({
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT!),
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          // Stop retrying
          console.warn("❌ Too many attempts to connect to Redis, giving up.");
          return;
        }
        console.warn(`⚠️ Redis retry attempt #${times}`);
        return Math.min(times * 200, 2000); // exponential backoff (200ms → 2s max)
      }
    });
  }
  if (global._redis.status === "end" || global._redis.status === "close")
    await global._redis.connect()
      .then(() => console.log("💪🙌 Redis Connected Successfully 🙌💪"))
      .catch((e: any) => {
        console.log("Redis Connection Failed:", e.message)
        global._redis?.disconnect();
      });
  // }

  return global._redis;
};

export const getUpstashRedis = async () => {

  if (!global._upstash_redis) {
    global._upstash_redis = new UpstashRedis({
      url: process.env.UPSTASH_URL,
      token: process.env.UPSTASH_TOKEN,
    });
  }

  return global._upstash_redis;
}