'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Check, X, GitMerge, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConflictPayload } from '@/lib/contexts/TransactionsContext'

type Category = { id: string; name: string }

const FIELD_LABELS: Record<string, string> = {
  amount:      'Amount',
  type:        'Type',
  date:        'Date',
  category_id: 'Category',
  description: 'Notes',
}

function formatValue(field: string, value: any, categories: Category[]): string {
  if (value === null || value === undefined || value === '') return '—'
  if (field === 'amount') return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  if (field === 'category_id') return categories.find(c => c.id === value)?.name ?? value
  if (field === 'type') return String(value).charAt(0).toUpperCase() + String(value).slice(1)
  if (field === 'date') return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return String(value)
}

type ConflictResolutionModalProps = {
  conflict: ConflictPayload
  categories: Category[]
  onResolve: (resolution: 'keep-mine' | 'accept-server' | 'manual' | 'cancel', manualPayload?: any) => void
}

export default function ConflictResolutionModal({ conflict, categories, onResolve }: ConflictResolutionModalProps) {
  const [mode, setMode] = useState<'compare' | 'manual'>('compare')
  const [manualValues, setManualValues] = useState<Record<string, any>>({
    amount:      conflict.operation.payload?.amount ?? '',
    type:        conflict.operation.payload?.type ?? 'expense',
    date:        conflict.operation.payload?.date ?? '',
    category_id: conflict.operation.payload?.category_id ?? '',
    description: conflict.operation.payload?.description ?? '',
  })

  const local  = conflict.operation.payload
  const server = conflict.serverRecord
  const FIELDS = ['amount', 'type', 'date', 'category_id', 'description'] as const

  function isDifferent(field: string): boolean {
    return String((local as any)?.[field] ?? '') !== String((server as any)?.[field] ?? '')
  }

  function handleManualSubmit() {
    onResolve('manual', {
      id:               server.id,
      expected_version: server.version_no,
      ...manualValues,
      amount: parseFloat(String(manualValues.amount)),
    })
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/5 flex items-center gap-4 select-none cursor-default">
            <div className="w-10 h-10 bg-white flex items-center justify-center shrink-0 rounded-2xl shadow-xl shadow-white/5">
              <AlertTriangle className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Conflict Detected</h2>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                Data integrity mismatch found during operation
              </p>
            </div>
            <button
              onClick={() => onResolve('cancel')}
              className="p-2 text-zinc-600 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-8">
            {mode === 'compare' ? (
              <>
                {/* Column Headers */}
                <div className="grid grid-cols-[1fr_32px_1fr] gap-4 mb-4">
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2.5 text-center">
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.25em]">Your Changes</p>
                  </div>
                  <div />
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-center">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.25em]">Latest Saved</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {FIELDS.map(field => {
                    const differs = isDifferent(field)
                    return (
                      <div key={field} className={cn(
                        "grid grid-cols-[1fr_32px_1fr] gap-4 items-center px-4 py-3 rounded-2xl transition-colors border select-none cursor-default",
                        differs ? "bg-white/[0.03] border-white/10" : "border-transparent opacity-40"
                      )}>
                        {/* Local value */}
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">{FIELD_LABELS[field]}</p>
                          <p className={cn("text-xs font-bold truncate", differs ? "text-white" : "text-zinc-500")}>
                            {formatValue(field, (local as any)?.[field], categories)}
                          </p>
                        </div>
                        <div className="flex justify-center">
                          <ArrowRight className={cn("w-3 h-3", differs ? "text-zinc-500" : "text-zinc-800")} />
                        </div>
                        {/* Server value */}
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">{FIELD_LABELS[field]}</p>
                          <p className={cn("text-xs font-black truncate", differs ? "text-white" : "text-zinc-500")}>
                            {formatValue(field, (server as any)?.[field], categories)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              // Manual merge form
              <div className="space-y-4">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">
                  Edit your final values — these will be saved
                </p>
                {FIELDS.map(field => (
                  <div key={field} className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                      {FIELD_LABELS[field]}
                    </label>
                    {field === 'description' ? (
                      <textarea
                        value={manualValues[field] ?? ''}
                        onChange={e => setManualValues(prev => ({ ...prev, [field]: e.target.value }))}
                        rows={3}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                      />
                    ) : field === 'type' ? (
                      <div className="flex gap-2">
                        {['expense', 'income'].map(t => (
                          <button key={t} type="button"
                            onClick={() => setManualValues(prev => ({ ...prev, type: t }))}
                            className={cn(
                              "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                              manualValues.type === t
                                ? "bg-white text-black border-white"
                                : "bg-white/5 text-zinc-500 border-white/10 hover:text-white"
                            )}
                          >{t}</button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type={field === 'amount' ? 'number' : field === 'date' ? 'date' : 'text'}
                        value={manualValues[field] ?? ''}
                        onChange={e => setManualValues(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full h-11 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 [color-scheme:dark]"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-white/5 flex items-center gap-3 flex-wrap">
            {mode === 'compare' ? (
              <>
                <button
                  onClick={() => onResolve('keep-mine')}
                  className="flex items-center gap-2 h-[52px] px-6 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Overwrite
                </button>
                <button
                  onClick={() => onResolve('accept-server')}
                  className="flex items-center gap-2 h-[52px] px-6 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all cursor-pointer"
                >
                  Accept Server
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className="flex items-center gap-2 h-[52px] px-6 border border-white/10 text-zinc-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Manual Merge
                </button>
                <button
                  onClick={() => onResolve('cancel')}
                  className="ml-auto h-[52px] px-6 text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Discard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setMode('compare')}
                  className="h-[44px] px-5 bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={handleManualSubmit}
                  className="flex items-center gap-2 h-[44px] px-6 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all ml-auto"
                >
                  <Check className="w-3.5 h-3.5" /> Save Merged Version
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
