import { Skeleton } from '@/components/ui/skeleton';

export default function BuilderLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Toolbar skeleton */}
      <div className="flex h-12 items-center gap-3 border-b border-border bg-card px-4">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-5 w-48" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel skeleton */}
        <aside className="hidden border-r border-border bg-card p-3 md:flex md:w-[280px] md:shrink-0 md:flex-col gap-2">
          <Skeleton className="h-4 w-16 mb-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </aside>

        {/* Right panel skeleton */}
        <main className="flex-1 p-6 space-y-6">
          <div className="max-w-2xl space-y-6">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
