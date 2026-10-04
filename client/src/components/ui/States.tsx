import type { ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
        {icon}
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      {children && <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900/60 dark:bg-red-950/30"
    >
      <AlertTriangle className="mb-3 size-6 text-red-600 dark:text-red-400" aria-hidden />
      <h2 className="font-semibold text-red-900 dark:text-red-200">Something went wrong</h2>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error.message}</p>
      {onRetry && (
        <Button className="mt-4" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden /> Try again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800', className)} />;
}
