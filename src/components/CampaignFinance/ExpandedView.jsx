import { useEffect, useState } from 'react';
import ConfidenceDot from './ConfidenceDot';
import IndustryChart from './IndustryChart';
import DonorList from './DonorList';

/**
 * ExpandedView — full campaign finance breakdown shown when card is expanded.
 *
 * Props:
 *   summary              — summary object from API
 *   contributions        — contributions object (may be null until lazy-loaded)
 *   onFetchContributions — function to trigger initial contribution fetch
 *   onFetchMore          — function to load next page of contributions
 */

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatPercent(numerator, denominator) {
  if (!denominator || denominator === 0) return '0%';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

const CONFIDENCE_LEVELS = [
  {
    level: 'HIGH',
    label: 'High Confidence',
    description: 'Verified FEC electronic filing. Amounts and donor identities confirmed.',
    color: 'bg-green-500',
  },
  {
    level: 'MEDIUM',
    label: 'Medium Confidence',
    description: 'Partial match — some records needed cross-referencing across sources.',
    color: 'bg-yellow-400',
  },
  {
    level: 'ESTIMATED',
    label: 'Estimated',
    description: 'Some contributions could not be fully verified. May include dark money estimates.',
    color: 'bg-orange-500',
  },
];

export default function ExpandedView({ summary, contributions, onFetchContributions, onFetchMore }) {
  const [showConfidenceInfo, setShowConfidenceInfo] = useState(false);

  // Lazy-load contributions on first render of expanded view
  useEffect(() => {
    if (onFetchContributions) {
      onFetchContributions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!summary) return null;

  const totalRaised = summary.total_raised || 0;
  const individualTotal = summary.individual_total || 0;
  const pacTotal = summary.pac_total || 0;

  const individualPct = totalRaised > 0 ? (individualTotal / totalRaised) * 100 : 0;
  const pacPct = totalRaised > 0 ? (pacTotal / totalRaised) * 100 : 0;

  return (
    <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-6">

      {/* Section 1: Individual vs PAC proportion bar */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Source Breakdown
        </h4>

        {/* Stacked proportion bar */}
        <div className="flex rounded-full overflow-hidden h-3 mb-3 bg-gray-100">
          {individualPct > 0 && (
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${individualPct}%` }}
            />
          )}
          {pacPct > 0 && (
            <div
              className="bg-purple-500 h-full transition-all duration-500"
              style={{ width: `${pacPct}%` }}
            />
          )}
        </div>

        {/* Labels */}
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-gray-700">Individual:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(individualTotal)}</span>
            <span className="text-gray-500">({formatPercent(individualTotal, totalRaised)})</span>
            <ConfidenceDot level={summary.confidence_level || 'HIGH'} />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
            <span className="text-gray-700">PAC/Committee:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(pacTotal)}</span>
            <span className="text-gray-500">({formatPercent(pacTotal, totalRaised)})</span>
            <ConfidenceDot level={summary.confidence_level || 'HIGH'} />
          </div>
        </div>
      </div>

      {/* Section 2: Industry breakdown */}
      {summary.sector_breakdown && summary.sector_breakdown.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Industry Breakdown
          </h4>
          <IndustryChart data={summary.sector_breakdown} />
        </div>
      )}

      {/* Section 3: Top donors */}
      {summary.top_donors && summary.top_donors.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Top Donors
          </h4>
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <DonorList
              donors={summary.top_donors}
              contributions={contributions}
              onFetchContributions={onFetchContributions}
              onFetchMore={onFetchMore}
            />
          </div>
        </div>
      )}

      {/* Confidence levels explainer */}
      <div className="relative">
        <button
          type="button"
          className="text-xs text-gray-400 hover:text-gray-600 underline focus:outline-none"
          onClick={() => setShowConfidenceInfo((v) => !v)}
        >
          Learn more about confidence levels
        </button>

        {showConfidenceInfo && (
          <div className="absolute bottom-full left-0 mb-2 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-80 max-w-[calc(100vw-2rem)]">
            <div className="flex justify-between items-start mb-3">
              <h5 className="text-sm font-semibold text-gray-800">Data Confidence Levels</h5>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 ml-2"
                onClick={() => setShowConfidenceInfo(false)}
                aria-label="Close"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="space-y-3">
              {CONFIDENCE_LEVELS.map(({ level, label, description, color }) => (
                <li key={level} className="flex gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} flex-shrink-0 mt-1`} />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
