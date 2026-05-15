import React from 'react'

interface SubcategoryChipsProps {
  subcategories: { id: string; name: string }[]
}

export function SubcategoryChips({ subcategories }: SubcategoryChipsProps) {
  if (!subcategories || subcategories.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {subcategories.map((sub) => (
        <span 
          key={sub.id}
          className="px-2 py-0.5 rounded-full bg-surface-hover/50 border border-surface-border text-[9px] font-bold text-muted uppercase tracking-widest whitespace-nowrap"
        >
          {sub.name}
        </span>
      ))}
    </div>
  )
}
