import { Skeleton } from '@/components/ui/skeleton';

export default function HistoryLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border border-border overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-border bg-card/50 px-4 py-3">
          {['Date', 'Chain', 'Status', 'Steps', 'Actions'].map((col) => (
            <Skeleton key={col} className="h-4 w-20" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-8 w-24 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
