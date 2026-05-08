'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp } from 'lucide-react';

interface HeroProps {
  name: string;
  savingAmount: string;
  trend: number;
}

export function Hero({ name, savingAmount, trend }: HeroProps) {
  return (
    <div className="col-span-12 flex flex-col justify-center py-2">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-black tracking-tight text-black/90 dark:text-white/90">
          Good evening, {name}
        </h1>
        <Badge variant="success" className="h-4">
          <TrendingUp className="w-2.5 h-2.5 mr-1" />
          {trend}% up
        </Badge>
      </div>
      <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mt-0.5">
        Your portfolio is performing well this month. You've saved ₹{savingAmount} so far.
      </p>
    </div>
  );
}
