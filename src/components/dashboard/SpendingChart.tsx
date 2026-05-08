'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useDashboardContext } from '@/components/providers/DashboardProvider';

interface SpendingChartProps {
  data: { date: string; value: number }[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  const { theme } = useDashboardContext();
  const isDark = theme === 'dark';

  return (
    <Card className="h-[240px]">
      <CardHeader className="py-2 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">
          Spending Over Time
        </span>
      </CardHeader>
      <CardContent className="h-[190px] p-0 pr-4 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? "#ffffff" : "#000000"} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={isDark ? "#ffffff" : "#000000"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fontWeight: 900, fill: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
              dy={10}
            />
            <YAxis 
              hide={true} 
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#141414' : '#ffffff', 
                border: 'none', 
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: '900',
                color: isDark ? '#ffffff' : '#000000',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ color: isDark ? '#ffffff' : '#000000' }}
              cursor={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isDark ? "#ffffff" : "#000000"} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
