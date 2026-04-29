'use server'

import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/redis/rate-limit'

export async function sendOtp(email: string) {
  // 1. Check Rate Limit (3 requests per 5 minutes per email)
  const rateLimit = await checkRateLimit(`otp_send:${email}`, 3, 300)
  if (!rateLimit.success) {
    return { 
      error: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimit.reset - Date.now()) / 1000)} seconds.` 
    }
  }

  // 2. Initialize Supabase client
  const supabase = await createClient()

  // 3. Send OTP
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function verifyOtp(email: string, token: string) {
  // 1. Check Rate Limit (5 attempts per 5 minutes per email)
  const rateLimit = await checkRateLimit(`otp_verify:${email}`, 5, 300)
  if (!rateLimit.success) {
    return { 
      error: `Too many verification attempts. Please try again later.` 
    }
  }

  // 2. Initialize Supabase client
  const supabase = await createClient()

  // 3. Verify OTP
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, session: data.session }
}
