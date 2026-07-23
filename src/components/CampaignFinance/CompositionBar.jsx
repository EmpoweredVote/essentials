import { useState } from 'react';
import InfoTooltip from './InfoTooltip';
import { formatCurrency, formatPercent } from '../../utils/format';

/**
 * CompositionBar — an honest, plain-language horizontal breakdown of where a candidate's money
 * came from, out of their AUTHORITATIVE total receipts (FEC). Grassroots small-dollar money
 * (≤$200) is highlighted in green and called out as a share of the real total. Inspired by
 * Treasury Tracker's SpendingBreakdownBar, "with better explanations."
 *
 * Honesty rules (see .planning/decisions/DISCLOSURE-THRESHOLD-POLICY.md):
 *  - grassroots % is against the authoritative total, never an itemized sum
 *  - PAC/committee money is a visible segment, never hidden inside "above $200"
 *  - sub-$200 donors are counted in $ but never named — the explainer says so
 *
 * Props: composition — the summary.composition object, or null/undefined (renders nothing).
 */

// Segment definitions, in display order (grassroots first / leftmost).
const SEGMENTS = [
  {
    key: 'grassroots',
    label: 'Grassroots donors',
    sub: '$200 or less',
    barClass: 'bg-green-500',
    dotClass: 'bg-green-500',
    description:
      'Small donations of $200 or less. By law these donors aren’t named individually — that protects everyday supporters. A high share here means broad, small-dollar support.',
  },
  {
    key: 'large_individual',
    label: 'Large individual donors',
    sub: 'more than $200',
    barClass: 'bg-blue-500',
    dotClass: 'bg-blue-500',
    description:
      'People who gave more than $200 in total. The law requires these donors be named publicly — they’re listed under Top Donors below.',
  },
  {
    key: 'pac_committee',
    label: 'PACs & committees',
    sub: null,
    barClass: 'bg-purple-500',
    dotClass: 'bg-purple-500',
    description:
      'An organized group — an industry, union, advocacy organization, or political party — that pools many people’s money to back candidates. A “PAC” is a political action committee. Unlike an individual donor, it represents an organized interest.',
  },
  {
    key: 'self_funding',
    label: 'Self-funding',
    sub: null,
    barClass: 'bg-amber-500',
    dotClass: 'bg-amber-500',
    description: 'Money the candidate gave or loaned to their own campaign.',
  },
  {
    key: 'other',
    label: 'Other',
    sub: null,
    barClass: 'bg-gray-400',
    dotClass: 'bg-gray-400',
    description: 'Transfers between committees, interest, refunds, and other miscellaneous receipts.',
  },
];

// Whole-graph explainer, written as a few short, spaced points rather than one dense block.
const GRAPH_EXPLAINER = {
  title: 'Where the money came from',
  paragraphs: [
    'Every dollar a candidate raises comes from somewhere. This bar breaks their total down by who gave it.',
    '$200 is the line the law draws: give $200 or less and you stay private — this is “grassroots” support. Give more and your name becomes public.',
    'A bigger green slice means the campaign leans on many small, everyday donors — rather than a few large donors, organized PACs, or the candidate’s own money.',
  ],
};

export default function CompositionBar({ composition }) {
  const [hovered, setHovered] = useState(null);
  if (!composition || !(composition.total > 0)) return null;

  const total = composition.total;
  // Build the rendered segment list with amounts + percentages, dropping zero segments.
  const segments = SEGMENTS
    .map((s) => ({ ...s, amount: composition[s.key] || 0 }))
    .filter((s) => s.amount > 0)
    .map((s) => ({ ...s, pct: (s.amount / total) * 100 }));

  const grassrootsPct = Math.round((composition.grassroots_share || 0) * 100);
  const grassrootsAmount = composition.grassroots || 0;

  return (
    <div>
      {/* Header + graph explainer */}
      <div className="flex items-center gap-1.5 mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Where the money came from
        </h4>
        <InfoTooltip content={GRAPH_EXPLAINER} label="How to read this graph" />
      </div>

      {/* Grassroots headline callout */}
      <div className="mb-3">
        <span className="text-2xl font-bold text-green-600 dark:text-green-400" style={{ fontFamily: "'Manrope', sans-serif" }}>
          {grassrootsPct}% grassroots
        </span>
        <span className="block text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {formatCurrency(grassrootsAmount)} from small donors giving $200 or less
          <span className="text-gray-400 dark:text-gray-500"> · of {formatCurrency(total)} in federal receipts</span>
        </span>
      </div>

      {/* The segmented bar */}
      <div
        className="flex rounded-lg overflow-hidden h-8 mb-2 bg-gray-100 dark:bg-gray-700"
        role="img"
        aria-label="Breakdown of where the money came from"
      >
        {segments.map((s) => {
          if (s.pct < 0.5) return null; // too thin to render
          const isHovered = hovered === s.key;
          return (
            <button
              key={s.key}
              type="button"
              className={`${s.barClass} h-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70`}
              style={{ width: `${s.pct}%`, filter: isHovered ? 'brightness(1.1)' : 'none' }}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(s.key)}
              onBlur={() => setHovered(null)}
              aria-label={`${s.label}: ${formatCurrency(s.amount)} (${Math.round(s.pct)}%)`}
            >
              {s.pct > 10 && (
                <span className="text-[11px] font-semibold text-white px-1 truncate block">
                  {Math.round(s.pct)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend with always-visible plain-language explanations */}
      <ul className="space-y-2.5 mt-3">
        {segments.map((s) => (
          <li
            key={s.key}
            className={`flex gap-2 rounded-md -mx-1 px-1 py-0.5 transition-colors ${hovered === s.key ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
            onMouseEnter={() => setHovered(s.key)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${s.dotClass} flex-shrink-0 mt-1`} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{s.label}</span>
                {s.sub && <span className="text-xs text-gray-400 dark:text-gray-500">({s.sub})</span>}
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(s.amount)}</span>
                <span className="text-gray-500 dark:text-gray-400">{formatPercent(s.amount, total)}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{s.description}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Source / honesty note */}
      <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        Federal campaign receipts, reported to the FEC. Small-dollar donors ($200 or less) are
        counted in the total but not named individually — that’s the law protecting everyday
        supporters, and we honor the same line.
      </p>
    </div>
  );
}
