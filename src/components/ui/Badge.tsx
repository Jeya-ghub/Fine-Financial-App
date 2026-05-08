import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const variants = {
    success: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
    danger: "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20",
    warning: "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
    info: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20",
    neutral: "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border-black/10 dark:border-white/10",
  };

  return (
    <span className={cn(
      "px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border inline-flex items-center justify-center",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
