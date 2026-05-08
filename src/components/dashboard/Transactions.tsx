'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  name: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
}

interface TransactionsProps {
  transactions: Transaction[];
}

export function Transactions({ transactions }: TransactionsProps) {
  return (
    <Card className="h-[180px]">
      <CardHeader className="py-2 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">
          Recent Activity
        </span>
        <button className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors">
          View All
        </button>
      </CardHeader>
      <CardContent className="h-[130px] overflow-y-auto custom-scrollbar p-0">
        {transactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <span className="text-[10px] font-black uppercase tracking-widest">No activity found</span>
          </div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {transactions.map((tx) => (
              <div 
                key={tx.id}
                className="px-3 py-2 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center",
                    tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                  )}>
                    {tx.type === 'income' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-black dark:text-white truncate max-w-[120px]">
                      {tx.name}
                    </span>
                    <span className="text-[9px] font-bold text-black/30 dark:text-white/30 uppercase tracking-tighter">
                      {tx.category} • {tx.date}
                    </span>
                  </div>
                </div>
                
                <span className={cn(
                  "text-[11px] font-black tracking-tighter",
                  tx.type === 'income' ? "text-emerald-500" : "text-black dark:text-white"
                )}>
                  {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
