import { useState, useRef, useEffect } from 'react';
import ConfidenceDot from './ConfidenceDot';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

/**
 * DonorSearch — inline donor name search for the politician profile page.
 * Lets any visitor type a donor name and see which politicians on the
 * platform received contributions from that donor, grouped by politician.
 *
 * Props:
 *   currentPoliticianId — UUID of the politician whose profile is being viewed.
 *                         That politician's group is pinned to the top.
 */
export default function DonorSearch({ currentPoliticianId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);

    // Clear any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Reset results if query is too short
    if (val.length < 2) {
      setResults(null);
      setError(null);
      return;
    }

    // 300ms debounce before firing search
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/campaign-finance/donors/search?q=${encodeURIComponent(val)}`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        const data = await res.json();

        // Pin currentPoliticianId first, then sort remaining by total_donated DESC
        const sorted = [...(data.politicians || [])].sort((a, b) => {
          if (a.politician_id === currentPoliticianId) return -1;
          if (b.politician_id === currentPoliticianId) return 1;
          return b.total_donated - a.total_donated;
        });

        setResults({ ...data, politicians: sorted });
      } catch (err) {
        setError(err.message || 'Search failed. Please try again.');
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  // Compute summary totals across all politician groups
  const totalAmount =
    results?.politicians?.reduce((sum, p) => sum + (p.total_donated || 0), 0) ?? 0;
  const totalContributions =
    results?.politicians?.reduce((sum, p) => sum + (p.contribution_count || 0), 0) ?? 0;
  const politicianCount = results?.politicians?.length ?? 0;

  const formattedTotal = totalAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 px-5 pb-5">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Search by donor name..."
        aria-label="Search by donor name"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Loading state */}
      {loading && (
        <p className="text-sm text-gray-400 mt-3 animate-pulse">Searching...</p>
      )}

      {/* Error state */}
      {error && !loading && (
        <p className="text-sm text-red-600 mt-3">{error}</p>
      )}

      {/* Summary line */}
      {!loading && results && politicianCount > 0 && (
        <p className="text-sm text-gray-600 mt-3 mb-2">
          {formattedTotal} &middot; {totalContributions} contribution{totalContributions !== 1 ? 's' : ''} &middot; {politicianCount} politician{politicianCount !== 1 ? 's' : ''} on Empowered Vote
        </p>
      )}

      {/* Empty state */}
      {!loading && results && politicianCount === 0 && (
        <p className="text-sm text-gray-500 mt-3">
          No results on Empowered Vote for that name.{' '}
          <a
            href={`https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Search individual contributors on FEC.gov
          </a>{' '}
          for broader coverage.
        </p>
      )}

      {/* Politician result groups */}
      {!loading && results && politicianCount > 0 && (
        <div className="mt-1 divide-y divide-gray-100">
          {results.politicians.map((group) => {
            const isCurrentPolitician = group.politician_id === currentPoliticianId;
            return (
              <div
                key={group.politician_id}
                className={`py-3 ${isCurrentPolitician ? 'border-l-2 border-blue-500 pl-3 bg-blue-50/50 -ml-3' : ''}`}
              >
                {/* Group header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-sm text-gray-900 truncate">
                      {group.politician_name}
                    </span>
                    <ConfidenceDot level={group.mode_confidence} />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900">
                      {group.total_donated.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({group.contribution_count} contribution{group.contribution_count !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
                {/* Office + jurisdiction */}
                {(group.office_title || group.jurisdiction) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[group.office_title, group.jurisdiction].filter(Boolean).join(' — ')}
                  </p>
                )}

                {/* Contribution rows — all visible, no collapse */}
                <div className="mt-2 space-y-1">
                  {group.contributions.map((contrib, idx) => {
                    const dateStr = contrib.date
                      ? new Date(contrib.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A';
                    const location = [contrib.city, contrib.state]
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-600"
                      >
                        <span className="text-gray-400">{dateStr}</span>
                        <span className="font-medium text-gray-800">
                          {contrib.amount.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        {contrib.employer && (
                          <span className="text-gray-500">{contrib.employer}</span>
                        )}
                        {location && <span className="text-gray-400">{location}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
