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
        <Search className="w-4 h-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        placeholder={placeholder}
      />
    </div>
  )
}
