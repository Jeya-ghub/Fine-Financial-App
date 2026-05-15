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
    <Card className="group relative overflow-hidden h-full min-h-[140px]">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="mt-1 cursor-grab active:cursor-grabbing text-muted/20 hover:text-primary/40 transition-colors"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-primary uppercase tracking-tight leading-tight">{category.name}</h3>
              <span className="mt-1 text-[8px] font-black text-muted uppercase tracking-widest block">
                {category.type}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>

        <SubcategoryChips subcategories={category.subcategories || []} />
      </CardContent>
    </Card>
  )
}
