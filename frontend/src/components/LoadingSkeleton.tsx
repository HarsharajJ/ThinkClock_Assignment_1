export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded ${className}`}
    />
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-4">
        <LoadingSkeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-4">
        <LoadingSkeleton className="h-10 w-10 rounded-lg" />
      </td>
      <td className="px-4 py-4">
        <LoadingSkeleton className="h-5 w-16 rounded-full" />
      </td>
      <td className="px-4 py-4">
        <LoadingSkeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-4 text-right">
        <LoadingSkeleton className="h-8 w-20 ml-auto rounded-lg" />
      </td>
    </tr>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <LoadingSkeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <LoadingSkeleton className="h-3 w-20" />
          <LoadingSkeleton className="h-6 w-32" />
        </div>
      </div>
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-32" />
        <LoadingSkeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <LoadingSkeleton className="h-6 w-6 rounded-lg" />
        <LoadingSkeleton className="h-4 w-32" />
      </div>
      <LoadingSkeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LoadingSkeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-1.5">
              <LoadingSkeleton className="h-5 w-28" />
              <LoadingSkeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LoadingSkeleton className="h-7 w-32 rounded-full" />
            <LoadingSkeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <StatCardsSkeleton />
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex gap-4 mb-6">
            <LoadingSkeleton className="h-10 w-32 rounded-lg" />
            <LoadingSkeleton className="h-10 w-32 rounded-lg" />
            <LoadingSkeleton className="h-10 w-32 rounded-lg" />
          </div>
          <div className="space-y-4">
            <TableSkeleton rows={5} />
          </div>
        </div>
      </div>
    </div>
  );
}
