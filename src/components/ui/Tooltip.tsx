'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className={cn(
              "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold rounded shadow-xl whitespace-nowrap z-[500]",
              className
            )}
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black dark:border-t-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
