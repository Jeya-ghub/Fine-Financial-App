import React from 'react'
import { motion } from 'framer-motion'
import { Edit2, Trash2, Tag, TrendingUp, TrendingDown, GripVertical } from 'lucide-react'
import { Category } from '@/types/category.types'
import { SubcategoryChips } from './SubcategoryChips'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  dragControls: any
}

export function CategoryCard({ category, onEdit, onDelete, dragControls }: CategoryCardProps) {
  const isIncome = category.type === 'income'

  return (
    <Card className="group relative overflow-hidden h-full">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div 
            onPointerDown={(e) => dragControls.start(e)}
            className="cursor-grab active:cursor-grabbing text-muted/20 hover:text-primary/60 transition-all p-2 -ml-2 hover:bg-surface-hover rounded-lg"
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          
          <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center shrink-0">
            <Tag className={`w-4 h-4 ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-primary uppercase tracking-tight leading-tight truncate">
                {category.name}
              </h3>
              <span className="text-[7px] font-black uppercase tracking-widest px-1 text-muted/40">
                {category.type}
              </span>
            </div>
            <div className="mt-1">
              <SubcategoryChips subcategories={category.subcategories || []} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onEdit(category)}
            className="w-8 h-8 rounded-lg hover:bg-surface-hover"
          >
            <Edit2 className="w-3.5 h-3.5 text-muted hover:text-primary" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(category)}
            className="w-8 h-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
