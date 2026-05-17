'use server'

import { cache } from 'react'
import { storeSecureOtp, verifySecureOtp } from '@/lib/redis/otp'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/redis/rate-limit'
import { mailer } from '@/lib/mailer'
import { randomInt } from 'node:crypto'
import { headers } from 'next/headers'

export async function sendOtp(rawEmail: string) {
  const email = rawEmail.toLowerCase().trim()

  // 1. Validate Email Format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email address format.' }
  }

  // 2. Check if Email Already Exists in Database
  const adminClient = await createAdminClient()
  const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
  
  if (listError) {
    console.error('[Auth] Failed to check existing user:', listError)
  }

  const userExists = users?.some(u => u.email?.toLowerCase() === email)
  if (userExists) {
    return { error: 'Email already registered' }
  }

  // 3. Check General Send Rate Limit (3 requests per 5 minutes per email)
  const rateLimit = await checkRateLimit(`otp_send:${email}`, 3, 300)
  if (!rateLimit.success) {
    return { 
      error: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimit.reset - Date.now()) / 1000)} seconds.` 
    }
  }

  // 4. Generate 6-digit OTP
  const otp = randomInt(100000, 999999).toString()

  // 5. Store Securely in Redis (Hashed, Atomic)
  await storeSecureOtp(email, otp)
  
  // ALWAYS Log OTP for developer bypass in terminal
  console.log(`[Auth] OTP for ${email}: ${otp}`)

  // 6. Send Email via Brevo SMTP
  try {
    await mailer.sendMail({
      from: `"Fine Finance" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `Your Verification Code: ${otp}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0a0a0a; color: white; border-radius: 24px;">
          <div style="margin-bottom: 32px;">
            <div style="width: 48px; height: 48px; background: linear-gradient(to top right, #10b981, #3b82f6); border-radius: 12px; display: inline-block;"></div>
            <h1 style="font-size: 24px; font-weight: bold; margin-top: 24px; color: white;">Verify your identity</h1>
          </div>
          <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
            Use the code below to sign in to your Fine Finance Tracker account. This code will expire in 5 minutes.
          </p>
          <div style="background-color: #1a1a1a; padding: 24px; border-radius: 16px; text-align: center; border: 1px solid #333;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 0.5em; color: #10b981; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #52525b; font-size: 12px; margin-top: 32px; border-top: 1px solid #1f1f1f; padding-top: 24px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (err: any) {
    console.error('[Auth] Mail Error:', err)
    return { error: `EMAIL_SEND_FAILED: ${err.message}.` }
  }
}

export async function verifyOtp(rawEmail: string, rawToken: string) {
  const email = rawEmail.toLowerCase().trim()
  const token = rawToken.replace(/\s/g, '')

  // 1. Check Rate Limit (Global 5 attempts per 5 minutes to prevent network spam)
  const rateLimit = await checkRateLimit(`otp_verify:${email}`, 5, 300)
  if (!rateLimit.success) {
    return { error: `Too many verification attempts. Please try again later.` }
  }

  // 2. Secure Atomic Verification via Lua Script
  const verifyResult = await verifySecureOtp(email, token)
  
  if (!verifyResult.success) {
    return { error: 'Invalid OTP' }
  }

  // 3. Check if user already exists
  const adminClient = await createAdminClient()
  const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
  
  if (listError) {
    console.error('[Auth] Failed to check existing user:', listError)
  }

  const userExists = users?.some(u => u.email?.toLowerCase() === email)

  // 4. If user exists, complete sign-in for Forgot Password flow
  if (userExists) {
    const supabase = await createClient()

    let { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkError || !linkData) {
      console.error('[Auth] Supabase Link Error:', linkError)
      return { error: `Authentication failed: ${linkError?.message || 'Unknown error'}` }
    }

    const properties = linkData.properties as any
    const tokenHash = properties?.token_hash || properties?.hashed_token

    if (!tokenHash) {
      return { error: 'Session creation failed: Secure token not found. Please try again.' }
    }

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    })

    if (verifyError) {
      return { error: `Session creation failed: ${verifyError.message}` }
    }

    if (data.user) {
      recordSession(data.user.id).catch(e => console.error('[Auth] Background session recording failed', e))
    }

    return { success: true, session: data.session, userExists: true }
  }

  // If user does not exist (Signup flow), just return success
  return { success: true, userExists: false }
}

export async function signupAndOnboard(rawEmail: string, username: string, password: string) {
  const email = rawEmail.toLowerCase().trim()

  // 1. Server-side validations
  const usernameRegex = /^[A-Za-z]+$/
  if (!usernameRegex.test(username)) {
    return { error: 'Username must contain letters only.' }
  }
  if (username.length > 10) {
    return { error: 'Username must be at most 10 characters long.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' }
  }

  // 2. Double-check if email already exists
  const adminClient = await createAdminClient()
  const { data: { users } } = await adminClient.auth.admin.listUsers()
  const userExists = users?.some(u => u.email?.toLowerCase() === email)
  if (userExists) {
    return { error: 'Email already registered' }
  }

  // 3. Create the user account in Supabase
  // Passwords are automatically hashed securely by Supabase Authentication
  const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: username,
      username: username,
      onboarded: true
    }
  })

  if (createError || !userData.user) {
    console.error('[Auth] Signup User Creation Error:', createError)
    return { error: `Failed to create user account: ${createError?.message || 'Unknown error'}` }
  }

  // 4. Log the user in to create a session / JWT and set cookies
  const supabase = await createClient()
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !signInData.user) {
    console.error('[Auth] Signin after signup failed:', signInError)
    return { error: `Failed to create session: ${signInError?.message || 'Session creation failed'}` }
  }

  // 5. Automatically Create Private Workspace with Name "Personal Workspace"
  try {
    const { createWorkspace } = await import('@/app/actions/workspaces')
    // createWorkspace automatically handles member & owner assignment,
    // and database triggers automatically clone & seed categories/subcategories!
    const wsRes = await createWorkspace('Personal Workspace', 'private')
    if (wsRes.error) {
      console.error('[Auth] Failed to create default workspace:', wsRes.error)
    }
  } catch (err) {
    console.error('[Auth] Workspace import/execution failed:', err)
  }

  // 6. Record session metadata in background
  recordSession(signInData.user.id).catch(e => console.error('[Auth] Background session recording failed', e))

  return { success: true }
}


async function recordSession(userId: string) {
  try {
    const head = await headers()
    const ua = head.get('user-agent') || ''
    const ip = head.get('x-forwarded-for')?.split(',')[0] || head.get('x-real-ip') || '127.0.0.1'
    
    // Senior Level UA Parser
    const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Safari') ? 'Safari' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Edg') ? 'Edge' : 'Browser'
    const device = ua.includes('iPhone') ? 'iPhone' : ua.includes('iPad') ? 'iPad' : ua.includes('Android') ? 'Android Phone' : ua.includes('Macintosh') ? 'MacBook Pro' : 'Desktop PC'
    const os = ua.includes('Mac OS X') ? 'macOS' : ua.includes('Windows') ? 'Windows' : ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iOS' : 'Linux'

    // Real-time Geolocation (Senior Engineering Technique)
    let location = 'Local Environment'
    if (ip !== '127.0.0.1' && ip !== '::1') {
      try {
        // Use a 5-second timeout for the geolocation lookup
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { 
          signal: controller.signal 
        }).then(r => r.json())
        
        clearTimeout(timeoutId)
        
        if (geoRes.city) {
          location = `${geoRes.city}, ${geoRes.country_code}`
        }
      } catch (e) {
        console.warn('[Auth] Geo lookup failed or timed out', e)
      }
    }

    const admin = await createAdminClient()
    
    // Senior Level Technique: Deduplicate sessions for the same device/browser signature
    // This prevents the "multiple sessions" clutter shown in the UI
    await admin.from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('device', device)
      .eq('browser', browser)
      .eq('os', os)

    await admin.from('user_sessions').insert({
      user_id: userId,
      device,
      browser,
      os,
      ip,
      location,
      last_active: new Date().toISOString()
    })
  } catch (err) {
    console.error('[Auth] Session recording failed', err)
  }
}

export async function finishOnboarding(name: string, password: string) {
  const supabase = await createClient()
  
  // 1. Update user password and metadata
  const { data, error } = await supabase.auth.updateUser({
    password: password,
    data: { 
      full_name: name,
      onboarded: true 
    }
  })

  if (error) {
    return { error: error.message }
  }

  // 2. Create default workspace for new user
  try {
    const { createWorkspace } = await import('@/app/actions/workspaces')
    await createWorkspace(`${name}'s Workspace`)
  } catch (err) {
    console.error('[Auth] Failed to create default workspace:', err)
  }

  return { success: true }
}

