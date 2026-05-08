'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, RefreshCcw, Save, X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface ConflictModalProps {
  isOpen: boolean
  onClose: () => void
  currentValue: string
  incomingValue: string
  onOverwrite: () => void
  onReload: () => void
}

export function CategoryConflictModal({
  isOpen,
  onClose,
  currentValue,
  incomingValue,
  onOverwrite,
  onReload
}: ConflictModalProps) {
  if (!isOpen) return null

  const modal = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
        >
          {/* Glow Effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 blur-[100px] rounded-full" />
          
          <div className="relative space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Edit Conflict</h3>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Data has changed since you started editing</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Current Database Value</p>
                <p className="text-sm font-bold text-white line-through opacity-50">{currentValue}</p>
              </div>
              
              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-2">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Your Changes</p>
                <p className="text-sm font-bold text-white">{incomingValue}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={onOverwrite}
                className="w-full h-[56px] bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Overwrite Latest
              </button>
              
              <button
                onClick={onReload}
                className="w-full h-[56px] bg-white/5 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 border border-white/5 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" /> Reload & Discard
              </button>
              
              <button
                onClick={onClose}
                className="w-full h-[56px] text-zinc-500 font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all flex items-center justify-center gap-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}
