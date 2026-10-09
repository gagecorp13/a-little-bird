import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv(),
  namespace = process.env.REDIS_NAMESPACE;
if (!namespace) throw new Error("Set REDIS_NAMESPACE explicitly.");
// This only creates markers; it never deletes suppression or enables sending.
await redis.set(namespace + ":security:initialized", "1", { nx: true });
await redis.set(namespace + ":security:sending_enabled", "0", { nx: true });
console.log("Security markers initialized. Sending remains unchanged or disabled.");
