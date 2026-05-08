'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Sparkles, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface Insight {
  id: string;
  type: 'warning' | 'positive' | 'info';
  text: string;
  subtext: string;
}

interface InsightsProps {
  insights: Insight[];
}

export function Insights({ insights }: InsightsProps) {
  const icons = {
    warning: <AlertCircle className="w-3 h-3 text-amber-500" />,
    positive: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
    info: <Info className="w-3 h-3 text-blue-500" />,
  };

  return (
    <Card className="h-[180px]">
      <CardHeader className="py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-purple-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">
            Insights
          </span>
        </div>
      </CardHeader>
      <CardContent className="h-[130px] overflow-y-auto custom-scrollbar flex flex-col gap-2 p-3">
        {insights.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <Sparkles className="w-6 h-6 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">No insights yet</span>
          </div>
        ) : (
          insights.map((insight) => (
            <div 
              key={insight.id}
              className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex gap-2"
            >
              <div className="mt-0.5">{icons[insight.type]}</div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black leading-tight text-black dark:text-white">
                  {insight.text}
                </span>
                <span className="text-[9px] font-bold text-black/40 dark:text-white/40 leading-tight mt-0.5">
                  {insight.subtext}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
