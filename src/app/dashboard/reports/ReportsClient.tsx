'use client'

import { useState, useMemo, useRef } from 'react'
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { 
  FileText, Download, Printer, Filter, ChevronLeft, 
  ArrowUpRight, ArrowDownRight, LayoutDashboard, Table as TableIcon,
  Search, X, Calendar, Share2, Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ── Types ────────────────────────────────────────────────────────────────────
type Transaction = {
  id: string
  date: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category_id: string
  categories: { name: string; type: string }
}

type AggregatedItem = {
  id: string
  name: string
  amount: number
  type: string
  txCount: number
}

// ── Constants ────────────────────────────────────────────────────────────────
const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#a855f7', '#14b8a6'
]

// ── Components ───────────────────────────────────────────────────────────────

const GlassTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[#141414]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{data.type}</p>
        <p className="text-sm font-bold text-white mb-2">{data.name}</p>
        <div className="h-px bg-white/5 mb-2" />
        <p className="text-xl font-black text-emerald-500 tracking-tighter">
          ₹{data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-[9px] text-zinc-500 mt-1">{data.txCount} Transactions</p>
      </div>
    )
  }
  return null
}

export default function ReportsClient({ 
  initialData, 
  workspaceId,
  userEmail
}: { 
  initialData: any
  workspaceId: string
  userEmail: string
}) {
  const [data, setData] = useState(initialData)
  const [view, setView] = useState<'visual' | 'table'>('visual')
  const [drillDownCat, setDrillDownCat] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const activeData = useMemo(() => {
    if (!drillDownCat) return data.aggregatedData.filter((d: any) => d.type === 'expense')
    
    // In a real app, we'd fetch subcategory aggregation here.
    // For this prototype, we'll simulate by finding transactions for this category
    const txs = data.transactions.filter((t: any) => t.categories.name === drillDownCat)
    const subMap: Record<string, any> = {}
    txs.forEach((t: any) => {
      const name = "General" // Fallback since we just added subcategories
      if (!subMap[name]) subMap[name] = { name, amount: 0, type: 'subcategory', txCount: 0 }
      subMap[name].amount += Number(t.amount)
      subMap[name].txCount += 1
    })
    return Object.values(subMap)
  }, [data, drillDownCat])

  const totalExpense = useMemo(() => 
    data.aggregatedData.filter((d: any) => d.type === 'expense').reduce((acc: number, d: any) => acc + d.amount, 0)
  , [data])

  // ── Export Logic ────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF() as any
    const timestamp = new Date().toLocaleString('en-IN')
    
    // Header
    doc.setFontSize(22)
    doc.setTextColor(0, 0, 0)
    doc.text('FINE FINANCE REPORT', 105, 20, { align: 'center' })
    
    doc.setFontSize(10)
    doc.text(`User: ${userEmail}`, 20, 35)
    doc.text(`Timestamp: ${timestamp}`, 20, 40)
    doc.line(20, 45, 190, 45)

    // Summary Table
    doc.autoTable({
      startY: 55,
      head: [['Category', 'Type', 'Count', 'Amount (INR)']],
      body: data.aggregatedData.map((d: any) => [
        d.name, 
        d.type.toUpperCase(), 
        d.txCount, 
        `₹${d.amount.toLocaleString('en-IN')}`
      ]),
      theme: 'grid',
      headStyles: { fillStyle: '#10b981' }
    })

    // Ledger
    doc.addPage()
    doc.text('TRANSACTION LEDGER', 105, 20, { align: 'center' })
    doc.autoTable({
      startY: 30,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: data.transactions.map((t: any) => [
        new Date(t.date).toLocaleDateString('en-GB'),
        t.description || '—',
        t.categories?.name || '—',
        `₹${Number(t.amount).toLocaleString('en-IN')}`
      ]),
      styles: { fontSize: 8 }
    })

    doc.save(`FineFinance_Report_${new Date().getTime()}.pdf`)
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.transactions.map((t: any) => ({
      Date: t.date,
      Category: t.categories?.name,
      Type: t.type,
      Amount: t.amount,
      Notes: t.description
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Transactions")
    XLSX.writeFile(wb, `FineFinance_Export_${new Date().getTime()}.xlsx`)
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* ── Top Action Bar ── */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
            <FileText className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-tight">Financial Intelligence</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Interactive Audit & Export</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportExcel} className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Excel</span>
          </button>
          <button onClick={exportPDF} className="h-10 px-5 bg-white text-black font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-zinc-200 transition-all flex items-center gap-2">
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Generate PDF</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        {/* ── Visual Intelligence Layer ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Chart Card */}
          <div className="lg:col-span-7 bg-[#141414] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-premium">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  {drillDownCat && <button onClick={() => setDrillDownCat(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-emerald-500" /></button>}
                  {drillDownCat ? `${drillDownCat} Breakdown` : 'Expense Distribution'}
                </h3>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
                  {drillDownCat ? 'Subcategory Analysis' : 'Category High-to-Low'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Total Outflow</p>
                <p className="text-2xl font-black text-white tracking-tighter">₹{totalExpense.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={110}
                    outerRadius={150}
                    paddingAngle={8}
                    dataKey="amount"
                    stroke="none"
                    onClick={(entry) => !drillDownCat && setDrillDownCat(entry.name ?? null)}
                    className="cursor-pointer outline-none"
                  >
                    {activeData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Centered Summary */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-4">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Impact</p>
                <p className="text-3xl font-black text-white tracking-tighter">{activeData.length}</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Slices</p>
              </div>
            </div>
          </div>

          {/* Sorted Summary Table */}
          <div className="lg:col-span-5 bg-[#141414] border border-white/5 rounded-3xl p-6 shadow-premium">
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-6">Efficiency Rankings</h3>
            <div className="space-y-3">
              {activeData.map((d: any, i: number) => (
                <div 
                  key={d.name}
                  className={cn(
                    "p-3.5 rounded-2xl border border-white/5 flex items-center justify-between group transition-all",
                    i === 0 ? "bg-blue-500/5 border-blue-500/10" : "bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 text-[9px] font-black text-zinc-500">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{d.name}</p>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">{((d.amount / totalExpense) * 100).toFixed(1)}% Weight</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white tracking-tight">₹{d.amount.toLocaleString('en-IN')}</p>
                    <div className="w-16 h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.amount / activeData[0].amount) * 100}%` }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Transaction Ledger Section ── */}
        <div className="bg-[#141414] border border-white/5 rounded-3xl overflow-hidden shadow-premium">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Audit Ledger</h3>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Chronological Sequence</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                <Info className="w-3 h-3" />
                Row highlight indicates peak values
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-3 text-[9px] font-black text-zinc-600 uppercase tracking-widest">S.No</th>
                  <th className="px-5 py-3 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Date</th>
                  <th className="px-5 py-3 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Category</th>
                  <th className="px-5 py-3 text-[9px] font-black text-zinc-600 uppercase tracking-widest">Notes</th>
                  <th className="px-6 py-3 text-[9px] font-black text-zinc-600 uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {data.transactions.slice(0, 15).map((t: any, i: number) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-2.5 text-[10px] font-black text-zinc-600">{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-5 py-2.5 text-[11px] font-bold text-zinc-400">{new Date(t.date).toLocaleDateString('en-GB')}</td>
                    <td className="px-5 py-2.5">
                      <span className="text-[9px] font-black text-white px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                        {t.categories?.name}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-[11px] text-zinc-500 max-w-[300px] truncate">{t.description || '—'}</td>
                    <td className="px-6 py-2.5 text-right">
                      <span className={cn(
                        "text-sm font-black tracking-tight",
                        t.type === 'income' ? 'text-emerald-500' : 'text-white'
                      )}>
                        {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-8 py-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
            <p className="text-[9px] text-zinc-700 font-black uppercase tracking-widest">End of visible sequence</p>
            <p className="text-[9px] text-zinc-700 font-black uppercase tracking-widest flex items-center gap-2">
              <Share2 className="w-3 h-3" /> Digital Sign: {workspaceId.slice(0,8).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* ── Export Overlay ── */}
      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-8 text-center"
          >
            <div className="max-w-md space-y-6">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Preparing High-Fidelity PDF</h2>
              <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest leading-relaxed">
                Applying visual precision margins and synchronizing workspace labels for A4 standard.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
