'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type UseTransactionSyncOptions = {
  workspaceId: string
  onUpsert: (record: any) => void
  onDelete: (id: string) => void
}

export function useTransactionSync({ workspaceId, onUpsert, onDelete }: UseTransactionSyncOptions) {
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const realtimeActiveRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    // ── Supabase Realtime subscription ──
    const channel = supabase
      .channel(`transactions:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          realtimeActiveRef.current = true
          onUpsert(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          realtimeActiveRef.current = true
          onUpsert(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'transactions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          realtimeActiveRef.current = true
          if (payload.old?.id) onDelete(payload.old.id)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          realtimeActiveRef.current = true
          // Clear polling fallback if realtime is active
          if (fallbackRef.current) {
            clearInterval(fallbackRef.current)
            fallbackRef.current = null
          }
        }
      })

    // ── 30s polling fallback ──
    // Start polling immediately; it will be cleared once realtime connects
    fallbackRef.current = setInterval(async () => {
      if (realtimeActiveRef.current) return // realtime is working, skip poll

      const { data } = await supabase
        .from('transactions')
        .select('*, categories(name, icon), subcategories(name)')
        .eq('workspace_id', workspaceId)
        .order('date', { ascending: false })

      if (data) {
        data.forEach((tx: any) => onUpsert(tx))
      }
    }, 30_000)

    return () => {
      supabase.removeChannel(channel)
      if (fallbackRef.current) clearInterval(fallbackRef.current)
    }
  }, [workspaceId, onUpsert, onDelete])
}
