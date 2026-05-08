'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeCategories(workspaceId: string, onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to both categories and subcategories changes for this workspace
    const channel = supabase
      .channel(`categories-realtime-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `workspace_id=eq.${workspaceId}`
        },
        () => {
          onUpdate()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subcategories',
          filter: `workspace_id=eq.${workspaceId}`
        },
        () => {
          onUpdate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, onUpdate])
}
