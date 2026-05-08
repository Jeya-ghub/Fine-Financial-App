import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  animateHover?: boolean;
}

export function Card({ children, className, animateHover = true, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={animateHover ? { translateY: -2 } : undefined}
      className={cn(
        "bg-white/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl overflow-hidden backdrop-blur-md transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-3 border-b border-black/5 dark:border-white/5", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-3", className)}>
      {children}
    </div>
  );
}
