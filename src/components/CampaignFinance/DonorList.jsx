import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ConfidenceDot from './ConfidenceDot';
import { isDonorFiltered, legacyDonorTransactions } from '../../lib/donorTransactions';

/**
 * DonorList — sortable donor list with inline transaction expand.
 *
 * Opening a donor fetches that donor's own transactions (?donor=), a page at a time. An API
 * without that filter is detected by the missing echo; the list then falls back to filtering
 * the shared `contributions` list, as it did before.
 *
 * Props:
 *   donors                    — array from summary.top_donors
 *   contributions             — object from contributions endpoint (may be null); fallback only
 *   onFetchContributions      — function to trigger contribution fetch; fallback only
 *   onFetchMore               — function to load next page; fallback only
 *   onFetchDonorContributions — (donorName, cursor?) => Promise of one page of that donor's rows
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
    // A bare YYYY-MM-DD parses as UTC midnight, which shows the day before in US time zones.
    const d = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? new Date(`${dateStr}T00:00:00`) : new Date(dateStr);
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
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
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

export default function DonorList({
  donors,
  contributions,
  onFetchContributions,
  onFetchMore,
  onFetchDonorContributions,
}) {
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

  // Per-donor pages, keyed by donor name:
  //   { status: 'loading' | 'ready' | 'error' | 'legacy', results, endCursor, loadingMore, moreError }
  const [donorPages, setDonorPages] = useState({});
  // Bumped when the donor list changes (e.g. a new cycle), so a late response is dropped.
  const generationRef = useRef(0);

  useEffect(() => {
    generationRef.current += 1;
    setDonorPages({});
  }, [donors]);

  // Fallback for an API without ?donor=: load the shared list once, as before.
  const startLegacyFetch = useCallback(() => {
    if (!fetchCalledRef.current) {
      fetchCalledRef.current = true;
      onFetchContributions?.();
    }
  }, [fetchCalledRef, onFetchContributions]);

  const loadDonorPage = useCallback(
    async (donorName, cursor = null) => {
      if (!onFetchDonorContributions) {
        setDonorPages((p) => ({ ...p, [donorName]: { status: 'legacy' } }));
        startLegacyFetch();
        return;
      }
      const generation = generationRef.current;
      setDonorPages((p) => ({
        ...p,
        [donorName]: cursor
          ? { ...p[donorName], loadingMore: true, moreError: false }
          : { status: 'loading', results: [] },
      }));
      try {
        const data = await onFetchDonorContributions(donorName, cursor);
        if (generation !== generationRef.current) return;
        if (!isDonorFiltered(data, donorName)) {
          setDonorPages((p) => ({ ...p, [donorName]: { status: 'legacy' } }));
          startLegacyFetch();
          return;
        }
        setDonorPages((p) => ({
          ...p,
          [donorName]: {
            status: 'ready',
            results: [...(cursor ? p[donorName]?.results ?? [] : []), ...(data.results || [])],
            endCursor: data.page_info?.has_next_page ? data.page_info.end_cursor || null : null,
            loadingMore: false,
            moreError: false,
          },
        }));
      } catch {
        if (generation !== generationRef.current) return;
        setDonorPages((p) => ({
          ...p,
          [donorName]: cursor ? { ...p[donorName], loadingMore: false, moreError: true } : { status: 'error' },
        }));
      }
    },
    [onFetchDonorContributions, startLegacyFetch]
  );

  // Fetch the first page when a donor is opened (or re-opened after the donor list changed).
  useEffect(() => {
    if (expandedDonor !== null && !donorPages[expandedDonor]) {
      loadDonorPage(expandedDonor);
    }
  }, [expandedDonor, donorPages, loadDonorPage]);

  function toggleDonor(donorName) {
    setExpandedDonor((prev) => (prev === donorName ? null : donorName));
  }

  if (!donors || donors.length === 0) {
    return <p className="text-gray-500 text-sm italic py-2">No donor data available.</p>;
  }

  return (
    <div>
      {/* Column headers */}
      <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr] gap-2 px-3 pb-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Donor</span>
        <SortHeader label="Amount" sortKey="total_amount" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
        <SortHeader label="# Contributions" sortKey="contribution_count" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
      </div>

      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {sortedDonors.map((donor) => {
          const isExpanded = expandedDonor === donor.name;
          const donorType = (donor.donor_type || '').toLowerCase();
          const isPac = donorType === 'pac' || donorType === 'committee';

          // This donor's transactions: its own pages, or the shared list on an older API
          const page = donorPages[donor.name];
          const isLegacy = page?.status === 'legacy';
          const donorTxns = isLegacy ? legacyDonorTransactions(contributions, donor.name) : page?.results ?? [];
          const isLoadingTxns = isLegacy ? contributions === null : !page || page.status === 'loading';

          return (
            <li key={donor.name}>
              {/* Donor row */}
              <button
                type="button"
                className="w-full text-left px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => toggleDonor(donor.name)}
                aria-expanded={isExpanded}
              >
                <div className="sm:grid sm:grid-cols-[2fr_1fr_1fr] sm:gap-2 sm:items-center flex flex-col gap-1">
                  {/* Donor info */}
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {isPac ? (
                        <BuildingIcon className="w-4 h-4 text-purple-400 dark:text-purple-400" />
                      ) : (
                        <PersonIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{donor.name}</p>
                      {(donor.employer || donor.occupation) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {[donor.employer, donor.occupation].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {donor.sector && (
                        <span className="inline-block mt-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">
                          {donor.sector}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-1.5 sm:justify-start pl-6 sm:pl-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(donor.total_amount || 0)}
                    </span>
                    <ConfidenceDot level={donor.confidence_level || 'HIGH'} />
                  </div>

                  {/* Count */}
                  <div className="pl-6 sm:pl-0">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {donor.contribution_count || 0} donation{(donor.contribution_count || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </button>

              {/* Inline transaction list */}
              {isExpanded && (
                <div className="pl-9 pr-3 pb-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                  {isLoadingTxns ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-2">Loading transactions...</p>
                  ) : page?.status === 'error' ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-2">Could not load transactions.</p>
                  ) : donorTxns.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 py-2">No individual transactions found.</p>
                  ) : (
                    <ul className="space-y-1 pt-2">
                      {donorTxns.map((tx, i) => (
                        <li key={tx.id ?? i} className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                          <span>{formatDate(tx.contribution_date || tx.date)}</span>
                          <span className="font-medium">
                            {formatCurrency(tx.amount)}
                            {tx.amount < 0 && <span className="font-normal text-gray-400 dark:text-gray-500"> refund</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {isLegacy
                    ? contributions?.page_info?.has_next_page && (
                        <button
                          type="button"
                          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                          onClick={(e) => { e.stopPropagation(); onFetchMore(); }}
                        >
                          Load more
                        </button>
                      )
                    : page?.status === 'ready' && page.endCursor && (
                        <button
                          type="button"
                          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline disabled:opacity-50 disabled:no-underline"
                          disabled={page.loadingMore}
                          onClick={(e) => { e.stopPropagation(); loadDonorPage(donor.name, page.endCursor); }}
                        >
                          {page.loadingMore ? 'Loading...' : page.moreError ? 'Could not load. Try again' : 'Load more'}
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
