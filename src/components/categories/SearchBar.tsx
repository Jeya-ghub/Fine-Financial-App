import React from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = "Search categories..." }: SearchBarProps) {
  return (
    <div className="relative group flex-1 max-w-md">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search className="w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 bg-surface-hover/50 border border-surface-border rounded-2xl pl-11 pr-4 text-xs font-bold text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        placeholder={placeholder}
      />
    </div>
  )
}
