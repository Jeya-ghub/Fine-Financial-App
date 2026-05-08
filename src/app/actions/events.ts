'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TransactionEvent = {
  id: string
  workspace_id: string
  entity_id: string
  event_type: 'CREATED' | 'UPDATED' | 'DELETED' | 'UNDO' | 'REDO'
  before_data: Record<string, any> | null
  after_data: Record<string, any> | null
  changed_fields: string[]
  user_id: string
  user_email: string | null
  created_at: string
}

// ─── GET HISTORY ─────────────────────────────────────────────────────────────

export async function getTransactionHistory(txId: string, workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', data: null }

  const { data: membership } = await supabase
    .from('workspace_members').select('id')
    .eq('workspace_id', workspaceId).eq('user_id', user.id).single()
  if (!membership) return { error: 'Unauthorized', data: null }

  const { data, error } = await supabase
    .from('transaction_events')
    .select('*')
    .eq('entity_id', txId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { error: error.message, data: null }
  return { data: data as TransactionEvent[] }
}

// ─── UNDO LAST EVENT ─────────────────────────────────────────────────────────

export async function undoTransaction(txId: string, workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: membership } = await supabase
    .from('workspace_members').select('id')
    .eq('workspace_id', workspaceId).eq('user_id', user.id).single()
  if (!membership) return { error: 'Unauthorized' }

  // Fetch most recent events
  const { data: events } = await supabase
    .from('transaction_events')
    .select('*')
    .eq('entity_id', txId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!events || events.length === 0) return { error: 'No history to undo' }

  const lastEvent = events[0] as TransactionEvent

  if (lastEvent.event_type === 'UNDO') {
    return { error: 'Last action was already an undo. Use Redo instead.' }
  }
  if (lastEvent.event_type === 'DELETED') {
    return { error: 'Cannot undo a deletion. Contact support to restore.' }
  }
  if (lastEvent.event_type === 'CREATED' || !lastEvent.before_data) {
    return { error: 'Cannot undo the original creation of a transaction.' }
  }

  // Get current record for optimistic lock
  const { data: current } = await supabase
    .from('transactions').select('*').eq('id', txId).single()
  if (!current) return { error: 'Transaction no longer exists.' }

  const before = lastEvent.before_data
  const { data: restored, error: updateError } = await supabase
    .from('transactions')
    .update({
      amount:         before.amount,
      type:           before.type,
      date:           before.date,
      category_id:    before.category_id,
      subcategory_id: before.subcategory_id,
      description:    before.description,
      version_no:     current.version_no + 1,
    })
    .eq('id', txId)
    .eq('version_no', current.version_no) // optimistic lock
    .select()
    .single()

  if (updateError || !restored) {
    return { error: 'Conflict: the transaction was modified by someone else. Refresh and retry.' }
  }

  // Emit UNDO event (the undo itself is audited)
  await supabase.from('transaction_events').insert({
    workspace_id:   workspaceId,
    entity_id:      txId,
    event_type:     'UNDO',
    before_data:    current,      // what we reverted FROM
    after_data:     restored,     // what we restored TO
    changed_fields: lastEvent.changed_fields ?? [],
    user_id:        user.id,
    user_email:     user.email,
  })

  revalidatePath('/dashboard/transactions')
  return { success: true, data: restored }
}

// ─── REDO LAST UNDO ──────────────────────────────────────────────────────────

export async function redoTransaction(txId: string, workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: membership } = await supabase
    .from('workspace_members').select('id')
    .eq('workspace_id', workspaceId).eq('user_id', user.id).single()
  if (!membership) return { error: 'Unauthorized' }

  const { data: events } = await supabase
    .from('transaction_events')
    .select('*')
    .eq('entity_id', txId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!events || events.length === 0) return { error: 'Nothing to redo' }
  const lastEvent = events[0] as TransactionEvent

  if (lastEvent.event_type !== 'UNDO') {
    return { error: 'Last action was not an undo. Nothing to redo.' }
  }

  const afterData = lastEvent.before_data // "before" of the UNDO = what we want to reapply
  if (!afterData) return { error: 'No data to redo.' }

  const { data: current } = await supabase
    .from('transactions').select('*').eq('id', txId).single()
  if (!current) return { error: 'Transaction no longer exists.' }

  const { data: redone, error: updateError } = await supabase
    .from('transactions')
    .update({
      amount:         afterData.amount,
      type:           afterData.type,
      date:           afterData.date,
      category_id:    afterData.category_id,
      subcategory_id: afterData.subcategory_id,
      description:    afterData.description,
      version_no:     current.version_no + 1,
    })
    .eq('id', txId)
    .eq('version_no', current.version_no)
    .select()
    .single()

  if (updateError || !redone) {
    return { error: 'Conflict: the transaction was modified. Refresh and retry.' }
  }

  await supabase.from('transaction_events').insert({
    workspace_id:   workspaceId,
    entity_id:      txId,
    event_type:     'REDO',
    before_data:    current,
    after_data:     redone,
    changed_fields: lastEvent.changed_fields ?? [],
    user_id:        user.id,
    user_email:     user.email,
  })

  revalidatePath('/dashboard/transactions')
  return { success: true, data: redone }
}
