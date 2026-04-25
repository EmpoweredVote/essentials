import { useEffect, useState, useCallback } from 'react';
import {
  fetchStagingQueue,
  approveStagingCandidate,
  dismissStagingCandidate,
} from '../../lib/adminApi';

const CONFIDENCE_ORDER = { uncertain: 0, matched: 1, official: 2 };
const CONFIDENCE_STYLES = {
  official:  'bg-green-100 text-green-800 border border-green-300',
  matched:   'bg-yellow-100 text-yellow-800 border border-yellow-300',
  uncertain: 'bg-red-100 text-red-800 border border-red-300',
};
const URGENT_DAYS = 30;

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}
function groupByRace(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = e.race_id ?? `__unmatched__${e.race_hint ?? 'unknown'}`;
    if (!map.has(key)) {
      map.set(key, {
        raceId: e.race_id,
        raceName: e.race_name ?? e.race_hint ?? 'Unknown race',
        electionDate: e.election_date,
        jurisdictionName: e.jurisdiction_name,
        electionName: e.election_name,
        items: [],
      });
    }
    map.get(key).items.push(e);
  }
  for (const group of map.values()) {
    group.items.sort((a, b) =>
      (CONFIDENCE_ORDER[a.confidence] ?? 9) - (CONFIDENCE_ORDER[b.confidence] ?? 9)
    );
  }
  return [...map.values()];
}

function Toast({ message, type, onClose, onUndo }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = type === 'error' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-green-50 border-green-300 text-green-800';
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md max-w-sm ${bg}`}>
      <span className="flex-1 text-sm">{message}</span>
      {onUndo && (
        <button onClick={onUndo} className="text-current underline text-sm hover:opacity-80">Undo</button>
      )}
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  );
}

function QueueRow({ entry, urgent, onApprove, onDismiss }) {
  const confClass = CONFIDENCE_STYLES[entry.confidence] ?? CONFIDENCE_STYLES.uncertain;
  const urgentBorder = urgent ? 'border-l-4 border-l-orange-500' : '';
  const isAlreadyLive = !!entry.matched_candidate_id;
  const isAlias = isAlreadyLive && entry.matched_name &&
    entry.matched_name.toLowerCase() !== entry.full_name.toLowerCase();
  return (
    <div className={`flex items-center gap-3 border-b border-gray-200 px-4 py-3 ${urgentBorder}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{entry.full_name}</span>
          <span className={`text-xs rounded px-2 py-0.5 ${confClass}`}>{entry.confidence}</span>
          {isAlreadyLive && (
            <span className="text-xs rounded px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300">
              already live
            </span>
          )}
          {entry.flagged && entry.flag_reason && !isAlreadyLive && (
            <span className="text-xs text-red-700">({entry.flag_reason})</span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {entry.jurisdiction_name ?? '—'} · {entry.action ?? 'new'}
          {isAlias && (
            <span className="ml-1 text-blue-600"> · alias for {entry.matched_name}</span>
          )}
          {' · '}
          <a href={entry.citation_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">
            View source
          </a>
        </div>
      </div>
      <button onClick={() => onApprove(entry)} className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700">Approve</button>
      <button onClick={() => onDismiss(entry)} className="px-3 py-1 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300">Dismiss</button>
    </div>
  );
}

export default function StagingQueue() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStagingQueue();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) setAuthError(true);
      else setError(err.message || 'Failed to load queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const handleApprove = async (entry) => {
    setEntries(prev => prev.filter(e => e.id !== entry.id));
    setToast({
      message: `Approved ${entry.full_name}`,
      type: 'success',
      onUndo: () => { setToast(null); loadQueue(); },
    });
    try {
      await approveStagingCandidate(entry.id);
    } catch (err) {
      setToast({ message: `Approve failed: ${err.message}`, type: 'error' });
      loadQueue();
    }
  };

  const handleDismiss = async (entry) => {
    setEntries(prev => prev.filter(e => e.id !== entry.id));
    setToast({
      message: `Dismissed ${entry.full_name}`,
      type: 'success',
      onUndo: () => { setToast(null); loadQueue(); },
    });
    try {
      await dismissStagingCandidate(entry.id);
    } catch (err) {
      setToast({ message: `Dismiss failed: ${err.message}`, type: 'error' });
      loadQueue();
    }
  };

  if (authError) return <div className="p-6 text-red-700">Admin access required.</div>;
  if (loading) return <div className="p-6 text-gray-600">Loading staging queue…</div>;
  if (error) return <div className="p-6 text-red-700">{error}</div>;

  const groups = groupByRace(entries);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Candidate Staging Queue</h1>
      {groups.length === 0 ? (
        <div className="text-gray-600">No pending candidates.</div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => {
            const days = daysUntil(group.electionDate);
            const urgent = days !== null && days <= URGENT_DAYS;
            return (
              <section key={group.raceId ?? group.raceName} className={`border rounded-lg ${urgent ? 'border-orange-400' : 'border-gray-200'}`}>
                <header className={`px-4 py-2 border-b bg-gray-50 flex items-center justify-between ${urgent ? 'border-orange-400' : 'border-gray-200'}`}>
                  <div>
                    <div className="font-medium">{group.raceName}</div>
                    <div className="text-xs text-gray-500">
                      {group.jurisdictionName ?? '—'}
                      {group.electionDate && ` · Election ${formatDate(group.electionDate)}`}
                      {urgent && days !== null && (
                        <span className="ml-2 text-orange-700 font-medium">
                          {days >= 0 ? `${days} day${days === 1 ? '' : 's'} away` : 'Election past'}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">{group.items.length} pending</span>
                </header>
                <div>
                  {group.items.map(entry => (
                    <QueueRow
                      key={entry.id}
                      entry={entry}
                      urgent={urgent}
                      onApprove={handleApprove}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
