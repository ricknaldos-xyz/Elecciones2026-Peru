export default function RankingLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="animate-pulse">
        {/* Title skeleton */}
        <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
        {/* Filters skeleton */}
        <div className="flex gap-3 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded w-32" />
          ))}
        </div>
        {/* Table skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
