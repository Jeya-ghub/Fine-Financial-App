'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateWorkspaceAccess } from '@/lib/auth/permissions'

// ── Fetch all categories + subcategories for a workspace ────────────────────
export async function getCategoriesWithSubs(workspaceId: string) {
  const supabase = await createClient()

  // We use a join and filter subcategories that are not archived.
  // PostgREST 11.2+ supports filtering joined tables without filtering parents.
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories (*)
    `)
    .eq('is_archived', false)
    .eq('workspace_id', workspaceId)
    .eq('subcategories.is_archived', false)
    .order('name', { ascending: true })

  if (error) return { error: error.message, data: null, success: false }
  return { data: data ?? [], success: true }
}

// ── Create a new category ────────────────────────────────────────────────────
export async function createCategory(workspaceId: string, name: string, type: 'income' | 'expense') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  // 🛡️ SECURITY: Validate workspace access
  await validateWorkspaceAccess(workspaceId)

  // 🛡️ VALIDATION: Prevent duplicates
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('name', name)
    .eq('is_archived', false)
    .maybeSingle()
  
  if (existing) return { error: 'A category with this name already exists in this workspace.', success: false }

  const { data, error } = await supabase
    .from('categories')
    .insert({ workspace_id: workspaceId, name, type, created_by: user.id, updated_by: user.id })
    .select()
    .single()

  if (error) return { error: error.message, success: false }
  revalidatePath('/dashboard/categories')
  return { data, success: true }
}

// ── Update a category (Optimistic Concurrency) ──────────────────────────────
export async function updateCategory(id: string, name: string, expectedVersion: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  // 🛡️ SECURITY: Fetch category to get workspace_id and validate access
  const { data: cat } = await supabase.from('categories').select('workspace_id, name').eq('id', id).single()
  if (!cat) return { error: 'Category not found.', success: false }
  await validateWorkspaceAccess(cat.workspace_id)

  // 🛡️ VALIDATION: Prevent duplicates (if name changed)
  if (name !== cat.name) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('workspace_id', cat.workspace_id)
      .eq('name', name)
      .eq('is_archived', false)
      .maybeSingle()
    if (existing) return { error: 'A category with this name already exists.', success: false }
  }

  const { data, error } = await supabase
    .from('categories')
    .update({ 
      name, 
      updated_by: user.id, 
      updated_at: new Date().toISOString(),
      version: expectedVersion + 1 
    })
    .eq('id', id)
    .eq('version', expectedVersion) // Conflict detection
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { error: 'CONFLICT', message: 'This category was modified by another user.', success: false }
    return { error: error.message, success: false }
  }
  
  revalidatePath('/dashboard/categories')
  return { data, success: true }
}

// ── Delete a category (Soft delete, only non-default ones) ──────────────────
export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  // 🛡️ SECURITY: Validate workspace access
  const { data: cat } = await supabase.from('categories').select('workspace_id, is_default').eq('id', id).single()
  if (!cat) return { error: 'Category not found.', success: false }
  await validateWorkspaceAccess(cat.workspace_id)

  // 🛡️ SECURITY: Prevent deleting default categories
  if (cat?.is_default) return { error: 'System default categories cannot be deleted.', success: false }

  const { error } = await supabase
    .from('categories')
    .update({ 
      is_archived: true, 
      updated_at: new Date().toISOString(),
      updated_by: user.id 
    })
    .eq('id', id)

  if (error) return { error: error.message, success: false }
  revalidatePath('/dashboard/categories')
  return { success: true }
}

// ── Create a subcategory ─────────────────────────────────────────────────────
export async function createSubcategory(categoryId: string, workspaceId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  // 🛡️ SECURITY: Validate workspace access
  await validateWorkspaceAccess(workspaceId)

  // 🛡️ VALIDATION: Prevent duplicates
  const { data: existing } = await supabase
    .from('subcategories')
    .select('id')
    .eq('category_id', categoryId)
    .eq('name', name)
    .eq('is_archived', false)
    .maybeSingle()
  if (existing) return { error: 'A subcategory with this name already exists.', success: false }

  const { data, error } = await supabase
    .from('subcategories')
    .insert({ category_id: categoryId, workspace_id: workspaceId, name, created_by: user.id, updated_by: user.id })
    .select()
    .single()

  if (error) return { error: error.message, success: false }
  revalidatePath('/dashboard/categories')
  return { data, success: true }
}

// ── Update a subcategory (Optimistic Concurrency) ───────────────────────────
export async function updateSubcategory(id: string, name: string, expectedVersion: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  // 🛡️ SECURITY: Fetch subcategory to validate access
  const { data: sub } = await supabase.from('subcategories').select('workspace_id, category_id, name').eq('id', id).single()
  if (!sub) return { error: 'Subcategory not found.', success: false }
  await validateWorkspaceAccess(sub.workspace_id)

  // 🛡️ VALIDATION: Prevent duplicates
  if (name !== sub.name) {
    const { data: existing } = await supabase
      .from('subcategories')
      .select('id')
      .eq('category_id', sub.category_id)
      .eq('name', name)
      .eq('is_archived', false)
      .maybeSingle()
    if (existing) return { error: 'A subcategory with this name already exists.', success: false }
  }

  const { data, error } = await supabase
    .from('subcategories')
    .update({ 
      name, 
      updated_by: user.id,
      version: expectedVersion + 1
    })
    .eq('id', id)
    .eq('version', expectedVersion)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') return { error: 'CONFLICT', message: 'This subcategory was modified by another user.', success: false }
    return { error: error.message, success: false }
  }
  
  revalidatePath('/dashboard/categories')
  return { data, success: true }
}

// ── Delete a subcategory ─────────────────────────────────────────────────────
export async function deleteSubcategory(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', success: false }

  // 🛡️ SECURITY: Fetch subcategory to validate access
  const { data: sub } = await supabase.from('subcategories').select('workspace_id, is_default').eq('id', id).single()
  if (!sub) return { error: 'Subcategory not found.', success: false }
  await validateWorkspaceAccess(sub.workspace_id)

  // 🛡️ SECURITY: Prevent deleting default subcategories
  if (sub?.is_default) return { error: 'System default subcategories cannot be deleted.', success: false }

  const { error } = await supabase
    .from('subcategories')
    .update({ 
      is_archived: true, 
      updated_at: new Date().toISOString(),
      updated_by: user.id 
    })
    .eq('id', id)

  if (error) return { error: error.message, success: false }
  revalidatePath('/dashboard/categories')
  return { success: true }
}
