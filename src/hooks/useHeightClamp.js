// src/hooks/useHeightClamp.js
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Height-based clamping for a text block that should visually match an image column.
 * Measures (image wrapper height - header block height - gap) and applies max-height to the bio.
 *
 * Usage:
 *  const clamp = useHeightClamp({ gap: 8, enabledMediaQuery: "(min-width: 768px)" });
 *  <div ref={clamp.imgWrapRef}>...img...</div>
 *  <div ref={clamp.headerRef}>...name/party...</div>
 *  <BioClamp text={notes} hook={clamp} />
 */
export function useHeightClamp(options = {}) {
  const { gap = 8, enabledMediaQuery = "(min-width: 768px)" } = options;

  const imgWrapRef = useRef(null);
  const headerRef = useRef(null);
  const bioRef = useRef(null);

  const [expanded, setExpanded] = useState(false);
  const [bioMax, setBioMax] = useState(null); // px
  const [isClamped, setIsClamped] = useState(false); // only true when overflow exists and not expanded

  // Compute available height for bio
  const measure = useCallback(() => {
    const imgEl = imgWrapRef.current;
    const headerEl = headerRef.current;
    const bioEl = bioRef.current;
    if (!imgEl || !headerEl || !bioEl) return { ok: false };

    const imageHeight = imgEl.clientHeight;
    const headerHeight = headerEl.offsetHeight;
    const available = Math.max(0, imageHeight - headerHeight - gap);
    return { ok: true, available };
  }, [gap]);

  const applyClamp = useCallback(() => {
    const res = measure();
    if (!res.ok) return;

    const isEnabled =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia(enabledMediaQuery).matches;

    if (!isEnabled) {
      setIsClamped(false);
      setBioMax(null);
      return;
    }

    const available = res.available;
    setBioMax(available);

    // Assess overflow: measure natural height without max-height
    const bioEl = bioRef.current;
    if (bioEl) {
      const prev = bioEl.style.maxHeight;
      bioEl.style.maxHeight = "none";
      const natural = bioEl.scrollHeight;
      bioEl.style.maxHeight = prev;

      const shouldClamp = natural > available;
      setIsClamped(shouldClamp && !expanded);
    }
  }, [enabledMediaQuery, expanded, measure]);

  // Keep inline style in sync with state
  useEffect(() => {
    const el = bioRef.current;
    if (!el) return;

    if (expanded) {
      el.style.maxHeight = "none";
      setIsClamped(false);
    } else if (bioMax != null) {
      el.style.maxHeight = `${bioMax}px`;
      // isClamped is set in applyClamp()
    } else {
      el.style.maxHeight = "none";
    }
  }, [expanded, bioMax]);

  useEffect(() => {
    applyClamp();
  }, [expanded]);

  // Recompute on resize (debounced via rAF)
  useEffect(() => {
    let rAF = 0;
    const onResize = () => {
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(applyClamp);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize, { passive: true });
    }
    return () => {
      cancelAnimationFrame(rAF);
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", onResize);
      }
    };
  }, [applyClamp]);

  // Public handler for image load (images report their height after loading)
  const onImageLoad = useCallback(() => {
    applyClamp();
  }, [applyClamp]);

  // Expose a method to force remeasure when content changes (e.g., after data fetch)
  const remeasure = useCallback(() => {
    applyClamp();
  }, [applyClamp]);

  return {
    // refs to attach
    imgWrapRef,
    headerRef,
    bioRef,
    // state
    expanded,
    setExpanded,
    isClamped,
    bioMax,
    // handlers
    onImageLoad,
    remeasure,
  };
}
