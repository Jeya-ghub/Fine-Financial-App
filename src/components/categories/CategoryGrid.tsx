import { motion, Reorder } from 'framer-motion'
import { Category } from '@/types/category.types'
import { CategoryCard } from './CategoryCard'

interface CategoryGridProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onReorder: (newOrder: Category[]) => void
}

export function CategoryGrid({ categories, onEdit, onDelete, onReorder }: CategoryGridProps) {
  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const handleReorder = (type: 'income' | 'expense', reordered: Category[]) => {
    const otherType = type === 'income' ? expenseCategories : incomeCategories
    onReorder([...reordered, ...otherType])
  }

  return (
    <div className="space-y-12">
      {incomeCategories.length > 0 && (
        <div>
          <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
            Income Categories
            <div className="flex-1 h-px bg-emerald-500/10" />
          </h2>
          <Reorder.Group 
            axis="y" 
            values={incomeCategories} 
            onReorder={(newOrder) => handleReorder('income', newOrder)}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {incomeCategories.map(cat => (
              <Reorder.Item 
                key={cat.id} 
                value={cat}
                className="relative"
              >
                <CategoryCard 
                  category={cat} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {expenseCategories.length > 0 && (
        <div>
          <h2 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
            Expense Categories
            <div className="flex-1 h-px bg-rose-500/10" />
          </h2>
          <Reorder.Group 
            axis="y" 
            values={expenseCategories} 
            onReorder={(newOrder) => handleReorder('expense', newOrder)}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {expenseCategories.map(cat => (
              <Reorder.Item 
                key={cat.id} 
                value={cat}
                className="relative"
              >
                <CategoryCard 
                  category={cat} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {categories.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-muted/20 text-xs font-bold uppercase tracking-widest">No categories found</p>
        </div>
      )}
    </div>
  )
}
