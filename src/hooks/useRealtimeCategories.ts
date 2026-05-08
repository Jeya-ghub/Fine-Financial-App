'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { categoryService } from '@/services/category.service'
import { Category } from '@/types/category.types'

export function useRealtimeCategories(workspaceId: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadCategories = useCallback(async () => {
    if (!workspaceId) return
    try {
      setIsLoading(true)
      const data = await categoryService.getCategories(workspaceId)
      setCategories(data)
    } catch (err) {
      console.error(err)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (!workspaceId) return
    const supabase = createClient()

    const channel = supabase.channel(`categories-${workspaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `workspace_id=eq.${workspaceId}` },
        () => loadCategories()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subcategories', filter: `workspace_id=eq.${workspaceId}` },
        () => loadCategories()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, loadCategories])

  return {
    categories,
    isLoading,
    isError,
    refresh: loadCategories
  }
}
