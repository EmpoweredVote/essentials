import { useState, useEffect } from 'react';
import BillDetailDrawer from './BillDetailDrawer';

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

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    // Handle both "YYYY-MM-DD" and ISO "YYYY-MM-DDT..." formats
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [y, m, d] = datePart.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
  } catch {
    return dateStr;
  }
}

function VoteBadge({ vote }) {
  const cfg = VOTE_CONFIG[vote] ?? VOTE_CONFIG.ABSENT;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function VoteSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * VotingRecordSection — shows LA City Council voting record for a council member.
 * Only renders if the API returns votes (empty = not an LA council member, no UI shown).
 */
export default function VotingRecordSection({ politicianId }) {
  const [votes, setVotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [yesTotal, setYesTotal] = useState(0);
  const [noTotal, setNoTotal] = useState(0);
  const [absentTotal, setAbsentTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState('ALL');
  const [selectedFile, setSelectedFile] = useState(null);
  const LIMIT = 25;

  useEffect(() => {
    if (!politicianId) return;
    setLoading(true);
    setError(null);
    const voteParam = filter !== 'ALL' ? `&vote=${filter}` : '';
    fetch(`${API_BASE}/campaign-finance/politician/${politicianId}/council-votes?limit=${LIMIT}&offset=${offset}${voteParam}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setVotes(data.votes ?? []);
        setTotal(data.total ?? 0);
        setYesTotal(data.yes_total ?? 0);
        setNoTotal(data.no_total ?? 0);
        setAbsentTotal(data.absent_total ?? 0);
      })
      .catch(() => setError('Unable to load voting record.'))
      .finally(() => setLoading(false));
  }, [politicianId, offset, filter]);

  // Don't render at all if no data and not loading
  if (!loading && !error && total === 0) return null;

  const filteredTotal = filter === 'ALL' ? total
    : filter === 'YES' ? yesTotal
    : filter === 'NO' ? noTotal
    : filter === 'ABSENT' ? absentTotal
    : votes.length;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3
            className="text-base font-semibold text-gray-800 dark:text-gray-200"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            City Council Voting Record
          </h3>
          {!loading && total > 0 && (
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {total.toLocaleString()} votes on record
            </span>
          )}
        </div>

        {/* Overall vote tally — counts across all votes, not just this page */}
        {!loading && total > 0 && (
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-green-700 dark:text-green-400 font-medium">{yesTotal.toLocaleString()} Yes</span>
            <span className="text-red-600 dark:text-red-400 font-medium">{noTotal.toLocaleString()} No</span>
            <span className="text-gray-600 dark:text-gray-300 font-medium">{absentTotal.toLocaleString()} Absent</span>
            <span className="text-gray-500 dark:text-gray-400 text-xs ml-auto">
              Showing {offset + 1}–{Math.min(offset + votes.length, filteredTotal)} of {filteredTotal}
            </span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      {!loading && total > 0 && (
        <div className="px-5 pt-3 flex gap-2 flex-wrap">
          {['ALL', 'YES', 'NO', 'ABSENT', 'ABSTAIN'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setOffset(0); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'ALL' ? 'All' : VOTE_CONFIG[f].label}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="px-5 py-4">
        {loading && <VoteSkeleton />}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
        {!loading && !error && votes.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No votes match this filter.</p>
        )}
        {!loading && !error && votes.length > 0 && (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {votes.map((v, i) => (
              <li
                key={`${v.council_file_number}-${v.vote_date}-${i}`}
                className={`py-3 flex items-start gap-3 px-2 -mx-2 rounded-lg transition-colors ${
                  v.council_file_number
                    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    : ''
                }`}
                onClick={() => v.council_file_number && setSelectedFile(v.council_file_number)}
                role={v.council_file_number ? 'button' : undefined}
                tabIndex={v.council_file_number ? 0 : undefined}
                onKeyDown={(e) => {
                  if (v.council_file_number && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setSelectedFile(v.council_file_number);
                  }
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <VoteBadge vote={v.vote} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{formatDate(v.vote_date)}</span>
                    {v.council_file_number && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        CF {v.council_file_number}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">
                    {v.description || 'No description available.'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredTotal > LIMIT && (
        <div className="px-5 pb-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
          <button
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            disabled={offset === 0}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Page {Math.floor(offset / LIMIT) + 1} of {Math.ceil(filteredTotal / LIMIT)}
          </span>
          <button
            onClick={() => setOffset(offset + LIMIT)}
            disabled={offset + LIMIT >= filteredTotal}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {selectedFile && (
        <BillDetailDrawer
          fileNumber={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
