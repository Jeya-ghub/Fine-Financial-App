export type CategoryType = 'income' | 'expense'

export interface Subcategory {
  id: string
  name: string
  category_id: string
  workspace_id: string
  created_at: string
  is_default?: boolean
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  workspace_id: string
  created_by: string
  created_at: string
  updated_at: string
  icon?: string
  is_default?: boolean
  subcategories?: Subcategory[]
}

export interface CreateCategoryData {
  name: string
  type: CategoryType
  workspace_id: string
  subcategories: string[] // List of names to create
}

export interface UpdateCategoryData {
  name?: string
  type?: CategoryType
  subcategories?: { id?: string; name: string }[] // Mix of existing and new
}
