import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Tag, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Category, CategoryType } from '@/types/category.types'

interface CategoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  initialData?: Category | null
  isLoading?: boolean
}

export function CategoryDrawer({ isOpen, onClose, onSave, initialData, isLoading }: CategoryDrawerProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>('expense')
  const [subInput, setSubInput] = useState('')
  const [subcategories, setSubcategories] = useState<string[]>([])

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setType(initialData.type)
      setSubcategories(initialData.subcategories?.map(s => s.name) || [])
    } else {
      setName('')
      setType('expense')
      setSubcategories([])
    }
  }, [initialData, isOpen])

  const addSubcategory = () => {
    const trimmed = subInput.trim()
    if (trimmed && !subcategories.includes(trimmed)) {
      setSubcategories([...subcategories, trimmed])
      setSubInput('')
    }
  }

  const removeSubcategory = (name: string) => {
    setSubcategories(subcategories.filter(s => s !== name))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    // Auto-add pending subcategory if present
    const finalSubcategories = [...subcategories]
    const trimmedSub = subInput.trim()
    if (trimmedSub && !finalSubcategories.includes(trimmedSub)) {
      finalSubcategories.push(trimmedSub)
    }

    await onSave({
      name: name.trim(),
      type,
      subcategories: finalSubcategories
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[500] w-full max-w-md bg-surface border-l border-surface-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-primary uppercase tracking-tight">
                  {initialData ? 'Edit Category' : 'New Category'}
                </h3>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                  Organize your finances efficiently
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-2xl hover:bg-surface-hover text-muted hover:text-primary transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 pt-0 space-y-8 custom-scrollbar">
              {/* Type Toggle */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Category Type</label>
                <div className="flex items-center gap-8 px-1">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      type === 'expense' ? 'text-rose-500' : 'text-muted/40 hover:text-muted'
                    }`}
                  >
                    Expense
                    {type === 'expense' && <motion.div layoutId="type-dot" className="w-1 h-1 rounded-full bg-rose-500" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      type === 'income' ? 'text-emerald-500' : 'text-muted/40 hover:text-muted'
                    }`}
                  >
                    Income
                    {type === 'income' && <motion.div layoutId="type-dot" className="w-1 h-1 rounded-full bg-emerald-500" />}
                  </button>
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Category Name</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Food & Dining, Salary"
                  className="w-full h-14 bg-surface-hover/30 border border-surface-border rounded-2xl px-5 text-sm font-bold text-primary placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                />
              </div>

              {/* Subcategories Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Subcategories</label>
                <div className="relative">
                  <input
                    type="text"
                    value={subInput}
                    onChange={(e) => setSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSubcategory()
                      }
                    }}
                    placeholder="Type and press Enter..."
                    className="w-full h-14 bg-surface-hover/30 border border-surface-border rounded-2xl px-5 pr-14 text-sm font-bold text-primary placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={addSubcategory}
                    className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-primary text-background flex items-center justify-center hover:opacity-90 transition-all shadow-sm active:scale-90"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {subcategories.map((sub) => (
                    <motion.div
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-surface-hover border border-surface-border hover:border-primary/20 transition-all"
                      key={sub}
                    >
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{sub}</span>
                      <button
                        type="button"
                        onClick={() => removeSubcategory(sub)}
                        className="p-1 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-500 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                  {subcategories.length === 0 && (
                    <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest italic p-2">
                      No subcategories added yet
                    </p>
                  )}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-8 border-t border-surface-border bg-surface shrink-0">
              <Button
                onClick={handleSave}
                isLoading={isLoading}
                className="w-full h-14 text-[10px]"
                disabled={!name.trim()}
              >
                {initialData ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
