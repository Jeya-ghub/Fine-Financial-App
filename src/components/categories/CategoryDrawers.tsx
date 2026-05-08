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
    await onSave({
      name: name.trim(),
      type,
      subcategories: subcategories
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
            className="fixed inset-y-0 right-0 z-[500] w-full max-w-md bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  {initialData ? 'Edit Category' : 'New Category'}
                </h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                  Organize your finances efficiently
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-2xl hover:bg-white/5 text-white/20 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 pt-0 space-y-8 custom-scrollbar">
              {/* Type Toggle */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Category Type</label>
                <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      type === 'expense' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      type === 'income' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Income
                  </button>
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Category Name</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Food & Dining, Salary"
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>

              {/* Subcategories Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Subcategories</label>
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
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 pr-14 text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={addSubcategory}
                    className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
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
                      className="group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20"
                      key={sub}
                    >
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{sub}</span>
                      <button
                        type="button"
                        onClick={() => removeSubcategory(sub)}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-blue-400 hover:text-rose-400 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                  {subcategories.length === 0 && (
                    <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest italic p-2">
                      No subcategories added yet
                    </p>
                  )}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-8 border-t border-white/5 bg-white/[0.02] backdrop-blur-xl">
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
