import { useState, useEffect, useRef } from "react";
import { searchPoliticians } from "../lib/api";

const EMPTY_ARRAY = [];
let instanceCounter = 0;

/**
 * Custom hook for fetching politician data.
 *
 * All queries (ZIP codes, cities, addresses) go through the unified
 * POST /essentials/candidates/search endpoint. The backend handles
 * area vs point detection and returns results synchronously.
 *
 * @param {string} query - ZIP code, city name, or address
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Gate to prevent fetching (default: true)
 * @param {Array} options.initialData - Pre-populated data from sessionStorage (default: [])
 * @param {number} options.key - Increment to force re-fetch even when query is unchanged (default: 0)
 *
 * @returns {Object} { data, phase, error, dataStatus, formattedAddress, tribalLand, locality }
 * - data: Array of politicians
 * - phase: "idle" | "loading" | "fresh" | "error"
 * - error: Error message string or null
 * - dataStatus: "fresh" | "no-geofence-data" | null
 * - formattedAddress: Backend-validated formatted address string
 * - tribalLand: { on_reservation, name? } | null
 * - locality: { incorporated: boolean|null, place_name: string|null, county_name: string|null } | null
 */
export function usePoliticianData(query, options = {}) {
  const {
    enabled = true,
    initialData = EMPTY_ARRAY,
    key = 0,
  } = options;

  const [data, setData] = useState(initialData);
  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState(null);
  const [dataStatus, setDataStatus] = useState(null);
  const [formattedAddress, setFormattedAddress] = useState("");
  // SCHEMA-03 (Phase 133 D-09): tribal_land surfaces from /address-search response
  // shape (`{ on_reservation, name? }`). Undefined when backend returns legacy flat
  // politicians array.
  const [tribalLand, setTribalLand] = useState(null);
  // LOC-04 (Phase 216-03): locality surfaces from /candidates/search response shape
  // (`{ incorporated, place_name, county_name }`), mirroring tribalLand. Address
  // mode only — coordinate mode never enables this hook (see Results.jsx coordLocality).
  const [locality, setLocality] = useState(null);

  const controllerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !query) {
      setPhase("idle");
      setError(null); // clear any stale error so it can't leak into a later browse/locality view
      setFormattedAddress("");
      return;
    }

    // Abort any previous in-flight request
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    const id = ++instanceCounter;
    console.log(`[usePoliticianData] #${id} starting for query="${query}" key=${key}`);

    async function fetchData() {
      try {
        setError(null);
        setFormattedAddress("");
        setTribalLand(null);
        setLocality(null);
        setData(initialData);
        setPhase("loading");

        const result = await searchPoliticians(query);

        if (controller.signal.aborted) return;

        if (result.error) {
          setError(result.error);
          setPhase("error");
          return;
        }

        setData(Array.isArray(result.data) ? result.data : []);
        setDataStatus(result.status || "fresh");
        setFormattedAddress(result.formattedAddress || "");
        // SCHEMA-03 (Phase 133 D-09): expose tribal_land for badge rendering.
        setTribalLand(result.tribal_land || null);
        // LOC-04 (Phase 216-03): expose locality for the "Unincorporated {County}" banner label.
        setLocality(result.locality || null);
        setPhase("fresh");
        console.log(`[usePoliticianData] #${id} complete — ${(result.data || []).length} officials`);
      } catch (err) {
        if (err.name === "AbortError") {
          console.log(`[usePoliticianData] #${id} aborted`);
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
  }, [query, enabled, key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, phase, error, dataStatus, formattedAddress, tribalLand, locality };
}
