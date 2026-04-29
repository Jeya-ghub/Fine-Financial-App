'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', icon: 'DollarSign' },
  { name: 'Investments', type: 'income', icon: 'TrendingUp' },
  { name: 'Other Income', type: 'income', icon: 'PlusCircle' },
  { name: 'Housing', type: 'expense', icon: 'Home' },
  { name: 'Food', type: 'expense', icon: 'Utensils' },
  { name: 'Transportation', type: 'expense', icon: 'Car' },
  { name: 'Utilities', type: 'expense', icon: 'Zap' },
  { name: 'Entertainment', type: 'expense', icon: 'Tv' },
]

export async function createWorkspace(name: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // 1. Create Workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert([{ name }])
    .select()
    .single()

  if (workspaceError) {
    return { error: workspaceError.message }
  }

  // 2. Assign Owner
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert([{ 
      workspace_id: workspace.id, 
      user_id: user.id, 
      role: 'owner' 
    }])

  if (memberError) {
    return { error: memberError.message }
  }

  // 3. Seed Default Categories
  const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
    ...cat,
    workspace_id: workspace.id,
  }))

  const { error: categoryError } = await supabase
    .from('categories')
    .insert(categoriesToInsert)

  if (categoryError) {
    return { error: categoryError.message }
  }

  revalidatePath('/dashboard')
  return { success: true, workspace }
}

export async function getWorkspaces() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      id,
      name,
      workspace_members!inner(role)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  return { success: true, data }
}