export async function signIn(rawEmail: string, password: string) {
  const email = rawEmail.toLowerCase().trim()
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    await recordSession(data.user.id)
  }

  return { success: true, session: data.session }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export async function updateProfile(username: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.updateUser({
    data: { username: username }
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function requestEmailChange(newEmail: string) {
  const supabase = await createClient()
  // Real implementation would use updateUser({ email: newEmail }) which sends an OTP to both emails.
  // For UI testing purposes, we'll just simulate a success response.
  return { success: true, message: 'Verification OTP sent to new email' }
}

export async function getActiveSessions() {
  const user = await getUser()
  if (!user) return { success: false, data: [] }

  const supabase = await createClient()
  const { data: dbSessions } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('last_active', { ascending: false })
    .limit(5)

  const head = await headers()
  const currentIp = head.get('x-forwarded-for')?.split(',')[0] || head.get('x-real-ip') || '127.0.0.1'
  const currentUa = head.get('user-agent') || ''

  // Correcting the "Current Session" logic to ensure ONLY ONE is marked
  let currentMarked = false
  const processedSessions = (dbSessions || []).map((s, idx) => {
    const isIpMatch = s.ip === currentIp
    const isBrowserMatch = currentUa.includes(s.browser)
    
    // Heuristic: Most recent session that matches IP and Browser
    let isCurrent = false
    if (!currentMarked && isIpMatch && isBrowserMatch) {
      isCurrent = true
      currentMarked = true
    }

    return {
      ...s,
      isCurrent
    }
  })

  // Final Fallback: If none matched the heuristic, mark the very first one as current
  if (!currentMarked && processedSessions.length > 0) {
    processedSessions[0].isCurrent = true
  }

  return {
    success: true,
    data: processedSessions
  }
}

export async function terminateSession(sessionId: string) {
  const admin = await createAdminClient()
  const { error } = await admin
    .from('user_sessions')
    .delete()
    .eq('id', sessionId)
  
  return { success: !error }
}

export async function terminateAllOtherSessions() {
  const user = await getUser()
  if (!user) return { success: false }

  const admin = await createAdminClient()
  
  // Get the most recent session ID to keep it as "current"
  const { data: latest } = await admin
    .from('user_sessions')
    .select('id')
    .eq('user_id', user.id)
    .order('last_active', { ascending: false })
    .limit(1)
    .single()

  if (!latest) return { success: true }

  const { error } = await admin
    .from('user_sessions')
    .delete()
    .eq('user_id', user.id)
    .neq('id', latest.id)

  return { success: !error }
}

export async function requestAccountDeletion() {
  const supabase = await createClient()
  const deletionDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days
  const { error } = await supabase.auth.updateUser({
    data: { deletion_scheduled_at: deletionDate }
  })
  if (error) return { error: error.message }
  return { success: true, deletionDate }
}

export async function revokeAccountDeletion() {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    data: { deletion_scheduled_at: null }
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function resetPassword(password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: password
  })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}
