import { redis } from './client'
import crypto from 'node:crypto'

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5
const OTP_TTL_SECONDS = 300 // 5 minutes
const SALT_SECRET = process.env.OTP_SALT_SECRET || 'fallback-secure-salt-for-dev'

// ─── LUA SCRIPTS ─────────────────────────────────────────────────────────────
// This Lua script guarantees atomic execution. 
// It reads the hash, checks attempts, compares, and deletes/increments in one single transaction.
const VERIFY_SCRIPT = `
  local key = KEYS[1]
  local input_hash = ARGV[1]
  local max_attempts = tonumber(ARGV[2])

  local stored_hash = redis.call('HGET', key, 'hash')
  if not stored_hash then 
    return "NOT_FOUND" 
  end

  local attempts = tonumber(redis.call('HGET', key, 'attempts') or "0")
  if attempts >= max_attempts then 
    return "MAX_ATTEMPTS" 
  end

  -- String comparison inside Redis Lua on fixed-length hashes is secure
  -- and immune to network-observable timing attacks.
  if stored_hash == input_hash then
    redis.call('DEL', key) -- Atomically consume to prevent replay
    return "SUCCESS"
  else
    redis.call('HINCRBY', key, 'attempts', 1)
    return "INVALID"
  end
`

// ─── UTILITIES ───────────────────────────────────────────────────────────────
/**
 * Hashes the OTP using SHA-256 + a secret salt to protect against DB leaks.
 * We use a fast hash (sha256) instead of bcrypt because OTPs are short-lived (5m).
 */
function hashOtp(otp: string, identifier: string): string {
  return crypto
    .createHmac('sha256', SALT_SECRET)
    .update(`${identifier}:${otp}`)
    .digest('hex')
}

/**
 * Normalizes input to prevent formatting mismatch attacks.
 */
function normalize(input: string): string {
  return input.replace(/\s+/g, '').trim()
}

// ─── EXPORTED API ────────────────────────────────────────────────────────────

export async function storeSecureOtp(identifier: string, otp: string) {
  const normalizedId = normalize(identifier).toLowerCase()
  const normalizedOtp = normalize(otp)
  const key = `secure_otp:${normalizedId}`
  
  const hashedOtp = hashOtp(normalizedOtp, normalizedId)

  // Store hash and attempts count atomically
  const pipeline = redis.pipeline()
  pipeline.hset(key, {
    hash: hashedOtp,
    attempts: 0
  })
  pipeline.expire(key, OTP_TTL_SECONDS)
  
  await pipeline.exec()
  
  return { success: true }
}

type VerifyResult = 
  | { success: true }
  | { success: false, error: string, code: 'NOT_FOUND' | 'MAX_ATTEMPTS' | 'INVALID' }

export async function verifySecureOtp(identifier: string, otp: string): Promise<VerifyResult> {
  const normalizedId = normalize(identifier).toLowerCase()
  const normalizedOtp = normalize(otp)
  const key = `secure_otp:${normalizedId}`
  
  const inputHash = hashOtp(normalizedOtp, normalizedId)

  // Execute the atomic Lua script
  // @ts-ignore - Upstash redis eval syntax
  const result = await redis.eval(VERIFY_SCRIPT, [key], [inputHash, MAX_ATTEMPTS])

  switch (result) {
    case 'SUCCESS':
      return { success: true }
    case 'NOT_FOUND':
      return { success: false, error: 'OTP expired or does not exist.', code: 'NOT_FOUND' }
    case 'MAX_ATTEMPTS':
      return { success: false, error: 'Maximum verification attempts exceeded. Please request a new code.', code: 'MAX_ATTEMPTS' }
    case 'INVALID':
      return { success: false, error: 'Incorrect code.', code: 'INVALID' }
    default:
      return { success: false, error: 'An unknown error occurred.', code: 'INVALID' }
  }
}

/**
 * Timing-safe string comparison exposed for general string matching needs 
 * outside of the Redis Lua context.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  try {
    const bufferA = Buffer.from(a, 'utf8')
    const bufferB = Buffer.from(b, 'utf8')
    if (bufferA.length !== bufferB.length) return false
    return crypto.timingSafeEqual(bufferA, bufferB)
  } catch {
    return false
  }
}
