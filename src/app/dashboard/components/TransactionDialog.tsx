'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { X, Plus, Loader2, Calendar, DollarSign, Tag, FileText, ChevronDown, CheckCircle2, Hash, ArrowDown, ArrowUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { createTransaction } from '@/app/actions/transactions'
import { dispatchExternalOperation } from '@/lib/contexts/TransactionsContext'
import { suggestCategory } from '@/lib/ai/suggestions'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

type Category = {
  id: string
  name: string
  type: 'income' | 'expense'
  icon?: string
  subcategories?: { id: string; name: string }[]
}

type TransactionDialogProps = {
  workspaceId: string
  categories: Category[]
  showTrigger?: boolean
}

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  required = false
}: { 
  options: { id: string, name: string }[], 
  value: string, 
  onChange: (val: string) => void, 
  placeholder: string,
  disabled?: boolean,
  required?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.id === value)

  return (
    <div className={cn("relative", disabled && "opacity-40 cursor-not-allowed")} ref={dropdownRef}>
      <button 
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl pl-4 pr-10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-left flex items-center justify-between",
          value ? "text-white" : "text-zinc-600"
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.name : placeholder}</span>
        <ChevronDown className={cn("absolute right-4 w-4 h-4 text-zinc-600 transition-transform", isOpen && "rotate-180")} />
      </button>
      
      {required && !disabled && <input type="text" className="absolute opacity-0 w-full h-full top-0 left-0 pointer-events-none -z-10" value={value} required readOnly tabIndex={-1} />}

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[240px] custom-scrollbar overflow-y-auto"
          >
            {options.length === 0 ? (
               <div className="p-4 text-center text-zinc-600 text-xs font-bold uppercase tracking-widest">No options</div>
            ) : (
              <div className="py-2">
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onChange(option.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full text-left px-6 py-3 text-sm font-bold transition-colors hover:bg-white/5 block select-none cursor-pointer",
                      value === option.id ? "text-white bg-white/[0.05]" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TransactionDialog({ workspaceId, categories, showTrigger = true }: TransactionDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')
  const [suggestion, setSuggestion] = useState<{ categoryId: string; subcategoryId?: string } | null>(null)
  
  const amountInputRef = useRef<HTMLInputElement>(null)

  // Ensure portal target exists on client
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-transaction-dialog', handleOpen)
    return () => window.removeEventListener('open-transaction-dialog', handleOpen)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => amountInputRef.current?.focus(), 100)
    } else {
      document.body.style.overflow = 'unset'
      setSuccess(false)
      setAmount('')
      setCategoryId('')
      setSubcategoryId('')
      setDescription('')
      setError('')
      setSuggestion(null)
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [isOpen])

  // Reset category + subcategory when type changes
  useEffect(() => {
    setCategoryId('')
    setSubcategoryId('')
  }, [type])

  // AI Suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      const sug = suggestCategory(description, categories)
      setSuggestion(sug)
    }, 300)
    return () => clearTimeout(timer)
  }, [description, categories])

  const applySuggestion = () => {
    if (suggestion) {
      const cat = categories.find(c => c.id === suggestion.categoryId)
      if (cat) {
        setType(cat.type)
        setCategoryId(suggestion.categoryId)
        if (suggestion.subcategoryId) {
          setSubcategoryId(suggestion.subcategoryId)
        }
      }
      setSuggestion(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !categoryId) return

    setLoading(true)
    setError('')

    const payload = {
      workspace_id: workspaceId,
      category_id: categoryId,
      subcategory_id: subcategoryId || undefined,
      amount: Math.abs(parseFloat(amount)),
      type,
      description: description.trim(),
      date,
    }
    
    try {
      // 1. Call server action
      const result = await createTransaction(payload)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save transaction')
      }

      // 2. Dispatch optimistic operation for context update
      dispatchExternalOperation(workspaceId, 'CREATE', undefined, payload)

      // 3. Show success UI and close
      setSuccess(true)
      setLoading(false)
      setTimeout(() => {
        setIsOpen(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(c => c.type === type)

  // Subcategories of the selected category
  const filteredSubcategories = categoryId
    ? (categories.find(c => c.id === categoryId)?.subcategories ?? [])
    : []

  // Standard Button
  const triggerButton = (
    <button
      onClick={() => setIsOpen(true)}
      className="h-10 px-4 bg-white text-black font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-zinc-200 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-white/5 cursor-pointer select-none"
    >
      <Plus className="w-4 h-4" />
      <span className="hidden xs:inline">New Transaction</span>
      <span className="xs:hidden">New</span>
    </button>
  )

  // The Popup (Teleported to Body)
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && setIsOpen(false)}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold tracking-tight text-white/90">Add Transaction</h2>
                <button onClick={() => setIsOpen(false)} disabled={loading} className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {success ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-20 flex flex-col items-center justify-center text-center space-y-4 select-none cursor-default">
                  <div className="w-20 h-20 bg-white flex items-center justify-center rounded-full shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                    <CheckCircle2 className="w-12 h-12 text-black" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">Operation Successful</h3>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">Ledger Updated</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-xl h-11 select-none">
                    <button type="button" onClick={() => setType('expense')} className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer", type === 'expense' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-500 hover:text-white')}>
                      <ArrowDownRight className="w-4 h-4" /> Expense
                    </button>
                    <button type="button" onClick={() => setType('income')} className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer", type === 'income' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-500 hover:text-white')}>
                      <ArrowUpRight className="w-4 h-4" /> Income
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Date*</label>
                    <div className="relative">
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all [color-scheme:dark]" required />
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Category*</label>
                      <CustomSelect 
                        options={filteredCategories.map(c => ({ id: c.id, name: c.name }))}
                        value={categoryId}
                        onChange={setCategoryId}
                        placeholder="Select..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Subcategory*</label>
                      <CustomSelect 
                        options={filteredSubcategories.map(s => ({ id: s.id, name: s.name }))}
                        value={subcategoryId}
                        onChange={setSubcategoryId}
                        placeholder="Select..."
                        disabled={!categoryId || filteredSubcategories.length === 0}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Notes</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Context..." className="w-full h-20 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all resize-none custom-scrollbar" />
                    
                    <AnimatePresence>
                      {suggestion && (
                        <motion.button
                          type="button"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          onClick={applySuggestion}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl group hover:bg-emerald-500/20 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                            Suggest: {categories.find(c => c.id === suggestion.categoryId)?.name} 
                            {suggestion.subcategoryId && ` > ${categories.find(c => c.id === suggestion.categoryId)?.subcategories?.find(s => s.id === suggestion.subcategoryId)?.name}`}
                          </span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                   <div className="flex flex-col items-center py-4 border-t border-white/5">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">Amount (INR)*</span>
                    <div className="relative flex items-center justify-center w-full">
                      <span className="absolute left-10 text-2xl font-black text-zinc-700 tracking-tighter">₹</span>
                      <input ref={amountInputRef} type="number" inputMode="decimal" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-transparent text-5xl font-black text-white text-center placeholder:text-white/5 focus:outline-none tracking-tighter [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" required />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button type="submit" disabled={loading || !amount || !categoryId} className="w-full h-11 bg-white text-black font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-2xl shadow-white/5 cursor-pointer text-xs">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Save Entry</>}
                    </button>
                    <button type="button" onClick={() => setIsOpen(false)} className="w-full text-center text-[10px] font-black text-zinc-600 hover:text-white transition-colors uppercase tracking-[0.3em] cursor-pointer">Discard Draft</button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  if (!mounted) return showTrigger ? triggerButton : null

  return (
    <>
      {showTrigger && triggerButton}
      {createPortal(modalContent, document.body)}
    </>
  )
}
