'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-blue/10 border border-accent-blue/20 rounded-full group hover:border-accent-blue/40 transition-colors"
    >
      <span className="text-[9px] font-black uppercase tracking-widest text-accent-blue/80">{label}</span>
      <button 
        onClick={onRemove}
        className="p-0.5 hover:bg-accent-blue/20 rounded-full transition-colors"
      >
        <X className="w-2.5 h-2.5 text-accent-blue" />
      </button>
    </motion.div>
  )
}
