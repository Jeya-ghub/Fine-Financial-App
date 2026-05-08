'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, SlidersHorizontal, Loader2 } from 'lucide-react'
import { useDashboardContext } from '@/components/providers/DashboardProvider'
import { useRealtimeCategories } from '@/hooks/useRealtimeCategories'
import { categoryService } from '@/services/category.service'
import { CategoryGrid } from '@/components/categories/CategoryGrid'
import { SearchBar } from '@/components/categories/SearchBar'
import { CategoryDrawer } from '@/components/categories/CategoryDrawers'
import { DeleteConfirmModal } from '@/components/categories/DeleteConfirmModal'
import { Category } from '@/types/category.types'
import { Button } from '@/components/ui/Button'

export default function CategoriesPage() {
  const { workspaceId } = useDashboardContext()
  const { categories, isLoading, isError, refresh } = useRealtimeCategories(workspaceId)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return categories

    return categories.filter(cat => 
      cat.name.toLowerCase().includes(query) ||
      cat.subcategories?.some(sub => sub.name.toLowerCase().includes(query))
    )
  }, [categories, searchQuery])

  const handleCreate = () => {
    setSelectedCategory(null)
    setIsDrawerOpen(true)
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setIsDrawerOpen(true)
  }

  const handleDelete = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteModalOpen(true)
  }

  const onSave = async (formData: any) => {
    try {
      setIsActionLoading(true)
      if (selectedCategory) {
        // Map subcategories from string array to object array for the service
        const subData = formData.subcategories.map((name: string) => ({ name }))
        await categoryService.updateCategory(selectedCategory.id, { ...formData, subcategories: subData }, workspaceId)
      } else {
        await categoryService.createCategory({ ...formData, workspace_id: workspaceId })
      }
      setIsDrawerOpen(false)
      // Real-time will handle the update, but refresh for extra safety
      refresh()
    } catch (error) {
      console.error('Failed to save category:', error)
      alert('Failed to save category. Please try again.')
    } finally {
      setIsActionLoading(false)
    }
  }

  const onConfirmDelete = async () => {
    if (!selectedCategory) return
    try {
      setIsActionLoading(true)
      await categoryService.deleteCategory(selectedCategory.id)
      setIsDeleteModalOpen(false)
      refresh()
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category. It might be in use by transactions.')
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isLoading && categories.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Initialising category system...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Categories</h1>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">
            Manage your classification system
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <Button 
            onClick={handleCreate}
            className="h-11 px-6 text-[10px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      <CategoryGrid 
        categories={filteredCategories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modals & Drawers */}
      <CategoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={onSave}
        initialData={selectedCategory}
        isLoading={isActionLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onConfirmDelete}
        category={selectedCategory}
        isLoading={isActionLoading}
      />
    </div>
  )
}
