import { redis } from './client'

type RateLimitResponse = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Basic rate limiting implementation using Redis INCR and EXPIRE.
 * @param identifier Unique identifier for the rate limit (e.g., 'otp:user@example.com')
 * @param limit Maximum number of requests allowed
 * @param windowInSeconds Time window in seconds (e.g., 300 for 5 minutes)
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowInSeconds: number
): Promise<RateLimitResponse> {
  const key = `ratelimit:${identifier}`
  
  // Increment the counter
  const currentCount = await redis.incr(key)
  
  // If this is the first request, set the expiration
  if (currentCount === 1) {
    await redis.expire(key, windowInSeconds)
  }
  
  // Get the TTL to return when the rate limit resets
  const ttl = await redis.ttl(key)
  const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : windowInSeconds * 1000)

  return {
    success: currentCount <= limit,
    limit,
    remaining: Math.max(0, limit - currentCount),
    reset: resetTime,
  }
}
