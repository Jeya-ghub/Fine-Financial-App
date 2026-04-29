'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type CreateTransactionParams = {
  workspace_id: string
  category_id?: string
  amount: number
  type: 'income' | 'expense'
  description?: string
  date: string
}

export async function createTransaction(params: CreateTransactionParams) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      ...params,
      user_id: user.id,
      version_no: 1, // Start versioning at 1
    }])
    .select()
    .single()

  if (error) {
    return { error: error.message, status: 500 }
  }

  revalidatePath('/dashboard')
  return { success: true, data }
}

type UpdateTransactionParams = Partial<CreateTransactionParams> & {
  id: string
  expected_version: number
}

export async function updateTransaction(params: UpdateTransactionParams) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { id, expected_version, ...updates } = params

  // Perform the update conditionally based on the expected version
  // Also increment the version number atomically
  const { data, error } = await supabase
    .from('transactions')
    .update({
      ...updates,
      version_no: expected_version + 1
    })
    .eq('id', id)
    .eq('version_no', expected_version) // Optimistic locking condition
    .select()

  if (error) {
    return { error: error.message, status: 500 }
  }

  // If no rows were returned, the update failed either because the ID doesn't exist,
  // the user doesn't have access, or the version number mismatched.
  if (!data || data.length === 0) {
    // To be precise, we could check if the transaction exists at all to differentiate 
    // a 404 from a 409, but for now we'll assume it's a conflict or unauthorized.
    const { data: checkData } = await supabase.from('transactions').select('id').eq('id', id).single()
    if (checkData) {
       return { 
         error: 'Conflict: The transaction was updated by someone else. Please refresh and try again.',
         status: 409 
       }
    } else {
       return { error: 'Transaction not found or access denied', status: 404 }
    }
  }

  revalidatePath('/dashboard')
  return { success: true, data: data[0] }
}

export async function getTransactions(workspaceId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories (
        name, icon
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('date', { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  return { success: true, data }
}
