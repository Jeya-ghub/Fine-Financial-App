'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SummaryCardProps {
  title: string;
  value: number;
  trend?: number;
  type: 'net' | 'income' | 'expense';
  height: string;
}

export function SummaryCard({ title, value, trend = 0, type, height }: SummaryCardProps) {
  const isPositive = trend >= 0;
  
  const icons = {
    net: <Wallet className="w-4 h-4 text-blue-500" />,
    income: <ArrowUpCircle className="w-4 h-4 text-emerald-500" />,
    expense: <ArrowDownCircle className="w-4 h-4 text-rose-500" />,
  };

  return (
    <Card className={height}>
      <CardContent className="h-full flex flex-col justify-between p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">
            {title}
          </span>
          <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
            {icons[type]}
          </div>
        </div>

        <div className="mt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tighter">
              ₹{value.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant={isPositive ? (type === 'expense' ? 'danger' : 'success') : (type === 'expense' ? 'success' : 'danger')}>
              {isPositive ? '+' : ''}{trend}%
            </Badge>
            <span className="text-[9px] font-bold text-black/30 dark:text-white/30 uppercase tracking-wider">
              vs last month
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
