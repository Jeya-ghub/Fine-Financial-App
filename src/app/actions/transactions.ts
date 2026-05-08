'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── HELPERS ────────────────────────────────────────────────────────────────

function computeChangedFields(before: any, after: any): string[] {
  const tracked = ['amount', 'type', 'date', 'category_id', 'subcategory_id', 'description']
  return tracked.filter(field => String(before?.[field]) !== String(after?.[field]))
}

async function emitEvent(
  supabase: any,
  params: {
    workspaceId: string
    entityId: string
    eventType: 'CREATED' | 'UPDATED' | 'DELETED' | 'UNDO' | 'REDO'
    beforeData?: any
    afterData?: any
    changedFields?: string[]
    userId: string
    userEmail?: string
  }
) {
  const { error } = await supabase.from('transaction_events').insert({
    workspace_id:   params.workspaceId,
    entity_id:      params.entityId,
    event_type:     params.eventType,
    before_data:    params.beforeData ?? null,
    after_data:     params.afterData ?? null,
    changed_fields: params.changedFields ?? [],
    user_id:        params.userId,
    user_email:     params.userEmail ?? null,
  })
  if (error) console.error('[EventEmitter] Failed to write event:', error.message)
}

// ─── CREATE ─────────────────────────────────────────────────────────────────

type CreateTransactionParams = {
  workspace_id: string
  category_id?: string
  subcategory_id?: string
  amount: number
  type: 'income' | 'expense'
  description?: string
  date: string
}

export async function createTransaction(params: CreateTransactionParams) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: membership } = await supabase
    .from('workspace_members').select('id')
    .eq('workspace_id', params.workspace_id).eq('user_id', user.id).single()
  if (!membership) return { error: 'Unauthorized: workspace access denied', status: 403 }

  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...params, user_id: user.id, version_no: 1 }])
    .select().single()

  if (error) return { error: error.message, success: false }

  await emitEvent(supabase, {
    workspaceId: params.workspace_id,
    entityId:    data.id,
    eventType:   'CREATED',
    afterData:   data,
    userId:      user.id,
    userEmail:   user.email,
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/transactions')
  return { success: true, data }
}

// ─── UPDATE ─────────────────────────────────────────────────────────────────

type UpdateTransactionParams = {
  id: string
  expected_version: number
  workspace_id: string
  category_id?: string
  subcategory_id?: string
  amount?: number
  type?: 'income' | 'expense'
  description?: string
  date?: string
}

export async function updateTransaction(params: UpdateTransactionParams) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { id, expected_version, workspace_id, ...updates } = params

  const { data: membership } = await supabase
    .from('workspace_members').select('id')
    .eq('workspace_id', workspace_id).eq('user_id', user.id).single()
  if (!membership) return { error: 'Unauthorized: workspace access denied', status: 403 }

  // Fetch before-state for event sourcing
  const { data: before } = await supabase
    .from('transactions').select('*').eq('id', id).single()

  // Optimistic-lock update
  const { data, error } = await supabase
    .from('transactions')
    .update({ ...updates, version_no: expected_version + 1 })
    .eq('id', id)
    .eq('workspace_id', workspace_id)
    .eq('version_no', expected_version)
    .select()

  if (error) return { error: error.message, success: false }

  if (!data || data.length === 0) {
    // Optimistic lock failed → fetch latest for conflict modal
    const { data: serverRecord } = await supabase
      .from('transactions').select('*').eq('id', id).single()
    return {
      error: 'CONFLICT',
      success: false,
      serverRecord,
    }
  }

  const after = data[0]
  await emitEvent(supabase, {
    workspaceId:   workspace_id,
    entityId:      id,
    eventType:     'UPDATED',
    beforeData:    before,
    afterData:     after,
    changedFields: computeChangedFields(before, updates),
    userId:        user.id,
    userEmail:     user.email,
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/transactions')
  return { success: true, data: after }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────

export async function deleteTransaction(id: string, workspace_id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: membership } = await supabase
    .from('workspace_members').select('id')
    .eq('workspace_id', workspace_id).eq('user_id', user.id).single()
  if (!membership) return { error: 'Unauthorized: workspace access denied', status: 403 }

  // Snapshot before delete
  const { data: before } = await supabase
    .from('transactions').select('*').eq('id', id).single()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspace_id)
    .eq('user_id', user.id)

  if (error) return { error: error.message, status: 500 }

  if (before) {
    await emitEvent(supabase, {
      workspaceId: workspace_id,
      entityId:    id,
      eventType:   'DELETED',
      beforeData:  before,
      userId:      user.id,
      userEmail:   user.email,
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/transactions')
  return { success: true }
}

// ─── READ ────────────────────────────────────────────────────────────────────

export async function getTransactions(workspaceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select(`*, categories(name, icon), subcategories(name)`)
    .eq('workspace_id', workspaceId)
    .order('date', { ascending: false })
  if (error) return { error: error.message, data: null, success: false }
  return { success: true, data }
}

