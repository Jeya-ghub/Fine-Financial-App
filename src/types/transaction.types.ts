export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  workspace_id: string
  user_id: string
  category_id?: string
  subcategory_id?: string
  amount: number
  type: TransactionType
  description?: string
  date: string
  version_no: number
  created_at?: string
  updated_at?: string
  
  // Joined fields
  categories?: {
    name: string
    icon?: string
  }
  subcategories?: {
    name: string
  }
  
  // UI helper fields
  _isOptimistic?: boolean
  _pendingDelete?: boolean
}

export interface CreateTransactionData {
  workspace_id: string
  category_id?: string
  subcategory_id?: string
  amount: number
  type: TransactionType
  description?: string
  date: string
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {
  id: string
  expected_version: number
}
