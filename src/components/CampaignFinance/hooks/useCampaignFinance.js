import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * useCampaignFinance — fetches campaign finance summary eagerly,
 * and provides lazy contribution loading for the expanded view.
 *
 * @param {string} politicianId  — politician UUID
 * @param {string|null} cycle    — election cycle string (e.g., "2024")
 * @returns {{
 *   summary: object|null,
 *   contributions: object|null,
 *   loading: boolean,
 *   error: string|null,
 *   dataUpdatedAt: string|null,
 *   fetchContributions: (cursor?: string) => void,
 *   fetchMoreContributions: () => void,
 * }}
 */
export function useCampaignFinance(politicianId, cycle) {
  const [summary, setSummary] = useState(null);
  const [contributions, setContributions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataUpdatedAt, setDataUpdatedAt] = useState(null);

  // Track end_cursor for pagination
  const endCursorRef = useRef(null);

  // Fetch summary eagerly on politicianId / cycle change
  useEffect(() => {
    if (!politicianId || !cycle) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSummary(null);
    setContributions(null);
    endCursorRef.current = null;

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/campaign-finance/politician/${politicianId}/summary?cycle=${cycle}`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const freshness = res.headers.get('X-Data-Updated-At');
        const data = await res.json();
        if (!cancelled) {
          setSummary(data);
          if (freshness) setDataUpdatedAt(freshness);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [politicianId, cycle]);

  // Lazy fetch contributions — called only when user expands the card
  const fetchContributions = useCallback(
    async (cursor = null) => {
      if (!politicianId || !cycle) return;

      try {
        const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
        const res = await fetch(
          `${API_BASE}/campaign-finance/politician/${politicianId}/contributions?cycle=${cycle}&limit=20${cursorParam}`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();

        setContributions((prev) => {
          if (!prev || !cursor) {
            // Initial load or full refresh
            endCursorRef.current = data.page_info?.end_cursor || null;
            return data;
          }
          // Append page
          endCursorRef.current = data.page_info?.end_cursor || null;
          return {
            ...data,
            results: [...(prev.results || []), ...(data.results || [])],
          };
        });
      } catch (err) {
        setError(err.message);
      }
    },
    [politicianId, cycle]
  );

  // Fetch next page using stored end_cursor
  const fetchMoreContributions = useCallback(() => {
    if (endCursorRef.current) {
      fetchContributions(endCursorRef.current);
    }
  }, [fetchContributions]);

  return {
    summary,
    contributions,
    loading,
    error,
    dataUpdatedAt,
    fetchContributions,
    fetchMoreContributions,
  };
}
