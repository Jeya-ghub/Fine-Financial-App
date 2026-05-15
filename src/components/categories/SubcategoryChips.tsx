import React from 'react'

interface SubcategoryChipsProps {
  subcategories: { id: string; name: string }[]
}

export function SubcategoryChips({ subcategories }: SubcategoryChipsProps) {
  if (!subcategories || subcategories.length === 0) return null

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
      {subcategories.map((sub) => (
        <span 
          key={sub.id}
          className="text-[9px] font-bold text-muted/40 uppercase tracking-widest whitespace-nowrap"
        >
          {sub.name}
        </span>
      ))}
    </div>
  )
}
