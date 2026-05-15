'use client'

import { motion } from 'framer-motion'
import { useDashboardData } from '@/hooks/useDashboardData'
import { HeroSection } from './components/HeroSection'
import { SummaryCard } from './components/SummaryCards'
import { CategoryList } from './components/CategoryList'
import { RecentTransactions } from './components/RecentTransactions'
import { Skeleton } from '@/components/ui/Skeleton'
import { DashboardData } from '@/types/dashboard.types'
import dynamic from 'next/dynamic'

const SpendingChart = dynamic(() => import('./components/SpendingChart').then(mod => mod.SpendingChart), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full animate-pulse bg-surface-hover rounded-3xl" />
})

function DashboardSkeleton() {
  return (
    <div className="space-y-4 pb-12">
      <div className="space-y-1">
        <Skeleton className="h-6 w-48 bg-surface" />
        <Skeleton className="h-3 w-72 bg-surface" />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Skeleton className="col-span-12 md:col-span-6 lg:col-span-4 h-[160px] bg-surface" />
        <Skeleton className="col-span-12 md:col-span-6 lg:col-span-4 h-[160px] bg-surface" />
        <Skeleton className="col-span-12 md:col-span-6 lg:col-span-4 h-[160px] bg-surface" />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Skeleton className="col-span-12 lg:col-span-8 h-[340px] bg-surface" />
        <Skeleton className="col-span-12 lg:col-span-4 h-[340px] bg-surface" />
      </div>
    </div>
  )
}

export function DashboardClient({ initialData }: { initialData: DashboardData | null }) {
  const { data, isLoading, isError } = useDashboardData(initialData)

  if (isLoading && !data) return <DashboardSkeleton />

  if (isError) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-20">
        <h2 className="text-xl font-black mb-2 uppercase tracking-tight text-primary">Something went wrong</h2>
        <p className="text-muted text-[10px] font-bold uppercase tracking-widest mb-6">
          We couldn&apos;t load your dashboard data.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-background text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 pb-12"
    >
      {/* HERO SECTION */}
      <HeroSection 
        name="Jeya" 
        savingAmount={data.net.toLocaleString()} 
        trend={data.trend} 
      />

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <SummaryCard 
            title="Net Position" 
            value={data.net.toLocaleString()} 
            trend={data.trend} 
            type="net" 
          />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <SummaryCard 
            title="Total Income" 
            value={data.income.toLocaleString()} 
            trend={12} 
            type="income" 
          />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <SummaryCard 
            title="Total Expense" 
            value={data.expense.toLocaleString()} 
            trend={-8} 
            type="expense" 
          />
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <SpendingChart data={data.chartData} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <CategoryList categories={data.categories} />
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <RecentTransactions transactions={data.transactions} />
        </div>
      </div>
    </motion.div>
  )
}
