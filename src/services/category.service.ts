import { createClient } from '@/lib/supabase/client'
import { Category, CategoryType, CreateCategoryData, UpdateCategoryData } from '@/types/category.types'

export const categoryService = {
  async getCategories(workspaceId: string): Promise<Category[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, type, icon, is_default, workspace_id, created_by, created_at, updated_at, subcategories(id, name, category_id, workspace_id, created_at, is_default)')
      .eq('workspace_id', workspaceId)
      .eq('is_archived', false)
      .order('order_index', { ascending: true })
      .order('name')

    if (error) throw error
    return data as Category[]
  },

  async createCategory(data: CreateCategoryData) {
    const supabase = createClient()
    
    // 1. Insert Category
    const { data: category, error: catError } = await supabase
      .from('categories')
      .insert({
        name: data.name,
        type: data.type,
        workspace_id: data.workspace_id,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (catError) throw catError

    // 2. Insert Subcategories
    if (data.subcategories.length > 0) {
      const subData = data.subcategories.map(name => ({
        name,
        category_id: category.id,
        workspace_id: data.workspace_id,
        created_by: category.created_by
      }))
      const { error: subError } = await supabase.from('subcategories').insert(subData)
      if (subError) throw subError
    }

    return category
  },

  async updateCategory(id: string, data: UpdateCategoryData, workspaceId: string) {
    const supabase = createClient()
    
    // 1. Update Category
    if (data.name || data.type) {
      const { error: catError } = await supabase
        .from('categories')
        .update({
          ...(data.name && { name: data.name }),
          ...(data.type && { type: data.type }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (catError) throw catError
    }

    // 2. Diff Subcategories
    if (data.subcategories) {
      const { data: currentSubs } = await supabase
        .from('subcategories')
        .select('id, name')
        .eq('category_id', id)

      const currentNames = currentSubs?.map(s => s.name) || []
      const targetNames = data.subcategories.map(s => s.name)

      // To Delete
      const toDelete = currentSubs?.filter(s => !targetNames.includes(s.name)).map(s => s.id)
      if (toDelete && toDelete.length > 0) {
        await supabase.from('subcategories').delete().in('id', toDelete)
      }

      // To Add
      const toAdd = targetNames.filter(name => !currentNames.includes(name))
      if (toAdd.length > 0) {
        const userId = (await supabase.auth.getUser()).data.user?.id
        const subData = toAdd.map(name => ({
          name,
          category_id: id,
          workspace_id: workspaceId,
          created_by: userId
        }))
        await supabase.from('subcategories').insert(subData)
      }
    }
  },

  async deleteCategory(id: string) {
    const supabase = createClient()
    
    // Subcategories should ideally be deleted by cascade or manually
    // Manual delete to be safe
    await supabase.from('subcategories').delete().eq('category_id', id)
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async updateCategoriesOrder(orders: { id: string; order_index: number }[]) {
    const supabase = createClient()
    
    // Perform parallel updates
    const updates = orders.map(async ({ id, order_index }) => {
      const { error } = await supabase
        .from('categories')
        .update({ order_index })
        .eq('id', id)
      if (error) throw error
    })

    await Promise.all(updates)
  }
}
