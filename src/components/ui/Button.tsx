import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

import { Loader2 } from 'lucide-react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  isLoading,
  disabled,
  ...props 
}: ButtonProps) {
  const variants = {
    primary: "bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200",
    secondary: "bg-zinc-100 dark:bg-white/10 text-black dark:text-white hover:bg-zinc-200 dark:hover:bg-white/20",
    outline: "bg-transparent border border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5",
    ghost: "bg-transparent text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5",
  };

  const sizes = {
    sm: "h-8 px-3 text-[10px] uppercase tracking-widest font-black",
    md: "h-10 px-4 text-xs font-bold",
    lg: "h-12 px-6 text-sm font-bold",
    icon: "h-8 w-8 flex items-center justify-center p-0",
  };

  return (
    <motion.button
      whileTap={!isLoading && !disabled ? { scale: 0.98 } : undefined}
      disabled={isLoading || disabled}
      className={cn(
        "rounded-lg transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
}
