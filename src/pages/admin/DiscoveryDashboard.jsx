import { useEffect, useState, useCallback, useRef } from 'react';
import {
  fetchDiscoveryJurisdictions,
  fetchDiscoveryRuns,
  fetchDiscoveryCoverage,
  triggerDiscoveryRun,
} from '../../lib/adminApi';

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch { return dateStr; }
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return dateStr; }
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--ev-teal)] border-t-transparent inline-block" />
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const bg = toast.type === 'error'
    ? 'bg-red-50 border-red-300 text-red-800'
    : 'bg-green-50 border-green-300 text-green-800';

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md max-w-sm ${bg}`}>
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-current opacity-60 hover:opacity-100 text-lg leading-none"
      >&times;</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-500 border border-gray-200">
        Never run
      </span>
    );
  }
  const styles = {
    success: 'bg-green-100 text-green-800 border-green-300',
    failed:  'bg-red-100 text-red-800 border-red-300',
    running: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };
  const cls = styles[status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const isRunning = status === 'running';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs border ${cls} ${isRunning ? 'animate-pulse' : ''}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Jurisdictions table
// ---------------------------------------------------------------------------

function JurisdictionsSection({ jurisdictions, onRunDiscovery, runningIds }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(key) {
    if (sortKey === key) {
      setSortAsc(a => !a);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function SortHeader({ colKey, label }) {
    const active = sortKey === colKey;
    return (
      <th
        className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer select-none hover:text-gray-900 whitespace-nowrap"
        onClick={() => handleSort(colKey)}
      >
        {label}
        {active && (
          <span className="ml-1 text-gray-400">{sortAsc ? '▲' : '▼'}</span>
        )}
      </th>
    );
  }

  const filtered = jurisdictions.filter(j =>
    !search || j.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortKey] ?? '';
    let bv = b[sortKey] ?? '';
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <section className="border border-gray-200 rounded-lg overflow-hidden">
      <header className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-gray-800">Jurisdictions</h2>
        <input
          type="search"
          placeholder="Filter jurisdictions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortHeader colKey="name" label="Jurisdiction" />
              <SortHeader colKey="election_date" label="Election" />
              <SortHeader colKey="last_run_status" label="Status" />
              <SortHeader colKey="last_run_started_at" label="Last Run" />
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Candidates Found</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Auto-Upserted</th>
              <SortHeader colKey="active_candidates" label="Active" />
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500 text-sm">
                  {search ? 'No jurisdictions match filter.' : 'No jurisdictions found.'}
                </td>
              </tr>
            ) : (
              sorted.map(j => {
                const isRunning = runningIds.has(j.id) || j.last_run_status === 'running';
                return (
                  <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{j.name}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDateShort(j.election_date)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={isRunning ? 'running' : j.last_run_status} />
                    </td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">{formatDate(j.last_run_started_at)}</td>
                    <td className="px-3 py-2 text-gray-700 text-center">{j.last_run_candidates_found ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-700 text-center">{j.last_run_candidates_auto_upserted ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-700 text-center font-medium">{j.active_candidates ?? 0}</td>
                    <td className="px-3 py-2">
                      {isRunning ? (
                        <div className="flex items-center gap-2 text-xs text-yellow-700">
                          <Spinner />
                          <span>Running…</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onRunDiscovery(j)}
                          className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Run Discovery
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Run history table
// ---------------------------------------------------------------------------

function RunHistorySection({ jurisdictions }) {
  const [runs, setRuns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [filterJurisdiction, setFilterJurisdiction] = useState('');

  const LIMIT = 25;

  const loadRuns = useCallback(async (p, jurisdictionId) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDiscoveryRuns({
        limit: LIMIT,
        offset: p * LIMIT,
        jurisdiction_id: jurisdictionId || undefined,
      });
      setRuns(Array.isArray(data.runs) ? data.runs : []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
    } catch (err) {
      setError(err.message || 'Failed to load run history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns(page, filterJurisdiction);
  }, [loadRuns, page, filterJurisdiction]);

  function handleFilterChange(e) {
    setFilterJurisdiction(e.target.value);
    setPage(0);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <section className="border border-gray-200 rounded-lg overflow-hidden">
      <header className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-gray-800">Run History</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterJurisdiction}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Jurisdictions</option>
            {jurisdictions.map(j => (
              <option key={j.id} value={j.id}>{j.name}</option>
            ))}
          </select>
        </div>
      </header>

      {loading ? (
        <div className="px-4 py-6 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
          <Spinner /> <span>Loading…</span>
        </div>
      ) : error ? (
        <div className="px-4 py-4 text-red-700 text-sm">{error}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Jurisdiction</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Started</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Completed</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Found</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Auto-Upserted</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Trigger</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500 text-sm">
                      No runs found.
                    </td>
                  </tr>
                ) : (
                  runs.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{r.jurisdiction_name}</td>
                      <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{formatDate(r.started_at)}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{formatDate(r.completed_at)}</td>
                      <td className="px-3 py-2 text-gray-700 text-center">{r.candidates_found ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-700 text-center">{r.candidates_auto_upserted ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{r.triggered_by ?? '—'}</td>
                      <td className="px-3 py-2 text-xs text-red-600 max-w-xs truncate" title={r.error_message ?? ''}>
                        {r.error_message ?? ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section 3: Coverage health table
// ---------------------------------------------------------------------------

function CoverageSection({ coverage, loading, error }) {
  return (
    <section className="border border-gray-200 rounded-lg overflow-hidden">
      <header className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-800">Coverage Health</h2>
        <p className="text-xs text-gray-500 mt-0.5">Races with zero candidates are flagged in red.</p>
      </header>

      {loading ? (
        <div className="px-4 py-6 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
          <Spinner /> <span>Loading…</span>
        </div>
      ) : error ? (
        <div className="px-4 py-4 text-red-700 text-sm">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Jurisdiction</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Total Races</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">With Candidates</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Zero Candidates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coverage.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-sm">
                    No coverage data found.
                  </td>
                </tr>
              ) : (
                coverage.map(row => {
                  const hasZero = row.zero_candidate_races > 0;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-gray-900">{row.name}</td>
                      <td className="px-3 py-2 text-gray-700 text-center">{row.total_races}</td>
                      <td className="px-3 py-2 text-gray-700 text-center">{row.races_with_candidates}</td>
                      <td className={`px-3 py-2 text-center font-medium ${hasZero ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                        {row.zero_candidate_races}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DiscoveryDashboard() {
  const [jurisdictions, setJurisdictions] = useState([]);
  const [coverage, setCoverage] = useState([]);
  const [loadingJurisdictions, setLoadingJurisdictions] = useState(true);
  const [loadingCoverage, setLoadingCoverage] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [jurisdictionError, setJurisdictionError] = useState('');
  const [coverageError, setCoverageError] = useState('');
  const [runningIds, setRunningIds] = useState(new Set());
  const [toast, setToast] = useState(null);

  const pollIntervalRef = useRef(null);

  // Load jurisdictions
  const loadJurisdictions = useCallback(async () => {
    try {
      const data = await fetchDiscoveryJurisdictions();
      setJurisdictions(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) setAuthError(true);
      else setJurisdictionError(err.message || 'Failed to load jurisdictions.');
    } finally {
      setLoadingJurisdictions(false);
    }
  }, []);

  // Load coverage
  const loadCoverage = useCallback(async () => {
    setLoadingCoverage(true);
    setCoverageError('');
    try {
      const data = await fetchDiscoveryCoverage();
      setCoverage(Array.isArray(data) ? data : []);
    } catch (err) {
      setCoverageError(err.message || 'Failed to load coverage.');
    } finally {
      setLoadingCoverage(false);
    }
  }, []);

  useEffect(() => {
    loadJurisdictions();
    loadCoverage();
  }, [loadJurisdictions, loadCoverage]);

  // Polling: refresh jurisdictions at 4s intervals while any row is running
  useEffect(() => {
    const hasRunning =
      runningIds.size > 0 ||
      jurisdictions.some(j => j.last_run_status === 'running');

    if (hasRunning && !pollIntervalRef.current) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const fresh = await fetchDiscoveryJurisdictions();
          const freshArr = Array.isArray(fresh) ? fresh : [];
          setJurisdictions(freshArr);

          // Check if any previously-running rows are now settled
          const nowRunning = new Set(
            freshArr
              .filter(j => j.last_run_status === 'running')
              .map(j => j.id)
          );

          // Remove IDs that finished from runningIds
          setRunningIds(prev => {
            const next = new Set(prev);
            for (const id of prev) {
              if (!nowRunning.has(id)) {
                next.delete(id);
                const row = freshArr.find(j => j.id === id);
                if (row) {
                  const succeeded = row.last_run_status === 'success';
                  setToast({
                    type: succeeded ? 'success' : 'error',
                    message: `${row.name}: discovery ${row.last_run_status}`,
                  });
                }
              }
            }
            return next;
          });

          // If none running any more, re-fetch runs and coverage
          if (nowRunning.size === 0) {
            loadCoverage();
          }
        } catch {
          // silent poll failure
        }
      }, 4000);
    }

    if (!hasRunning && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    return () => {
      // cleanup only on unmount — interval managed by the condition above
    };
  }, [jurisdictions, runningIds, loadCoverage]);

  // Cleanup poll on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  async function handleRunDiscovery(j) {
    // Optimistic: mark as running immediately
    setRunningIds(prev => new Set([...prev, j.id]));
    setJurisdictions(prev =>
      prev.map(row => row.id === j.id ? { ...row, last_run_status: 'running' } : row)
    );

    try {
      const res = await triggerDiscoveryRun(j.id);
      if (res.status === 202) {
        setToast({ type: 'success', message: `Discovery triggered for ${j.name}` });
      } else if (res.status === 409) {
        setToast({ type: 'error', message: `${j.name}: run already in progress (409)` });
        // Revert optimistic state
        setRunningIds(prev => { const n = new Set(prev); n.delete(j.id); return n; });
        loadJurisdictions();
      } else {
        const body = await res.text().catch(() => '');
        setToast({
          type: 'error',
          message: `${j.name}: trigger failed (${res.status})${body ? ' — ' + body.slice(0, 80) : ''}`,
        });
        setRunningIds(prev => { const n = new Set(prev); n.delete(j.id); return n; });
        loadJurisdictions();
      }
    } catch (err) {
      setToast({ type: 'error', message: `${j.name}: ${err.message}` });
      setRunningIds(prev => { const n = new Set(prev); n.delete(j.id); return n; });
      loadJurisdictions();
    }
  }

  if (authError) {
    return <div className="p-6 text-red-700">Admin access required.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Discovery Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor jurisdiction discovery runs, trigger manual runs, and review candidate coverage health.
        </p>
      </div>

      {/* Section 1: Jurisdictions */}
      {loadingJurisdictions ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-6">
          <Spinner /> <span>Loading jurisdictions…</span>
        </div>
      ) : jurisdictionError ? (
        <div className="p-4 rounded border border-red-300 bg-red-50 text-red-700 text-sm">{jurisdictionError}</div>
      ) : (
        <JurisdictionsSection
          jurisdictions={jurisdictions}
          onRunDiscovery={handleRunDiscovery}
          runningIds={runningIds}
        />
      )}

      {/* Section 2: Run History */}
      <RunHistorySection jurisdictions={jurisdictions} />

      {/* Section 3: Coverage Health */}
      <CoverageSection
        coverage={coverage}
        loading={loadingCoverage}
        error={coverageError}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
