'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { History, X, ChevronDown, RotateCcw, RotateCw, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTransactionHistory, undoTransaction, redoTransaction } from '@/app/actions/events'
import type { TransactionEvent } from '@/app/actions/events'

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Category = { id: string; name: string }

type AuditTimelineProps = {
  txId: string
  workspaceId: string
  categories?: Category[]
  onClose: () => void
  onUndoSuccess?: (data: any) => void
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const EVENT_CONFIG = {
  CREATED: { label: 'Initial Record', color: 'bg-white',     text: 'text-white', border: 'border-white/10', bg: 'bg-white/5' },
  UPDATED: { label: 'Revision',       color: 'bg-zinc-400',  text: 'text-zinc-400', border: 'border-white/5', bg: 'bg-white/[0.02]' },
  DELETED: { label: 'Removal',        color: 'bg-zinc-600',  text: 'text-zinc-600', border: 'border-white/5', bg: 'bg-white/[0.01]' },
  UNDO:    { label: 'Rolled Back',    color: 'bg-zinc-500',  text: 'text-zinc-500', border: 'border-white/5', bg: 'bg-white/[0.02]' },
  REDO:    { label: 'Re-applied',     color: 'bg-white',     text: 'text-white', border: 'border-white/10', bg: 'bg-white/5' },
} as const

const FIELD_LABELS: Record<string, string> = {
  amount:        'Amount',
  type:          'Type',
  date:          'Date',
  category_id:   'Category',
  description:   'Notes',
  subcategory_id:'Subcategory',
}

function formatFieldValue(field: string, value: any, categories: Category[]): string {
  if (value === null || value === undefined || value === '') return '—'
  if (field === 'amount') return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  if (field === 'category_id') return categories.find(c => c.id === value)?.name ?? value
  if (field === 'date') return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  if (field === 'type') return String(value).charAt(0).toUpperCase() + String(value).slice(1)
  return String(value)
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ─── EVENT CARD ──────────────────────────────────────────────────────────────
function EventCard({
  event,
  isFirst,
  isLast,
  categories,
}: {
  event: TransactionEvent
  isFirst: boolean
  isLast: boolean
  categories: Category[]
}) {
  const [expanded, setExpanded] = useState(isFirst)
  const cfg = EVENT_CONFIG[event.event_type]
  const TRACKED_FIELDS = ['amount', 'type', 'date', 'category_id', 'description']

  const diffs = TRACKED_FIELDS.filter(field => {
    const before = event.before_data?.[field]
    const after  = event.after_data?.[field]
    return before !== after && (before !== undefined || after !== undefined)
  })

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center select-none">
        <div className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5 z-10", cfg.color, cfg.color === 'bg-white' ? "shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "")} />
        {!isLast && <div className="w-px flex-1 bg-white/5 mt-1" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 mb-6 rounded-2xl overflow-hidden glass transition-all border", expanded ? "border-white/10 bg-white/[0.05]" : "border-white/5 bg-white/[0.02]")}>
        <button
          className="w-full flex items-start justify-between p-4 text-left cursor-pointer group"
          onClick={() => setExpanded(v => !v)}
        >
          <div className="space-y-1 select-none">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-[9px] font-black uppercase tracking-widest", cfg.text)}>
                {cfg.label}
              </span>
              <span className="text-[10px] font-bold text-zinc-600 truncate max-w-[150px]">
                by {event.user_email?.split('@')[0] || 'System'}
              </span>
            </div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">
              {formatTimestamp(event.created_at)}
            </p>
          </div>
          {diffs.length > 0 && (
            <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-600 shrink-0 transition-transform mt-0.5 group-hover:text-white", expanded && "rotate-180")} />
          )}
        </button>

        {/* Field Diffs */}
        <AnimatePresence>
          {expanded && diffs.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3 select-none cursor-default">
                {diffs.map(field => {
                  const before = event.before_data?.[field]
                  const after  = event.after_data?.[field]
                  return (
                    <div key={field} className="flex items-center justify-between gap-4">
                      <span className="text-zinc-600 font-black text-[9px] uppercase tracking-widest shrink-0">
                        {FIELD_LABELS[field] ?? field}
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        {before !== undefined && (
                          <span className="text-zinc-600 text-[10px] line-through truncate max-w-[80px]">
                            {formatFieldValue(field, before, categories)}
                          </span>
                        )}
                        {before !== undefined && after !== undefined && (
                          <ArrowRight className="w-2.5 h-2.5 text-zinc-700 shrink-0" />
                        )}
                        {after !== undefined && (
                          <span className="text-white font-black text-[10px] truncate max-w-[100px] tabular-nums">
                            {formatFieldValue(field, after, categories)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AuditTimeline({ txId, workspaceId, categories = [], onClose, onUndoSuccess }: AuditTimelineProps) {
  const [events, setEvents] = useState<TransactionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [undoing, setUndoing] = useState(false)
  const [redoing, setRedoing] = useState(false)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await getTransactionHistory(txId, workspaceId)
      if (res.error) setError(res.error)
      else setEvents(res.data ?? [])
      setLoading(false)
    }
    load()
  }, [txId, workspaceId])

  const latestEvent = events[0]
  const canUndo = latestEvent && latestEvent.event_type !== 'UNDO' && latestEvent.event_type !== 'CREATED' && latestEvent.event_type !== 'DELETED'
  const canRedo  = latestEvent && latestEvent.event_type === 'UNDO'

  async function handleUndo() {
    setUndoing(true)
    setActionMsg(null)
    const res = await undoTransaction(txId, workspaceId)
    setUndoing(false)
    if (res.error) {
      setActionMsg(res.error)
    } else {
      onUndoSuccess?.(res.data)
      const updated = await getTransactionHistory(txId, workspaceId)
      setEvents(updated.data ?? [])
    }
  }

  async function handleRedo() {
    setRedoing(true)
    setActionMsg(null)
    const res = await redoTransaction(txId, workspaceId)
    setRedoing(false)
    if (res.error) {
      setActionMsg(res.error)
    } else {
      onUndoSuccess?.(res.data)
      const updated = await getTransactionHistory(txId, workspaceId)
      setEvents(updated.data ?? [])
    }
  }

  const panel = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-stretch justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-[440px] h-full bg-[#0d0d0d] border-l border-white/5 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/5 flex items-center gap-4 shrink-0 select-none cursor-default">
            <div className="w-10 h-10 bg-white flex items-center justify-center rounded-2xl shadow-xl shadow-white/5">
              <History className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Audit Timeline</h2>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest font-mono truncate mt-0.5">
                Txn: {txId.slice(0, 12).toUpperCase()}
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-600 hover:text-white transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-[11px] text-red-400 font-medium">{error}</p>
              </div>
            ) : events.length === 0 ? (
              <div className="py-20 text-center">
                <History className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No history yet</p>
              </div>
            ) : (
              <div className="relative">
                {events.map((event, i) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isFirst={i === 0}
                    isLast={i === events.length - 1}
                    categories={categories}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer — Undo/Redo */}
          <div className="px-6 py-5 border-t border-white/5 shrink-0 space-y-3">
            {actionMsg && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <p className="text-[10px] text-amber-400 font-bold">{actionMsg}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleUndo}
                disabled={!canUndo || undoing || redoing}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-[52px] rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                  canUndo && !undoing && !redoing
                    ? "bg-white text-black border-white shadow-xl shadow-white/5"
                    : "bg-white/[0.02] border-white/5 text-zinc-700 cursor-not-allowed"
                )}
              >
                {undoing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Undo Changes
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo || undoing || redoing}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-[52px] rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                  canRedo && !undoing && !redoing
                    ? "bg-white text-black border-white shadow-xl shadow-white/5"
                    : "bg-white/[0.02] border-white/5 text-zinc-700 cursor-not-allowed"
                )}
              >
                {redoing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                Redo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  if (typeof window === 'undefined') return null
  return createPortal(panel, document.body)
}
