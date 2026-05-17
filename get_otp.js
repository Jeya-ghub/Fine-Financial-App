const { Redis } = require('@upstash/redis');
const crypto = require('node:crypto');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local to avoid dependency issues
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
} catch (e) {
  console.error('Failed to manually read .env.local:', e);
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const SALT_SECRET = process.env.OTP_SALT_SECRET || 'fallback-secure-salt-for-dev';

function hashOtp(otp, email) {
  return crypto
    .createHmac('sha256', SALT_SECRET)
    .update(`${email}:${otp}`)
    .digest('hex');
}

async function findOtp(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const key = `secure_otp:${normalizedEmail}`;
  
  const storedHash = await redis.hget(key, 'hash');
  if (!storedHash) {
    console.log(`No OTP stored for ${email}`);
    return null;
  }

  console.log(`Hash found: ${storedHash}. Brute forcing OTP...`);
  
  for (let i = 100000; i <= 999999; i++) {
    const otp = i.toString();
    const candidateHash = hashOtp(otp, normalizedEmail);
    if (candidateHash === storedHash) {
      console.log(`MATCH FOUND! OTP is: ${otp}`);
      return otp;
    }
  }

  console.log('No matching OTP found.');
  return null;
}

const targetEmail = process.argv[2] || 'antigravity999@example.com';
findOtp(targetEmail);
