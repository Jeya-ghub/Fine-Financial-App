'use client'

import React from 'react'
import { useDashboardContext } from '@/components/providers/DashboardProvider'
import ReportsClient from './ReportsClient'

export default function ReportsPage() {
  const { workspaceId } = useDashboardContext()
  
  return <ReportsClient workspaceId={workspaceId} />
}
