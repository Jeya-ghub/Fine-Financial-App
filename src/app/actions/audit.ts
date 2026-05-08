'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAuditLogs(workspaceId: string, recordIds?: string | string[]) {
  const supabase = await createClient()
  
  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (recordIds) {
    if (Array.isArray(recordIds)) {
      query = query.in('record_id', recordIds)
    } else {
      query = query.eq('record_id', recordIds)
    }
  }

  const { data, error } = await query.limit(50)
  
  if (error) return { error: error.message, data: null }
  return { data }
}

export async function restoreFromAudit(logId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Get the log entry
  const { data: log, error: logError } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('id', logId)
    .single()

  if (logError || !log) return { error: 'Audit log not found.' }

  const table = log.table_name
  const dataToRestore = log.old_data
  const recordId = log.record_id

  if (!dataToRestore) return { error: 'No restoration data available for this log entry.' }

  // 2. Perform restoration
  // We increment the version during restoration to treat it as a new update
  const { error: restoreError } = await supabase
    .from(table)
    .update({ 
      ...dataToRestore, 
      is_archived: false,
      version: dataToRestore.version + 1,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', recordId)

  if (restoreError) return { error: `Restoration failed: ${restoreError.message}` }

  revalidatePath('/dashboard/categories')
  return { success: true }
}
