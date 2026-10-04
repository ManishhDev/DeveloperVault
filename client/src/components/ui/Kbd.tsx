import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'rounded border border-zinc-300 bg-zinc-100 px-1 py-px font-mono text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
