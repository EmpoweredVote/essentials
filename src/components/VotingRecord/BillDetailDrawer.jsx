import { useState, useEffect } from 'react';

/**
 * BillDetailDrawer — slide-over that surfaces enriched bill detail
 * for an LA City Council file number.
 *
 * Props:
 *   fileNumber: string  — e.g. "22-0158"
 *   onClose: () => void — called on ESC, backdrop click, or × button
 */

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

const VOTE_CONFIG = {
  YES:     { label: 'Yes',     color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/30',  border: 'border-green-200 dark:border-green-800' },
  NO:      { label: 'No',      color: 'text-red-700 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/30',      border: 'border-red-200 dark:border-red-800' },
  ABSENT:  { label: 'Absent',  color: 'text-gray-500 dark:text-gray-400',   bg: 'bg-gray-50 dark:bg-gray-800/50',    border: 'border-gray-200 dark:border-gray-700' },
  ABSTAIN: { label: 'Abstain', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-200 dark:border-yellow-800' },
  RECUSE:  { label: 'Recuse',  color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800' },
  PRESENT: { label: 'Present', color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/30',    border: 'border-blue-200 dark:border-blue-800' },
};

function VoteBadge({ vote }) {
  const cfg = VOTE_CONFIG[vote] ?? VOTE_CONFIG.ABSENT;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [y, m, d] = datePart.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
  } catch {
    return dateStr;
  }
}

function SkeletonBody() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          {i === 1 && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />}
        </div>
      ))}
    </div>
  );
}

export default function BillDetailDrawer({ fileNumber, onClose }) {
  const [detail, setDetail] = useState(null);
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);

  // Dual fetch on mount; re-fetches when fileNumber changes
  useEffect(() => {
    if (!fileNumber) return;

    let pollTimeout = null;
    let cancelled = false;

    // Fetch vote roster independently — fast, not blocked by CFMS enrichment
    fetch(`${API_BASE}/council-files/${fileNumber}/votes`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && data?.votes) setRoster(data.votes);
      })
      .catch(() => { /* roster failure is non-fatal */ });

    // Fetch bill detail with 202 polling support
    const fetchDetail = async () => {
      try {
        const r = await fetch(`${API_BASE}/council-files/${fileNumber}`);
        if (cancelled) return;

        if (r.ok) {
          const data = await r.json();
          setDetail(data);
          setPolling(false);
          setLoading(false);
          return;
        }

        if (r.status === 202) {
          // Enrichment in progress — start polling
          setPolling(true);

          let attempts = 0;
          const poll = async () => {
            if (cancelled) return;
            attempts++;
            if (attempts > 5) {
              setPolling(false);
              setLoading(false);
              setError('This bill is still being fetched. Try again in a moment.');
              return;
            }
            try {
              const pr = await fetch(`${API_BASE}/council-files/${fileNumber}`);
              if (cancelled) return;
              if (pr.ok) {
                const data = await pr.json();
                setDetail(data);
                setPolling(false);
                setLoading(false);
              } else {
                pollTimeout = setTimeout(poll, 2000);
              }
            } catch {
              if (!cancelled) {
                pollTimeout = setTimeout(poll, 2000);
              }
            }
          };
          pollTimeout = setTimeout(poll, 2000);
          return;
        }

        // Any other non-ok status
        setError('Unable to load bill details.');
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError('Unable to load bill details.');
          setLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [fileNumber]);

  // ESC key handler
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bill-drawer-title"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400">CF {fileNumber}</p>
            <h2
              id="bill-drawer-title"
              className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-0.5"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {detail?.title ?? (loading ? 'Loading…' : 'Bill Detail')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close bill detail"
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {loading && <SkeletonBody />}
          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          {!loading && !error && detail && (
            <>
              {/* Plain-English summary */}
              {detail.ai_summary && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">Plain English</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{detail.ai_summary}</p>
                </section>
              )}

              {/* Metadata grid */}
              <section className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {detail.introduced_date && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">Introduced</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(detail.introduced_date)}</p>
                  </div>
                )}
                {detail.movers && detail.movers.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">
                      Sponsor{detail.movers.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">{detail.movers.join(', ')}</p>
                  </div>
                )}
                {detail.second && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">Seconded by</p>
                    <p className="text-gray-700 dark:text-gray-300">{detail.second}</p>
                  </div>
                )}
              </section>

              {/* Links */}
              <section className="space-y-2">
                {detail.pdf_links && detail.pdf_links.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">Bill Documents</p>
                    <ul className="space-y-1">
                      {detail.pdf_links.slice(0, 5).map((url, i) => (
                        <li key={i}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            PDF #{i + 1} &#8599;
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {detail.video_url && (
                  <div>
                    <a
                      href={detail.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Watch council meeting video &#8599;
                    </a>
                  </div>
                )}
                {detail.cfms_url && (
                  <div>
                    <a
                      href={detail.cfms_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 hover:underline"
                    >
                      View on City Clerk CFMS &#8599;
                    </a>
                  </div>
                )}
              </section>

              {/* Vote roster */}
              {roster && roster.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Council Vote Roster</h3>
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {roster.map((r, i) => (
                      <li key={i} className="py-2 flex items-center justify-between">
                        {r.politician_id ? (
                          <a
                            href={`/politician/${r.politician_id}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {r.name}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-700 dark:text-gray-300">{r.name}</span>
                        )}
                        <VoteBadge vote={r.vote} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {polling && !error && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">Fetching bill details from City Clerk&hellip;</p>
          )}
        </div>
      </div>
    </>
  );
}
