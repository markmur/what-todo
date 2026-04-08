import type { CSSProperties } from "react"

function SkeletonPulse({
  className = "",
  style
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={`rounded-md bg-slate-200 dark:bg-navy-700 animate-pulse ${className}`}
      style={style}
    />
  )
}

function SkeletonTask({ index }: { index: number }) {
  // Vary widths to look natural
  const titleWidths = ["60%", "75%", "45%", "80%", "55%"]
  const hasDescription = index % 3 === 0
  const hasLabel = index % 2 === 0
  const delay = `${index * 75}ms`

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Checkbox skeleton */}
      <SkeletonPulse
        className="shrink-0 mt-0.5"
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          animationDelay: delay
        }}
      />

      {/* Content skeleton */}
      <div className="flex-1 flex flex-col gap-1.5">
        {/* Title */}
        <SkeletonPulse
          style={{
            width: titleWidths[index % titleWidths.length],
            height: 16,
            animationDelay: delay
          }}
        />

        {/* Description (some tasks) */}
        {hasDescription && (
          <SkeletonPulse
            style={{ width: "40%", height: 12, animationDelay: delay }}
          />
        )}

        {/* Label (some tasks) */}
        {hasLabel && (
          <SkeletonPulse
            className="mt-0.5"
            style={{
              width: 56,
              height: 20,
              borderRadius: 9999,
              animationDelay: delay
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function LoadingSkeleton() {
  return (
    <div
      className="px-6 pt-6"
      role="status"
      aria-label="Loading tasks"
      data-testid="loading-skeleton"
    >
      {/* Search bar skeleton */}
      <SkeletonPulse className="mb-4" style={{ width: "100%", height: 40 }} />

      {/* Task skeletons */}
      <div className="divide-y divide-slate-100 dark:divide-navy-800">
        {Array.from({ length: 5 }, (_, i) => (
          <SkeletonTask key={i} index={i} />
        ))}
      </div>

      {/* Screen reader text */}
      <span className="sr-only">Loading tasks…</span>
    </div>
  )
}
