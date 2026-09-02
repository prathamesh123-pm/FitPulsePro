export function ViewSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse p-4 sm:p-6" id="view-skeleton-loader">
      {/* Top bar placeholder */}
      <div className="h-10 bg-slate-800/60 rounded-2xl w-1/3" />
      
      {/* Grid of skeleton cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="h-4 bg-slate-800 rounded-lg w-1/2" />
            <div className="h-8 bg-slate-800/80 rounded-lg w-3/4" />
          </div>
        ))}
      </div>

      {/* Main content placeholder */}
      <div className="h-80 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col gap-4">
        <div className="h-6 bg-slate-800 rounded-lg w-1/4" />
        <div className="h-full bg-slate-950/40 rounded-2xl border border-slate-800/40" />
      </div>
    </div>
  );
}
