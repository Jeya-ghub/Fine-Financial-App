'use client'

import { useState } from 'react'
import { Download, FileText, Table as TableIcon, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

type ExportActionsProps = {
  transactions: any[]
  monthLabel: string
}

export default function ExportActions({ transactions, monthLabel }: ExportActionsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportPDF = () => {
    setIsExporting(true)
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(22)
    doc.text('Financial Ledger Report', 14, 22)
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`Period: ${monthLabel}`, 14, 30)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 37)

    // Table
    const tableData = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description || 'No Description',
      t.categories?.name || 'Uncategorized',
      t.type.toUpperCase(),
      `$${Number(t.amount).toLocaleString()}`
    ])

    ;(doc as any).autoTable({
      startY: 45,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    })

    doc.save(`Fine-Finance-Report-${monthLabel.replace(' ', '-')}.pdf`)
    setIsExporting(false)
  }

  const exportExcel = () => {
    setIsExporting(true)
    const data = transactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString(),
      Description: t.description,
      Category: t.categories?.name,
      Type: t.type,
      Amount: Number(t.amount)
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
    XLSX.writeFile(wb, `Fine-Finance-Ledger-${monthLabel.replace(' ', '-')}.xlsx`)
    setIsExporting(false)
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={exportPDF}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-sm font-bold hover:bg-emerald-500/20 transition-all"
      >
        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        PDF Export
      </button>
      <button
        onClick={exportExcel}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-500 text-sm font-bold hover:bg-blue-500/20 transition-all"
      >
        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TableIcon className="w-4 h-4" />}
        Excel/CSV
      </button>
    </div>
  )
}
