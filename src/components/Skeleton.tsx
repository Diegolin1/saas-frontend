/**
 * Skeleton — Animated placeholder for loading states.
 * Premium pulsating rectangles instead of generic spinners.
 */
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} style={style} />
    )
}

/** Full-width skeleton row for tables */
export function SkeletonRow({ cols = 5 }: { cols?: number }) {
    return (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-3 py-4">
                    <Skeleton className={`h-4 ${i === 0 ? 'w-20' : i === cols - 1 ? 'w-16' : 'w-full max-w-[120px]'}`} />
                </td>
            ))}
        </tr>
    )
}

/** Skeleton for KPI cards */
export function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1">
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-6 w-28" />
                </div>
            </div>
        </div>
    )
}

/** Skeleton for chart area */
export function SkeletonChart() {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <div className="flex items-end gap-1.5 h-40">
                {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="flex-1">
                        <Skeleton className="w-full rounded-t" style={{ height: `${20 + Math.random() * 60}%` }} />
                    </div>
                ))}
            </div>
        </div>
    )
}

/** Skeleton for a full page (card + table) */
export function SkeletonPage() {
    return (
        <div className="animate-fade-in px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
            <div className="mt-8">
                <div className="overflow-hidden shadow-sm ring-1 ring-slate-200 sm:rounded-xl">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-slate-50">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <th key={i} className="px-3 py-3.5">
                                        <Skeleton className="h-3 w-16" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <SkeletonRow key={i} cols={5} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
