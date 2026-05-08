import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Category } from '@/types/category.types'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  category: Category | null
  isLoading?: boolean
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, category, isLoading }: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
          >
            {/* Decoration */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 blur-[80px] rounded-full" />
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6">
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Delete Category?</h3>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed mb-8">
                Are you sure you want to delete <span className="text-white">"{category?.name}"</span>? 
                This will also remove all associated subcategories. This action cannot be undone.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full">
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  className="h-12 text-[10px]"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  onClick={onConfirm}
                  isLoading={isLoading}
                  className="h-12 bg-rose-600 hover:bg-rose-500 text-[10px]"
                >
                  Delete Category
                </Button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
