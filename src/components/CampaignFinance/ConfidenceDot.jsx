/**
 * ConfidenceDot — colored dot with hover tooltip indicating data confidence level.
 *
 * Props:
 *   level     — "HIGH" | "MEDIUM" | "ESTIMATED"
 *   className — optional additional Tailwind classes
 */

const CONFIDENCE_CONFIG = {
  HIGH: {
    color: 'bg-green-500',
    label: 'High confidence',
    tooltip: 'High Confidence — Verified FEC Filing',
  },
  MEDIUM: {
    color: 'bg-yellow-400',
    label: 'Medium confidence',
    tooltip: 'Medium Confidence — Partial match',
  },
  ESTIMATED: {
    color: 'bg-orange-500',
    label: 'Estimated confidence',
    tooltip: 'Estimated — Some contributions could not be fully verified',
  },
};

export default function ConfidenceDot({ level, className = '' }) {
  const config = CONFIDENCE_CONFIG[level] || CONFIDENCE_CONFIG.ESTIMATED;

  return (
    <span className={`relative inline-flex items-center group ${className}`}>
      <span
        role="img"
        aria-label={config.label}
        className={`inline-block w-2.5 h-2.5 rounded-full ${config.color} flex-shrink-0`}
      />
      <span
        role="tooltip"
        className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10
          whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none
          after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2
          after:border-4 after:border-transparent after:border-t-gray-800"
      >
        {config.tooltip}
      </span>
    </span>
  );
}
