import { Redis } from "@upstash/redis"

// Create Redis instance with fallback for build time
export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : {
      // Mock Redis for build time when env vars are missing
      get: async () => null,
      set: async () => "OK",
      del: async () => 1,
    } as any
