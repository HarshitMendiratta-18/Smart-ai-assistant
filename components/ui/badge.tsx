import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground shadow-sm": variant === 'default',
          "border-transparent bg-secondary text-secondary-foreground": variant === 'secondary',
          "border-transparent bg-destructive text-destructive-foreground shadow-sm": variant === 'destructive',
          "border-transparent bg-emerald-500/10 text-emerald-500 border border-emerald-500/20": variant === 'success',
          "border-transparent bg-amber-500/10 text-amber-500 border border-amber-500/20": variant === 'warning',
          "text-foreground": variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}
