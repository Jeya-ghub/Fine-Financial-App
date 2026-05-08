import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  fallback: string;
  className?: string;
}

export function Avatar({ src, fallback, className }: AvatarProps) {
  return (
    <div className={cn(
      "w-8 h-8 rounded-full overflow-hidden border border-black/10 dark:border-white/10 bg-zinc-100 dark:bg-white/5 flex items-center justify-center shrink-0",
      className
    )}>
      {src ? (
        <img src={src} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] font-black uppercase text-black/60 dark:text-white/60">
          {fallback.slice(0, 2)}
        </span>
      )}
    </div>
  );
}
