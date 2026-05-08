import React from 'react'
import { Category } from '@/types/category.types'
import { CategoryCard } from './CategoryCard'

interface CategoryGridProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoryGrid({ categories, onEdit, onDelete }: CategoryGridProps) {
  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  return (
    <div className="space-y-12">
      {incomeCategories.length > 0 && (
        <div>
          <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
            Income Categories
            <div className="flex-1 h-px bg-emerald-500/10" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {incomeCategories.map(cat => (
              <CategoryCard 
                key={cat.id} 
                category={cat} 
                onEdit={onEdit} 
                onDelete={onDelete} 
              />
            ))}
          </div>
        </div>
      )}

      {expenseCategories.length > 0 && (
        <div>
          <h2 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
            Expense Categories
            <div className="flex-1 h-px bg-rose-500/10" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {expenseCategories.map(cat => (
              <CategoryCard 
                key={cat.id} 
                category={cat} 
                onEdit={onEdit} 
                onDelete={onDelete} 
              />
            ))}
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No categories found</p>
        </div>
      )}
    </div>
  )
}
