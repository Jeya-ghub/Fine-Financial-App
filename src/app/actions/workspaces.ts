'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redis } from '@/lib/redis/client'
import { mailer } from '@/lib/mailer'
import { randomInt } from 'node:crypto'
import { getWorkspaceAccess, WorkspaceRole } from '@/lib/auth/permissions'

export async function createWorkspace(name: string = 'Private Workspace', type: 'private' | 'shared' = 'shared') {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // 1. Create Workspace
  console.log(`[Workspace] Creating workspace "${name}" for user ${user.id}...`)
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert([{ 
      name,
      type,
      created_by: user.id 
    }])
    .select()
    .single()

  if (workspaceError) {
    console.error('[Workspace] Create Error:', JSON.stringify(workspaceError, null, 2))
    return { error: `Failed to create workspace: ${workspaceError.message}` }
  }

  // 2. Assign Owner
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert([{ 
      workspace_id: workspace.id, 
      user_id: user.id, 
      email: user.email,
      role: 'owner' 
    }])

  if (memberError) {
    console.error('[Workspace] Member Error:', memberError)
  }

  revalidatePath('/dashboard')
  return { success: true, workspace }
}

export async function getWorkspaces() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', data: null }
  
  // Fetch workspaces directly from public.workspaces.
  // Row Level Security (RLS) policies handle filtering securely.
  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members(id, role, user_id, email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  return { success: true, data }
}

