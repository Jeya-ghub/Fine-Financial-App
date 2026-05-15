import React from 'react'
import { motion } from 'framer-motion'
import { Edit2, Trash2, Tag, TrendingUp, TrendingDown } from 'lucide-react'
import { Category } from '@/types/category.types'
import { SubcategoryChips } from './SubcategoryChips'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const isIncome = category.type === 'income'

  return (
    <Card className="group relative overflow-hidden h-full min-h-[140px]">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-black text-primary uppercase tracking-tight leading-tight">{category.name}</h3>
            <span className="mt-1 text-[8px] font-black text-muted uppercase tracking-widest block">
              {category.type}
            </span>
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
