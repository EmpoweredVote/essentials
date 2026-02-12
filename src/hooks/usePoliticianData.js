import { useState, useEffect, useRef } from "react";
import { fetchPoliticiansOnce, searchPoliticians } from "../lib/api";

const EMPTY_ARRAY = [];
let instanceCounter = 0;

/**
 * Custom hook for fetching politician data.
 *
 * For ZIP codes: Calls the data endpoint directly. The backend returns stale/cached
 * data immediately (200) or signals warming-in-progress (202). Retries with backoff
 * on 202 responses. No cache-status polling needed.
 *
 * For addresses: Calls searchPoliticians directly without polling.
 *
 * @param {string} query - ZIP code or address query
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Gate to prevent fetching (default: true)
 * @param {number} options.maxRetries - Max retries on 202 warming responses (default: 6)
 * @param {Array} options.initialData - Pre-populated data from sessionStorage (default: [])
 *
 * @returns {Object} { data, phase, error, dataStatus }
 * - data: Array of politicians
 * - phase: "idle" | "warming" | "loading" | "fresh" | "error"
 * - error: Error message string or null
 * - dataStatus: "fresh" | "stale" | "warmed" | null
 */
export function usePoliticianData(query, options = {}) {
  const {
    enabled = true,
    maxRetries = 6,
    initialData = EMPTY_ARRAY,
  } = options;

  const [data, setData] = useState(initialData);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState(null);
  const [dataStatus, setDataStatus] = useState(null);

  const controllerRef = useRef(null);

  // Store config in refs so they don't trigger effect re-runs
  const configRef = useRef({ maxRetries, initialData });
  configRef.current = { maxRetries, initialData };

  useEffect(() => {
    if (!enabled || !query) {
      setPhase("idle");
      return;
    }

    // Abort any previous in-flight request
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;
    const signal = controller.signal;

    const id = ++instanceCounter;
    console.log(`[usePoliticianData] effect #${id} starting for query="${query}"`);

    async function fetchData() {
      const { maxRetries: max, initialData: initial } = configRef.current;

      try {
        setError(null);

        const isZip = /^\d{5}$/.test(query);

        if (isZip) {
          setData(initial);
          setPhase("loading");

          for (let attempt = 0; attempt <= max; attempt++) {
            if (signal.aborted) {
              console.log(`[usePoliticianData] #${id} aborted at attempt ${attempt}`);
              return;
            }

            console.log(`[usePoliticianData] #${id} fetch attempt ${attempt}`);
            const result = await fetchPoliticiansOnce(query, attempt);

            if (signal.aborted) return;

            if (result.status === "warming") {
              setPhase("warming");
              if (attempt >= max) break;
              // Backoff: use Retry-After from server, with min 2s and max 8s
              const delay = Math.min(Math.max((result.retryAfter || 3) * 1000, 2000), 8000);
              const jitter = Math.random() * 500;
              await new Promise((resolve) => setTimeout(resolve, delay + jitter));
              continue;
            }

            if (result.status === "error") {
              setError(result.error || "Failed to fetch politicians");
              setPhase("error");
              return;
            }

            // Success — status is "fresh", "stale", or "warmed"
            setData(Array.isArray(result.data) ? result.data : []);
            setDataStatus(result.status || "fresh");
            setPhase("fresh");
            console.log(`[usePoliticianData] #${id} complete — status=${result.status}`);
            return;
          }

          // Exhausted retries
          setError("Request timed out. The server may still be fetching data - please try again in a moment.");
          setPhase("error");
          console.log(`[usePoliticianData] #${id} timed out after ${max} retries`);
        } else {
          // Address search
          setPhase("loading");
          const result = await searchPoliticians(query);
          if (signal.aborted) return;

          if (result.error) {
            setError(result.error);
            setPhase("error");
            return;
          }

          setData(Array.isArray(result.data) ? result.data : []);
          setDataStatus(result.status || "fresh");
          setPhase("fresh");
        }
      } catch (err) {
        if (err.name === "AbortError") {
          console.log(`[usePoliticianData] #${id} aborted (AbortError)`);
          return;
        }
        console.log(`[usePoliticianData] #${id} error: ${err.message}`);
        setError(err.message);
        setPhase("error");
      }
    }

    fetchData();

    return () => {
      console.log(`[usePoliticianData] #${id} cleanup — aborting`);
      controller.abort();
    };
    // Only query and enabled should trigger re-runs.
    // Config values are read from ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, enabled]);

  return { data, phase, error, dataStatus };
}
