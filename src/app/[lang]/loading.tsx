export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Countdown skeleton */}
      <div className="bg-[var(--foreground)] border-b-4 border-[var(--border)] py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <div className="h-6 w-32 bg-[var(--background)] opacity-20 animate-pulse" />
          <div className="flex gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-10 w-14 bg-[var(--background)] opacity-20 animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* CTA skeleton */}
          <div className="border-3 border-[var(--border)] bg-[var(--primary)] shadow-[var(--shadow-brutal-lg)] p-6 sm:p-8">
            <div className="h-10 w-3/4 bg-white/20 animate-pulse mb-4" />
            <div className="h-4 w-1/2 bg-white/20 animate-pulse mb-6" />
            <div className="flex gap-3">
              <div className="h-12 w-32 bg-white/30 animate-pulse border-3 border-[var(--border)]" />
              <div className="h-12 w-32 bg-white/10 animate-pulse border-3 border-[var(--border)]" />
            </div>
          </div>
          {/* Top 3 skeleton */}
          <div className="border-3 border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-brutal-lg)] p-4">
            <div className="h-6 w-48 bg-[var(--muted)] animate-pulse mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[1,2,3].map(i => (
                <div key={i} className="border-3 border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="aspect-square bg-[var(--muted)] animate-pulse mb-2" />
                  <div className="h-4 w-full bg-[var(--muted)] animate-pulse mb-1" />
                  <div className="h-3 w-2/3 bg-[var(--muted)] animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sections skeleton */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6">
        {[1,2,3].map(i => (
          <div key={i} className="border-3 border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-brutal-lg)] mb-6">
            <div className="p-4 border-b-3 border-[var(--border)] bg-[var(--muted)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--muted)] animate-pulse border-2 border-[var(--border)]" />
                <div className="h-6 w-48 bg-[var(--muted)] animate-pulse" />
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[1,2,3,4,5,6].map(j => (
                  <div key={j} className="border-3 border-[var(--border)] p-3">
                    <div className="h-4 w-full bg-[var(--muted)] animate-pulse mb-2" />
                    <div className="h-3 w-2/3 bg-[var(--muted)] animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
