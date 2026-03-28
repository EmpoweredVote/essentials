import { useState, useEffect, useRef } from "react";
import { searchPoliticiansByName } from "../lib/api";

/**
 * Debounced politician name search hook.
 *
 * @param {string} query - The search query string
 * @returns {{ results: Array, phase: string }} results and phase ("idle" | "loading" | "fresh" | "error")
 */
export function useNameSearch(query) {
  const [results, setResults] = useState([]);
  const [phase, setPhase] = useState("idle");

  const controllerRef = useRef(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setPhase("idle");
      setResults([]);
      return;
    }

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    const timer = setTimeout(async () => {
      setPhase("loading");
      try {
        const data = await searchPoliticiansByName(query.trim(), controller.signal);
        if (controller.signal.aborted) return;
        setResults(data);
        setPhase("fresh");
      } catch (err) {
        if (err.name === "AbortError") return;
        setPhase("error");
        setResults([]);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { results, phase };
}
