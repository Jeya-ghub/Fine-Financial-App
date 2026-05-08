'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, RotateCcw, ArrowLeft, Clock, User, Tag } from 'lucide-react'
import { getAuditLogs, restoreFromAudit } from '@/app/actions/audit'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface CategoryTimelineProps {
  workspaceId: string
  recordIds?: string | string[]
  onRestoreComplete?: () => void
}

export function CategoryTimeline({ workspaceId, recordIds, onRestoreComplete }: CategoryTimelineProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    const res = await getAuditLogs(workspaceId, recordIds)
    if (res.data) setLogs(res.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [workspaceId, JSON.stringify(recordIds)])

  const handleRestore = async (logId: string) => {
    if (!confirm('Restore this version? This will overwrite the current data.')) return
    setRestoringId(logId)
    const res = await restoreFromAudit(logId)
    setRestoringId(null)
    if (!res.error) {
      onRestoreComplete?.()
      fetchLogs()
    } else {
      alert(res.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-zinc-500" />
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Version History</h3>
        </div>
        <button onClick={fetchLogs} className="text-[9px] font-black text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">
          Refresh
        </button>
      </div>

      <div className="relative space-y-4">
        {/* Timeline Line */}
        <div className="absolute left-4 top-2 bottom-2 w-px bg-white/5" />

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 w-full bg-white/[0.02] animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-2xl">
            <Clock className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No history found</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {logs.map((log, idx) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative pl-10 group"
              >
                {/* Dot */}
                <div className={cn(
                  "absolute left-[13px] top-4 w-2 h-2 rounded-full border-2 border-[#0a0a0a] z-10",
                  log.action === 'INSERT' ? 'bg-emerald-500' :
                  log.action === 'DELETE' ? 'bg-red-500' : 'bg-blue-500'
                )} />

                <div className="bg-white/[0.02] border border-white/5 group-hover:border-white/10 p-4 rounded-2xl transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                        log.action === 'INSERT' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        log.action === 'DELETE' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-500'
                      )}>
                        {log.action}
                      </span>
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                        v{log.version}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-500">
                      {format(new Date(log.created_at), 'MMM d, HH:mm')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Tag className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-white uppercase truncate">
                        {log.new_data?.name ?? log.old_data?.name ?? 'Unnamed'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                          {log.table_name === 'categories' ? 'Category' : 'Subcategory'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <User className="w-2.5 h-2.5 text-zinc-700" />
                          <span className="text-[9px] font-bold text-zinc-700 truncate">System / Member</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {log.action === 'UPDATE' && log.old_data && (
                    <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-zinc-600 italic">
                      <span className="line-through opacity-50">{log.old_data.name}</span>
                      <ArrowLeft className="w-2.5 h-2.5 rotate-180 shrink-0" />
                      <span className="text-zinc-400">{log.new_data.name}</span>
                    </div>
                  )}

                  {log.action !== 'INSERT' && (
                    <button
                      onClick={() => handleRestore(log.id)}
                      disabled={restoringId === log.id}
                      className="w-full h-8 flex items-center justify-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-black text-white uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {restoringId === log.id ? (
                        <Clock className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          Restore this version
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
