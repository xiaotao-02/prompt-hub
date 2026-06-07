export function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="加载设置">
      <div className="card !p-0 overflow-hidden flex flex-col lg:flex-row">
        <div className="hidden lg:block w-52 shrink-0 border-r border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 rounded-md bg-zinc-100 dark:bg-zinc-800/80" />
          ))}
        </div>
        <div className="flex-1 p-5 sm:p-6 space-y-4">
          <div className="h-5 w-32 rounded bg-zinc-100 dark:bg-zinc-800/80" />
          <div className="h-24 rounded-lg bg-zinc-100 dark:bg-zinc-800/80" />
          <div className="h-5 w-40 rounded bg-zinc-100 dark:bg-zinc-800/80" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800/80" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
