/**
 * SkeletonCard — Animated shimmer placeholder matching TaskCard layout.
 * Used during API loading states across the Kanban board and list views.
 */
export default function SkeletonCard({ variant = 'card' }) {
  if (variant === 'list') {
    // Horizontal list row skeleton (for MyTasks page)
    return (
      <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
        <div className="flex items-start space-x-3.5">
          <div className="h-9 w-9 rounded-xl skeleton-shimmer bg-slate-800/60" />
          <div className="space-y-2.5 flex-1">
            <div className="h-4 w-52 rounded-lg skeleton-shimmer bg-slate-800/60" />
            <div className="flex items-center space-x-3">
              <div className="h-3 w-16 rounded skeleton-shimmer bg-slate-800/60" />
              <div className="h-3 w-20 rounded skeleton-shimmer bg-slate-800/60" />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 self-end md:self-center">
          <div className="h-5 w-20 rounded-full skeleton-shimmer bg-slate-800/60" />
          <div className="h-8 w-8 rounded-lg skeleton-shimmer bg-slate-800/60" />
        </div>
      </div>
    );
  }

  if (variant === 'project') {
    // Project card skeleton (for Projects page)
    return (
      <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col justify-between h-[190px] animate-pulse">
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 rounded-xl skeleton-shimmer bg-slate-800/60" />
          <div className="h-5 w-16 rounded-full skeleton-shimmer bg-slate-800/60" />
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-4 w-3/4 rounded-lg skeleton-shimmer bg-slate-800/60" />
          <div className="space-y-1.5 mt-4">
            <div className="flex justify-between">
              <div className="h-3 w-14 rounded skeleton-shimmer bg-slate-800/60" />
              <div className="h-3 w-8 rounded skeleton-shimmer bg-slate-800/60" />
            </div>
            <div className="w-full h-2 rounded-full skeleton-shimmer bg-slate-800/60" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-900">
          <div className="h-3 w-24 rounded skeleton-shimmer bg-slate-800/60" />
        </div>
      </div>
    );
  }

  // Default: Kanban task card skeleton
  return (
    <div className="p-4 rounded-xl bg-slate-900/65 border border-slate-800/60 flex flex-col gap-3 animate-pulse">
      {/* Priority badge + drag handle */}
      <div className="flex items-start justify-between">
        <div className="h-4 w-14 rounded skeleton-shimmer bg-slate-800/60" />
        <div className="h-4 w-4 rounded skeleton-shimmer bg-slate-800/60" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded-lg skeleton-shimmer bg-slate-800/60" />
        <div className="h-4 w-2/3 rounded-lg skeleton-shimmer bg-slate-800/60" />
      </div>

      {/* Description */}
      <div className="h-3 w-5/6 rounded skeleton-shimmer bg-slate-800/60" />

      {/* Footer: due date + avatars */}
      <div className="flex items-center justify-between border-t border-slate-800/50 pt-3 mt-1">
        <div className="h-4 w-20 rounded skeleton-shimmer bg-slate-800/60" />
        <div className="flex -space-x-1.5">
          <div className="h-6 w-6 rounded-full skeleton-shimmer bg-slate-800/60" />
          <div className="h-6 w-6 rounded-full skeleton-shimmer bg-slate-800/60" />
        </div>
      </div>
    </div>
  );
}