export async function renameWorkspace(workspaceId: string, newName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify ownership
  const { data: member, error: memberError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (memberError || member?.role !== 'owner') {
    return { error: 'Only the workspace owner can rename it.' }
  }

  const { error } = await supabase
    .from('workspaces')
    .update({ name: newName })
    .eq('id', workspaceId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/workspace', 'layout')
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function setActiveWorkspace(workspaceId: string) {
  const cookieStore = await cookies()
  cookieStore.set('fine_finance_active_workspace', workspaceId, { path: '/' })
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function getActiveWorkspaceId() {
  const cookieStore = await cookies()
  return cookieStore.get('fine_finance_active_workspace')?.value
}

export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      id,
      role,
      created_at,
      user_id,
      email
    `)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  // Note: user emails/names would ideally come from auth.users or a public profiles table.
  // For the prototype, we return the user_id and role.

  if (error) {
    return { error: error.message, data: null }
  }

  return { success: true, data }
}

export async function getWorkspace(workspaceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()
    
  if (error) return { error: error.message, data: null }
  return { success: true, data }
}

export async function getWorkspaceInvites(workspaceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    
  if (error) return { error: error.message, data: null }
  return { success: true, data }
}

export async function createInvite(workspaceId: string, emailString: string) {
  const supabase = await createClient()
  
  const email = emailString.trim()
  if (!email || !email.includes('@')) {
    return { error: 'Invalid email provided.' }
  }

  // Generate token
  const token = Math.random().toString(36).substring(2, 15)

  const { data, error } = await supabase
    .from('workspace_invites')
    .insert([{
      workspace_id: workspaceId,
      email,
      token
    }])
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Send invitation email
  try {
    await mailer.sendMail({
      from: `"Fine Finance" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `You've been invited to join a workspace`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0a0a0a; color: white; border-radius: 24px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Workspace Invitation</h1>
          <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
            You have been invited to collaborate on a workspace in Fine Finance.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/workspace/invite?token=${token}" 
             style="background-color: #10b981; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
            Accept Invitation
          </a>
        </div>
      `,
    })
  } catch (err: any) {
    console.error('[Workspace] Invite Email Error:', err)
    return { error: err.message || 'Failed to send invitation email.' }
  }

  revalidatePath('/dashboard/workspace', 'layout')
  return { success: true }
}

export async function sendInviteOtp(token: string) {
  const supabase = await createClient()
  const { data: invite, error } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !invite) return { error: 'Invalid or expired invitation token.' }

  const otp = randomInt(100000, 999999).toString()
  await redis.set(`otp:invite:${token}`, otp, { ex: 600 }) // 10 min

  try {
    await mailer.sendMail({
      from: `"Fine Finance Security" <${process.env.SMTP_FROM}>`,
      to: invite.email,
      subject: `Your Workspace Invitation OTP: ${otp}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0a0a0a; color: white; border-radius: 24px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Verify Invitation</h1>
          <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
            Use the code below to verify your invitation and join the workspace.
          </p>
          <div style="background-color: #1a1a1a; padding: 24px; border-radius: 16px; text-align: center; border: 1px solid #333;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 0.5em; color: #10b981; font-family: monospace;">${otp}</span>
          </div>
        </div>
      `,
    })
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to send OTP.' }
  }
}

export async function acceptInviteWithOtp(token: string, otp: string) {
  const supabase = await createClient()
  const storedOtp = await redis.get(`otp:invite:${token}`)

  if (!storedOtp || String(storedOtp) !== otp) {
    return { error: 'Invalid or expired OTP.' }
  }

  // 🛡️ SECURITY: Immediately consume the OTP to prevent replay attacks
  await redis.del(`otp:invite:${token}`)

  const { data: invite, error: inviteError } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('token', token)
    .single()

  if (inviteError || !invite) return { error: 'Invitation not found.' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to accept an invitation.' }

  // 1. Add member
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      email: user.email,
      role: 'member'
    })

  if (memberError) return { error: memberError.message }

  // 2. Delete invite
  await supabase.from('workspace_invites').delete().eq('id', invite.id)

  revalidatePath('/dashboard/workspace', 'layout')
  return { success: true }
}

export async function leaveWorkspace(workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check if owner
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (member?.role === 'owner') {
    return { error: 'Owners cannot leave. Please transfer ownership or delete the workspace.' }
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  const cookieStore = await cookies()
  cookieStore.delete('fine_finance_active_workspace')
  revalidatePath('/', 'layout')
  
  return { success: true }
}

export async function deleteWorkspace(workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify ownership
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (member?.role !== 'owner') {
    return { error: 'Only the workspace owner can delete it.' }
  }

  // Prevent deletion of private/default workspaces
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('type')
    .eq('id', workspaceId)
    .single()

  if (wsError || !workspace) {
    return { error: 'Workspace not found.' }
  }

  if (workspace.type === 'private') {
    return { error: 'Private workspaces cannot be deleted to ensure you always have a secure, isolated personal environment.' }
  }

  // Use Admin Client for full cleanup to bypass RLS and handle all tables
  const admin = await createAdminClient()

  // 1. Delete dependent data in order
  await admin.from('audit_logs').delete().eq('workspace_id', workspaceId)
  await admin.from('transaction_events').delete().eq('workspace_id', workspaceId)
  await admin.from('budgets').delete().eq('workspace_id', workspaceId)
  await admin.from('transactions').delete().eq('workspace_id', workspaceId)
  await admin.from('subcategories').delete().eq('workspace_id', workspaceId)
  await admin.from('categories').delete().eq('workspace_id', workspaceId)
  await admin.from('workspace_invites').delete().eq('workspace_id', workspaceId)
  await admin.from('workspace_members').delete().eq('workspace_id', workspaceId)

  // 2. Delete the workspace itself
  const { error } = await admin
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)

  if (error) {
    console.error('[Workspace] Delete Error:', error)
    return { error: error.message }
  }

  const cookieStore = await cookies()
  cookieStore.delete('fine_finance_active_workspace')
  revalidatePath('/', 'layout')

  return { success: true }
}

export async function revokeMember(workspaceId: string, memberUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: ownerCheck } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (ownerCheck?.role !== 'owner') {
    return { error: 'Only the workspace owner can revoke members.' }
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', memberUserId)

  if (error) return { error: error.message }
  
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function requestOwnershipTransfer(workspaceId: string, newOwnerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: ownerCheck } = await supabase
    .from('workspace_members')
    .select('role, email')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (ownerCheck?.role !== 'owner') {
    return { error: 'Only the workspace owner can initiate transfer.' }
  }

  const otp = randomInt(100000, 999999).toString()
  await redis.set(`otp:transfer:${workspaceId}:${user.id}`, otp, { ex: 300 })

  try {
    await mailer.sendMail({
      from: `"Fine Finance Security" <${process.env.SMTP_FROM}>`,
      to: user.email!,
      subject: `CRITICAL: Ownership Transfer Code: ${otp}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0a0a0a; color: white; border-radius: 24px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px; color: #ef4444;">Ownership Transfer</h1>
          <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
            You are about to transfer "God Mode" (Ownership) of your workspace. This action will downgrade your permissions.
          </p>
          <div style="background-color: #1a1a1a; padding: 24px; border-radius: 16px; text-align: center; border: 1px solid #ef4444;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 0.5em; color: #ef4444; font-family: monospace;">${otp}</span>
          </div>
        </div>
      `,
    })
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Failed to send security code.' }
  }
}

export async function confirmOwnershipTransfer(workspaceId: string, newOwnerId: string, otp: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const storedOtp = await redis.get(`otp:transfer:${workspaceId}:${user.id}`)
  if (!storedOtp || String(storedOtp) !== otp) {
    return { error: 'Invalid or expired security code.' }
  }

  // Downgrade current owner to member
  await supabase
    .from('workspace_members')
    .update({ role: 'member' })
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)

  // Upgrade new user to owner
  const { error } = await supabase
    .from('workspace_members')
    .update({ role: 'owner' })
    .eq('workspace_id', workspaceId)
    .eq('user_id', newOwnerId)

  if (error) return { error: error.message }
  
  await redis.del(`otp:transfer:${workspaceId}:${user.id}`)
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function getWorkspaceRole(workspaceId: string): Promise<WorkspaceRole> {
  return await getWorkspaceAccess(workspaceId)
}
