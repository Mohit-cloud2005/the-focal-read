export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full animate-pulse"
        >
          {/* Image Placeholder */}
          <div className="bg-slate-200 dark:bg-slate-800 h-48 w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>

          {/* Content Block */}
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Category & Source Tag */}
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/5" />
              </div>

              {/* Title Lines */}
              <div className="space-y-2">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
              </div>

              {/* Description */}
              <div className="space-y-2 pt-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-50 dark:border-slate-800/50">
              <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg flex-1" />
              <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
