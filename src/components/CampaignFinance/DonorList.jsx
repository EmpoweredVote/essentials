import { useState, useMemo } from 'react';
import ConfidenceDot from './ConfidenceDot';

/**
 * DonorList — sortable donor list with inline transaction expand.
 *
 * Props:
 *   donors               — array from summary.top_donors
 *   contributions        — object from contributions endpoint (may be null)
 *   onFetchContributions — function to trigger contribution fetch
 *   onFetchMore          — function to load next page
 */

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Simple person SVG icon
function PersonIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  );
}

// Simple building SVG icon
function BuildingIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm2 2v14h12V5H6zm2 2h2v2H8V7zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm4-8h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h4v2h-4v-2zm4-8h2v2h-2V7zm0 4h2v2h-2v-2z" />
    </svg>
  );
}

function SortHeader({ label, sortKey, sortBy, sortDir, onSort }) {
  const isActive = sortBy === sortKey;
  return (
    <button
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide hover:text-gray-900 transition-colors ${
        isActive ? 'text-blue-600' : 'text-gray-500'
      }`}
      onClick={() => onSort(sortKey)}
      type="button"
    >
      {label}
      {isActive && (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          {sortDir === 'asc' ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          )}
        </svg>
      )}
    </button>
  );
}

export default function DonorList({ donors, contributions, onFetchContributions, onFetchMore }) {
  const [sortBy, setSortBy] = useState('total_amount');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedDonor, setExpandedDonor] = useState(null);
  const fetchCalledRef = useMemo(() => ({ current: false }), []);

  const sortedDonors = useMemo(() => {
    if (!donors || donors.length === 0) return [];
    return [...donors].sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [donors, sortBy, sortDir]);

  function handleSort(key) {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  }

  function toggleDonor(donorName) {
    setExpandedDonor((prev) => (prev === donorName ? null : donorName));
    // Trigger contribution fetch on first expand
    if (!fetchCalledRef.current) {
      fetchCalledRef.current = true;
      onFetchContributions();
    }
  }

  if (!donors || donors.length === 0) {
    return <p className="text-gray-500 text-sm italic py-2">No donor data available.</p>;
  }

  return (
    <div>
      {/* Column headers */}
      <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr] gap-2 px-3 pb-2 border-b border-gray-100">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Donor</span>
        <SortHeader label="Amount" sortKey="total_amount" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
        <SortHeader label="# Contributions" sortKey="contribution_count" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
      </div>

      <ul className="divide-y divide-gray-50">
        {sortedDonors.map((donor) => {
          const isExpanded = expandedDonor === donor.name;
          const donorType = (donor.donor_type || '').toLowerCase();
          const isPac = donorType === 'pac' || donorType === 'committee';

          // Filter transactions for this donor
          const donorTxns = contributions?.results
            ? contributions.results.filter(
                (tx) => tx.donor_name === donor.name
              )
            : [];

          return (
            <li key={donor.name}>
              {/* Donor row */}
              <button
                type="button"
                className="w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => toggleDonor(donor.name)}
                aria-expanded={isExpanded}
              >
                <div className="sm:grid sm:grid-cols-[2fr_1fr_1fr] sm:gap-2 sm:items-center flex flex-col gap-1">
                  {/* Donor info */}
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {isPac ? (
                        <BuildingIcon className="w-4 h-4 text-purple-500" />
                      ) : (
                        <PersonIcon className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{donor.name}</p>
                      {(donor.employer || donor.occupation) && (
                        <p className="text-xs text-gray-500 truncate">
                          {[donor.employer, donor.occupation].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {donor.sector && (
                        <span className="inline-block mt-0.5 text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                          {donor.sector}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-1.5 sm:justify-start pl-6 sm:pl-0">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(donor.total_amount || 0)}
                    </span>
                    <ConfidenceDot level={donor.confidence_level || 'HIGH'} />
                  </div>

                  {/* Count */}
                  <div className="pl-6 sm:pl-0">
                    <span className="text-sm text-gray-500">
                      {donor.contribution_count || 0} donation{(donor.contribution_count || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </button>

              {/* Inline transaction list */}
              {isExpanded && (
                <div className="pl-9 pr-3 pb-3 bg-gray-50 border-t border-gray-100">
                  {contributions === null ? (
                    <p className="text-xs text-gray-400 py-2">Loading transactions...</p>
                  ) : donorTxns.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No individual transactions found.</p>
                  ) : (
                    <ul className="space-y-1 pt-2">
                      {donorTxns.map((tx, i) => (
                        <li key={i} className="flex justify-between text-xs text-gray-600">
                          <span>{formatDate(tx.contribution_date || tx.date)}</span>
                          <span className="font-medium">{formatCurrency(tx.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {contributions?.page_info?.has_next_page && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                      onClick={(e) => { e.stopPropagation(); onFetchMore(); }}
                    >
                      Load more
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
