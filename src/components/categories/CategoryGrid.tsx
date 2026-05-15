import { motion, Reorder, useDragControls } from 'framer-motion'
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
            className="space-y-3"
          >
            {incomeCategories.map(cat => {
              const controls = useDragControls()
              return (
                <Reorder.Item 
                  key={cat.id} 
                  value={cat}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  dragControls={controls}
                  dragListener={false}
                  whileDrag={{ 
                    scale: 1.01,
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                    zIndex: 50
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 600,
                    damping: 40
                  }}
                  className="relative"
                >
                  <CategoryCard 
                    category={cat} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                    dragControls={controls}
                  />
                </Reorder.Item>
              )
            })}
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
            className="space-y-3"
          >
            {expenseCategories.map(cat => {
              const controls = useDragControls()
              return (
                <Reorder.Item 
                  key={cat.id} 
                  value={cat}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  dragControls={controls}
                  dragListener={false}
                  whileDrag={{ 
                    scale: 1.01,
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                    zIndex: 50
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 600,
                    damping: 40
                  }}
                  className="relative"
                >
                  <CategoryCard 
                    category={cat} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                    dragControls={controls}
                  />
                </Reorder.Item>
              )
            })}
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
