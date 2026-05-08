'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useDashboardContext } from '@/components/providers/DashboardProvider';

interface CategoryChartProps {
  categories: { id: string; name: string; amount: number; percentage: number; color: string }[];
}

export function CategoryChart({ categories }: CategoryChartProps) {
  const { theme, setSelectedCategory } = useDashboardContext();
  const isDark = theme === 'dark';

  return (
    <Card className="h-[240px]">
      <CardHeader className="py-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">
          Categories
        </span>
      </CardHeader>
      <CardContent className="h-[190px] p-2 flex items-center">
        <div className="w-1/2 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="amount"
                stroke="none"
                onClick={(data: any) => setSelectedCategory(data.payload.id)}
                cursor="pointer"
              >
                {categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#141414' : '#ffffff', 
                  border: 'none', 
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: '900',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-1/2 h-full overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
          {categories.slice(0, 5).map((cat, i) => (
            <button 
              key={i}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex items-center justify-between group text-left"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-[9px] font-black uppercase tracking-tight text-black/60 dark:text-white/60 group-hover:text-black dark:group-hover:text-white transition-colors truncate max-w-[60px]">
                  {cat.name}
                </span>
              </div>
              <span className="text-[9px] font-black text-black/40 dark:text-white/40">
                {cat.percentage}%
              </span>
            </button>
          ))}
          {categories.length > 5 && (
            <span className="text-[8px] font-black uppercase text-black/20 dark:text-white/20 text-center mt-1">
              + {categories.length - 5} more
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
