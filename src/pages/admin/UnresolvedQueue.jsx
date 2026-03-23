import { useEffect, useState, useRef, useCallback } from "react";
import {
  fetchUnresolvedQueue,
  resolveUnresolved,
  dismissUnresolved,
  restoreUnresolved,
  searchPoliticiansAdmin,
} from "../../lib/adminApi";

const SOURCES = [
  { value: "", label: "All Sources" },
  { value: "indiana", label: "Indiana" },
  { value: "fec", label: "FEC" },
  { value: "cal-access", label: "Cal-Access" },
  { value: "la_socrata", label: "LA Socrata" },
];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === "error" ? "bg-red-50 border-red-300 text-red-800" : "bg-green-50 border-green-300 text-green-800";

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md max-w-sm ${bg}`}>
      <span className="flex-1 text-sm">{message}</span>
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
    </div>
  );
}

function PoliticianSearchWidget({ onSelect, candidateName, source, contributionCount }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    setConfirmed(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchPoliticiansAdmin(val);
        // Handle both array response and {data: [...]} response shapes
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setResults(list);
      } catch (err) {
        setError("Search failed: " + err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelectPolitician = (pol) => {
    setSelected(pol);
    setQuery(pol.full_name || pol.name || "");
    setResults([]);
    setConfirmed(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative" ref={dropdownRef}>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Search politician by name
        </label>
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Type 2+ characters..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {loading && (
          <span className="absolute right-3 top-8 text-xs text-gray-400">Searching...</span>
        )}
        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
            {results.map((pol) => {
              const displayName = pol.full_name || pol.name || "(unknown)";
              const office = [pol.office_title, pol.representing_state].filter(Boolean).join(", ");
              return (
                <li key={pol.id || displayName}>
                  <button
                    onClick={() => handleSelectPolitician(pol)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    <span className="font-medium">{displayName}</span>
                    {office && <span className="text-gray-500 ml-1">— {office}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      {selected && !confirmed && (
        <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm">
          <p className="text-gray-700">
            Link{" "}
            <strong>{candidateName}</strong>{" "}
            <span className="text-gray-500">({source}, {contributionCount} contribution{contributionCount !== 1 ? "s" : ""})</span>{" "}
            to{" "}
            <strong>{selected.full_name || selected.name}</strong>
            {(selected.office_title || selected.representing_state) && (
              <span className="text-gray-500">
                {" "}/ {[selected.office_title, selected.representing_state].filter(Boolean).join(", ")}
              </span>
            )}
            ?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                setConfirmed(true);
                onSelect(selected);
              }}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Confirm Link
            </button>
            <button
              onClick={() => { setSelected(null); setQuery(""); }}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QueueRow({ entry, showDismissed, onRefresh, onToast }) {
  const [resolving, setResolving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolveError, setResolveError] = useState("");

  const handleResolveClick = () => {
    setResolving((prev) => !prev);
    setResolveError("");
  };

  const handlePoliticianSelected = async (politician) => {
    setActionLoading(true);
    setResolveError("");
    try {
      const result = await resolveUnresolved({
        adapter_name: entry.adapter_name,
        external_id: entry.external_id,
        politician_id: politician.id,
      });
      onToast(
        `Linked. ${result.contributions_moved} contribution${result.contributions_moved !== 1 ? "s" : ""} moved to ${result.politician_name}.`,
        "success"
      );
      setResolving(false);
      onRefresh();
    } catch (err) {
      setResolveError(err.message || "Resolve failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async () => {
    setActionLoading(true);
    try {
      await dismissUnresolved({
        adapter_name: entry.adapter_name,
        external_id: entry.external_id,
      });
      onRefresh();
    } catch (err) {
      onToast("Dismiss failed: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      await restoreUnresolved({
        adapter_name: entry.adapter_name,
        external_id: entry.external_id,
      });
      onRefresh();
    } catch (err) {
      onToast("Restore failed: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="px-4 py-3 text-sm font-medium text-gray-900">
          {entry.candidate_name || <span className="text-gray-400 italic">Unknown</span>}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-mono">
            {entry.adapter_name}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">
          {entry.contribution_count.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
          {formatDate(entry.first_seen_at)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
          {formatDate(entry.last_seen_at)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {showDismissed ? (
              <button
                onClick={handleRestore}
                disabled={actionLoading}
                className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {actionLoading ? "Restoring..." : "Restore"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleResolveClick}
                  disabled={actionLoading}
                  className={`rounded px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                    resolving
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {resolving ? "Cancel" : "Resolve"}
                </button>
                <button
                  onClick={handleDismiss}
                  disabled={actionLoading}
                  className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  {actionLoading ? "..." : "Dismiss"}
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {resolving && !showDismissed && (
        <tr className="border-b border-blue-100 bg-blue-50">
          <td colSpan={6} className="px-4 py-4">
            <PoliticianSearchWidget
              onSelect={handlePoliticianSelected}
              candidateName={entry.candidate_name || entry.external_id}
              source={entry.adapter_name}
              contributionCount={entry.contribution_count}
            />
            {resolveError && (
              <p className="mt-2 text-xs text-red-600">{resolveError}</p>
            )}
            {actionLoading && (
              <p className="mt-2 text-xs text-gray-500">Linking contributions...</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function UnresolvedQueue() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [showDismissed, setShowDismissed] = useState(false);
  const [toast, setToast] = useState(null);

  const show = showDismissed ? "dismissed" : "active";

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    setAuthError(false);
    try {
      const data = await fetchUnresolvedQueue({ source, show });
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setAuthError(true);
      } else {
        setError(err.message || "Failed to load queue.");
      }
    } finally {
      setLoading(false);
    }
  }, [source, show]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleToast = (message, type = "success") => {
    setToast({ message, type });
  };

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center max-w-sm">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Not Authorized</h2>
          <p className="text-sm text-red-700">
            Not authorized. Please log in as an admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Unresolved Contributions Queue</h1>
          <p className="mt-1 text-sm text-gray-500">
            Link unmatched contributions to known politicians or dismiss entries that cannot be resolved.
          </p>
        </div>

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Source:</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center rounded border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => setShowDismissed(false)}
              className={`px-3 py-1.5 text-sm font-medium focus:outline-none transition-colors ${
                !showDismissed
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setShowDismissed(true)}
              className={`px-3 py-1.5 text-sm font-medium focus:outline-none transition-colors ${
                showDismissed
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Dismissed
            </button>
          </div>

          <button
            onClick={loadQueue}
            disabled={loading}
            className="ml-auto rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Queue table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
              Loading queue...
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-500 text-sm">
                No unresolved contributions
                {showDismissed ? " (dismissed)" : ""}{source ? ` from ${source}` : ""}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Candidate Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Contributions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">
                      First Seen
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 hidden sm:table-cell">
                      Last Seen
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <QueueRow
                      key={`${entry.adapter_name}:${entry.external_id}`}
                      entry={entry}
                      showDismissed={showDismissed}
                      onRefresh={loadQueue}
                      onToast={handleToast}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && entries.length > 0 && (
          <p className="mt-2 text-right text-xs text-gray-400">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"}
          </p>
        )}
      </div>
    </div>
  );
}
