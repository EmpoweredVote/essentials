import ConfidenceDot from './ConfidenceDot';

/**
 * SummaryCard — collapsed campaign finance summary with cycle selector.
 *
 * Props:
 *   summary        — summary object from API (may be null)
 *   cycle          — current cycle string (e.g., "2024")
 *   onCycleChange  — called with new cycle value when selector changes
 *   onExpand       — called when user clicks to expand
 *   expanded       — boolean, controls chevron rotation
 *   dataUpdatedAt  — ISO string from X-Data-Updated-At header
 *   loading        — boolean
 */

function formatCycleLabel(cycle) {
  // cycle is like "2024" — show as "2023–2024"
  const year = parseInt(cycle, 10);
  if (isNaN(year)) return cycle;
  return `${year - 1}–${year}`;
}

function formatUpdatedDate(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SummaryCard({
  summary,
  cycle,
  onCycleChange,
  dataUpdatedAt,
  loading,
}) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="p-5 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="h-7 bg-gray-200 rounded w-28" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-48 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-56" />
      </div>
    );
  }

  // No data state
  const hasNoData =
    !summary || (summary.total_raised === 0 && (!summary.available_cycles || summary.available_cycles.length === 0));

  if (hasNoData) {
    return (
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-semibold text-gray-800" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Campaign Finance
          </h3>
        </div>
        <p className="text-gray-500 text-sm">
          Campaign finance data not yet available for this politician.
        </p>
      </div>
    );
  }

  const updatedLabel = formatUpdatedDate(dataUpdatedAt);
  const availableCycles = summary.available_cycles || [];

  return (
    <div className="p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-base font-semibold text-gray-800"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Campaign Finance
        </h3>

        <div className="flex items-center gap-3">
          {availableCycles.length > 1 ? (
            <select
              value={cycle || ''}
              onChange={(e) => onCycleChange(e.target.value)}
              className="text-sm border border-gray-200 rounded-md px-2 py-1 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableCycles.map((c) => (
                <option key={c} value={c}>
                  {formatCycleLabel(c)}
                </option>
              ))}
            </select>
          ) : availableCycles.length === 1 ? (
            <span className="text-sm text-gray-500">{formatCycleLabel(availableCycles[0])}</span>
          ) : null}
        </div>
      </div>

      {/* Body: total raised */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Manrope', sans-serif" }}>
          {formatCurrency(summary.total_raised || 0)}
        </span>
        <ConfidenceDot level={summary.confidence_level || 'HIGH'} />
        <span className="text-sm text-gray-500 ml-1">total raised</span>
      </div>

      {/* Footer: source + freshness */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>Data from FEC</span>
        {updatedLabel && (
          <>
            <span>·</span>
            <span>Updated {updatedLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}
