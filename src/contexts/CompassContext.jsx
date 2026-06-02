import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchTopics,
  fetchUserAnswers,
  fetchSelectedTopics,
  fetchPoliticiansWithStances,
  fetchUserVerdicts,
  parseCompassFragment,
  convertGuestAnswersToApiFormat,
  saveGuestCompass,
  loadGuestCompass,
  clearGuestCompass,
  saveGuestVerdicts,
  loadGuestVerdicts,
  clearGuestVerdicts,
} from "../lib/compass";
import { extractHashToken, getToken, setToken, apiFetch, publicFetch, clearToken, redirectToLogin, API_BASE } from "../lib/auth";
import { fetchMyRepresentatives } from "../lib/api";
import { evContext } from "@empoweredvote/ev-ui";

const CompassContext = createContext(null);

export function useCompass() {
  return useContext(CompassContext);
}

export function CompassProvider({ children, compassEnabled: initialCompassEnabled = false }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userJurisdiction, setUserJurisdiction] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [politicianIdsWithStances, setPoliticianIdsWithStances] = useState(new Set());
  const [invertedSpokes, setInvertedSpokes] = useState({});
  const [verdicts, setVerdicts] = useState({});
  const [initialTopicId, setInitialTopicId] = useState(null);
  const [compassLoading, setCompassLoading] = useState(true);
  const [myRepresentatives, setMyRepresentatives] = useState(null);
  const [myRepresentativesAddress, setMyRepresentativesAddress] = useState(null);
  const [myLocationNotSet, setMyLocationNotSet] = useState(false);
  const [suggestedSaveAddress, setSuggestedSaveAddress] = useState(null);
  // Tracks whether compass answers + topics have finished loading (independent of compassLoading).
  // compassLoading gates auth/location UI; compassDataLoaded gates the compass chart/calibrate CTA.
  // For logged-in users, compassLoading can become false before loadCompassData() finishes
  // (they run concurrently). CompassCard reads compassDataLoaded to avoid prematurely showing
  // the "Calibrate your compass" prompt while the API fetch is still in flight.
  const [compassDataLoaded, setCompassDataLoaded] = useState(false);

  // Refs so compass load can access auth state without stale closures
  const authedUserRef = useRef(null);
  const compassLoadStartedRef = useRef(false);

  // ── Local Lens state ────────────────────────────────────────────────────
  // The lens default is derived per-office from districtScope (local offices →
  // Local Lens, everything else → the user's regular compass). `lensOverride` is
  // a SESSION-ONLY explicit user choice (null = use the per-office default). It is
  // intentionally NOT persisted to localStorage — a page reload resets to the smart
  // per-office default, which avoids the stale-global-toggle confusion.
  const [lensOverride, setLensOverride] = useState(null); // null | true | false

  // Effective lens for a given office scope. Consumers that know the politician's
  // districtScope (CompassCard, MiniCompass via Results/ElectionsView) call this.
  const getEffectiveLens = useCallback(
    (districtScope) => (lensOverride != null ? lensOverride : districtScope === 'local'),
    [lensOverride]
  );

  // Flip the lens relative to whatever the caller currently sees (its effective value).
  const toggleLens = useCallback((currentEffective) => {
    setLensOverride(!currentEffective);
  }, []);

  // ── Phase 2: compass data (topics, stances, user answers) ──────────────
  const loadCompassData = useCallback(async () => {
    if (compassLoadStartedRef.current) return;
    compassLoadStartedRef.current = true;

    const authedUser = authedUserRef.current;
    const fragment = parseCompassFragment();

    try {
      const topics = await fetchTopics();

      setAllTopics(topics);

      let answers = [];
      let selected = [];
      let inverted = {};

      if (authedUser) {
        // SWR hydrate from authed ev-context slice (compass part)
        // Also kept as fallback if the API returns empty (cross-app calibration case)
        let evCachedAnswers = null;
        try {
          const authedSlice = await evContext.getAuthedSlice(authedUser.id);
          if (authedSlice?.compass?.a && typeof authedSlice.compass.a === 'object') {
            const cached = convertGuestAnswersToApiFormat(authedSlice.compass.a, topics);
            if (cached.length > 0) {
              setUserAnswers(cached);
              if (authedSlice.compass.i && typeof authedSlice.compass.i === 'object') {
                setInvertedSpokes(authedSlice.compass.i);
              }
              evCachedAnswers = {
                answers: cached,
                selected: Array.isArray(authedSlice.compass.s) ? authedSlice.compass.s : [],
                inverted: authedSlice.compass.i && typeof authedSlice.compass.i === 'object' ? authedSlice.compass.i : {},
              };
            }
          }
        } catch { /* broker offline */ }

        const [answersResult, selectedResult] = await Promise.all([
          fetchUserAnswers(),
          fetchSelectedTopics(),
        ]);

        if (answersResult.length === 0) {
          if (evCachedAnswers) {
            // Compass calibrated in another app — API hasn't synced yet but ev-context has it
            if (import.meta.env.DEV) console.log('[CompassContext] priority=ev-context (authed+empty-api, cross-app fallback)', evCachedAnswers);
            answers = evCachedAnswers.answers;
            selected = evCachedAnswers.selected;
            inverted = evCachedAnswers.inverted;
          } else {
            const guestCache = loadGuestCompass();
            if (guestCache) {
              if (import.meta.env.DEV) console.log('[CompassContext] priority=storage (authed+empty-api, guest cache fallback)', { guestCache });
              answers = convertGuestAnswersToApiFormat(guestCache.answers, topics);
              selected = guestCache.selectedTopics;
              inverted = guestCache.invertedSpokes || {};
            } else {
              if (import.meta.env.DEV) console.log('[CompassContext] priority=empty (authed, no api answers, no guest cache)');
              clearGuestCompass();
            }
          }
        } else {
          if (import.meta.env.DEV) console.log('[CompassContext] priority=api (authed, api answers count:', answersResult.length, ')');
          [answers, selected] = [answersResult, selectedResult];
          clearGuestCompass();
          const aMap = {};
          for (const row of answersResult) {
            const t = topics.find((tt) => tt.id === row.topic_id);
            if (t?.short_title) aMap[t.short_title] = row.value ?? 0;
          }
          if (Object.keys(aMap).length > 0) {
            // Only write selected topics (≤8) to ev-context — writing all answers crashes ev-ui (TDZ error)
            const selectedShorts = (Array.isArray(selectedResult) ? selectedResult : [])
              .map((id) => { const t = topics.find((tt) => String(tt.id) === String(id)); return t?.short_title; })
              .filter(Boolean);
            const selectedAMap = {};
            for (const s of selectedShorts) { if (aMap[s] !== undefined) selectedAMap[s] = aMap[s]; }
            const compassPayload = { a: selectedAMap, s: Array.isArray(selectedResult) ? selectedResult : [], i: inverted };
            evContext.get().then((current) => {
              const next = { ...(current || {}), compass: compassPayload };
              evContext.set(next).catch(() => {});
            }).catch(() => {});
            if (authedUser?.id) {
              evContext.setAuthedSlice(authedUser.id, { compass: { a: selectedAMap, i: inverted } }).catch(() => {});
            }
          }
        }
      } else if (fragment) {
        if (fragment.answers !== null) {
          if (import.meta.env.DEV) console.log('[CompassContext] priority=fragment (guest, fresh compass fragment)', { answers: fragment.answers });
          answers = convertGuestAnswersToApiFormat(fragment.answers, topics);
          selected = fragment.selectedTopics;
          inverted = fragment.invertedSpokes || {};
          saveGuestCompass(fragment.answers, fragment.selectedTopics, inverted);
          try {
            const current = await evContext.get();
            const next = { ...(current || {}), compass: { a: fragment.answers, s: fragment.selectedTopics, i: inverted } };
            evContext.set(next).catch(() => {});
          } catch { /* broker offline */ }
        }
      } else {
        let shared = null;
        try { shared = await evContext.get(); } catch { shared = null; }
        const sharedCompass = shared && shared.compass;
        if (sharedCompass && sharedCompass.a && Object.keys(sharedCompass.a).length > 0) {
          if (import.meta.env.DEV) console.log('[CompassContext] priority=ev-context (guest, cross-subdomain shared)', { sharedCompass });
          answers = convertGuestAnswersToApiFormat(sharedCompass.a, topics);
          selected = Array.isArray(sharedCompass.s) ? sharedCompass.s : [];
          inverted = sharedCompass.i || {};
          saveGuestCompass(sharedCompass.a, selected, inverted);
        } else {
          const cached = loadGuestCompass();
          if (cached) {
            if (import.meta.env.DEV) console.log('[CompassContext] priority=storage (guest, loading cached guestCompass)', { cached });
            answers = convertGuestAnswersToApiFormat(cached.answers, topics);
            selected = cached.selectedTopics;
            inverted = cached.invertedSpokes || {};
          } else {
            if (import.meta.env.DEV) console.log('[CompassContext] priority=empty (guest, no fragment, no cached data)');
          }
        }
      }

      // Verdicts
      let newVerdicts = {};
      if (authedUser) {
        newVerdicts = await fetchUserVerdicts();
        clearGuestVerdicts();
      } else if (fragment && Object.keys(fragment.verdicts || {}).length > 0) {
        newVerdicts = fragment.verdicts;
        saveGuestVerdicts(newVerdicts);
      } else {
        newVerdicts = loadGuestVerdicts() || {};
      }

      setUserAnswers(answers);
      setSelectedTopics(selected);
      setInvertedSpokes(inverted);
      setVerdicts(newVerdicts);

      if (fragment?.topicId) {
        const match = topics.find((t) => t.topic_key === fragment.topicId);
        if (match) setInitialTopicId(String(match.id));
      }

      setCompassDataLoaded(true);
    } catch (err) {
      console.error("CompassContext compass load error:", err);
      compassLoadStartedRef.current = false; // allow retry on error
    }
  }, []); // stable — uses only refs and stable setters

  // ── Phase 1: auth + location (always runs on mount) ────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadAuth() {
      try {
        extractHashToken();

        // SSO check — only when no local token exists
        if (!getToken()) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${API_BASE}/auth/session`, {
              credentials: 'include',
              signal: controller.signal,
            });
            clearTimeout(timeout);
            if (res.ok) {
              const data = await res.json();
              if (data.access_token) setToken(data.access_token);
            }
          } catch {
            // Silent fallback
          }
        }

        // Auth check
        const token = getToken();
        let authedUser = null;
        if (token) {
          const authRes = await publicFetch('/account/me');
          if (authRes.status === 401) {
            clearToken();
            // Token expired — retry SSO before giving up (cookie session may still be valid)
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 2000);
              const ssoRes = await fetch(`${API_BASE}/auth/session`, {
                credentials: 'include',
                signal: controller.signal,
              });
              clearTimeout(timeout);
              if (ssoRes.ok) {
                const ssoData = await ssoRes.json();
                if (ssoData.access_token) {
                  setToken(ssoData.access_token);
                  const retryRes = await publicFetch('/account/me');
                  if (retryRes.ok) authedUser = await retryRes.json();
                }
              }
            } catch { /* SSO offline — remain as guest */ }
          } else if (authRes.ok) {
            authedUser = await authRes.json();
          }
        }

        if (authedUser) {
          authedUserRef.current = authedUser;
          loadCompassData();
          if (!cancelled) {
            setIsLoggedIn(true);
            setUserName(authedUser.display_name ?? null);
            if (authedUser.id) setUserId(authedUser.id);
            setUserJurisdiction(authedUser.jurisdiction ?? null);
          }

          // Address-only slice from ev-context (non-compass)
          if (authedUser?.id && !cancelled) {
            try {
              const authedSlice = await evContext.getAuthedSlice(authedUser.id);
              if (authedSlice?.address?.addr && typeof authedSlice.address.addr === 'string') {
                setMyRepresentativesAddress(authedSlice.address.addr);
              }
            } catch { /* broker offline */ }
          }

          // Location fetch (not compass-specific)
          const repsResult = await fetchMyRepresentatives();
          if (!cancelled) {
            if (!repsResult.error && repsResult.data.length > 0) {
              setMyRepresentatives(repsResult.data);
              setMyRepresentativesAddress(repsResult.formattedAddress || null);
              // Mirror address to ev-context
              if (repsResult.formattedAddress) {
                const stateMatch = repsResult.formattedAddress.match(/\b([A-Z]{2})\b\s*\d{5}/);
                const state = stateMatch ? stateMatch[1] : (authedUser?.jurisdiction?.state ?? null);
                if (state) {
                  const addrPayload = { addr: repsResult.formattedAddress, state, ts: Date.now() };
                  evContext.get().then((current) => {
                    const next = { ...(current || {}), address: addrPayload };
                    evContext.set(next).catch(() => {});
                  }).catch(() => {});
                  if (authedUser?.id) {
                    evContext.setAuthedSlice(authedUser.id, { address: addrPayload }).catch(() => {});
                  }
                }
              }
            } else if (repsResult.noLocation) {
              setMyLocationNotSet(true);
              // Surface ev-context address for "Save this address?" prompt
              evContext.get().then((shared) => {
                const a = shared && shared.address;
                if (cancelled || !a || typeof a.addr !== 'string') return;
                setSuggestedSaveAddress({ addr: a.addr, state: a.state || null });
              }).catch(() => {});
            }
          }
        } else {
          // Guest path: load compass answers from ev-context / localStorage / fragment
          // so profile pages show the radar chart without requiring the user to visit
          // the Results page and toggle compass mode first.
          loadCompassData();
        }
      // Always fetch topics + politician stances — needed to render CompassCard on profile
      // pages regardless of whether the user ever enables compass mode on the Results page.
      // Must be awaited so compassLoading=false only fires after politicianIdsWithStances is set.
      await Promise.all([fetchTopics(), fetchPoliticiansWithStances()]).then(([topics, pols]) => {
        if (!cancelled) {
          setAllTopics(topics);
          setPoliticianIdsWithStances(new Set(pols.map((p) => String(p.id))));
        }
      }).catch(() => {});
    } catch (err) {
      console.error("CompassContext auth load error:", err);
    } finally {
        if (!cancelled) {
          setCompassLoading(false);
        }
      }
    }

    loadAuth();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cross-subdomain live-sync — only active after compass data has been loaded
  useEffect(() => {
    if (!compassDataLoaded || isLoggedIn) return;
    const unsub = evContext.subscribe((shared) => {
      const c = shared && shared.compass;
      if (!c || typeof c.a !== 'object' || c.a === null) return;
      if (allTopics.length === 0) {
        try { saveGuestCompass(c.a, Array.isArray(c.s) ? c.s : [], c.i || {}); } catch {}
        return;
      }
      const apiAnswers = convertGuestAnswersToApiFormat(c.a, allTopics);
      setUserAnswers(apiAnswers);
      if (Array.isArray(c.s)) setSelectedTopics(c.s);
      if (c.i && typeof c.i === 'object') setInvertedSpokes(c.i);
      try { saveGuestCompass(c.a, Array.isArray(c.s) ? c.s : [], c.i || {}); } catch {}
    });
    return unsub;
  }, [compassDataLoaded, isLoggedIn, allTopics]);

  const toggleInversion = useCallback((shortTitle) => {
    setInvertedSpokes((prev) => ({ ...prev, [shortTitle]: !prev[shortTitle] }));
  }, []);

  const batchInvertSpokes = useCallback((newMap) => {
    setInvertedSpokes(newMap);
  }, []);

  // Grid-level toggle (CompassControlsBar): force lens across the whole visible grid,
  // or return to the per-office auto default. Active styling reflects lensOverride === true.
  const toggleLocalLens = useCallback(() => {
    setLensOverride((prev) => (prev === true ? null : true));
  }, []);

  const logout = async () => {
    try {
      const token = getToken();
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
    } catch { /* clear local state anyway */ }
    clearToken();
    setIsLoggedIn(false);
    setUserName(null);
    setUserJurisdiction(null);
    setUserAnswers([]);
    setSelectedTopics([]);
    setVerdicts({});
  };

  const value = useMemo(
    () => ({
      isLoggedIn,
      userName,
      userId,
      userJurisdiction,
      userAnswers,
      selectedTopics,
      allTopics,
      invertedSpokes,
      verdicts,
      initialTopicId,
      politicianIdsWithStances,
      compassLoading,
      compassDataLoaded,
      myRepresentatives,
      myRepresentativesAddress,
      myLocationNotSet,
      suggestedSaveAddress,
      dismissSuggestedSaveAddress: () => setSuggestedSaveAddress(null),
      enableCompass: loadCompassData,
      toggleInversion,
      batchInvertSpokes,
      // Global lens state — `localLensActive` reflects an explicit force-on override
      // (used by the grid controls bar styling). Scope-aware consumers should call
      // getEffectiveLens(districtScope) instead of reading localLensActive directly.
      lensOverride,
      localLensActive: lensOverride === true,
      getEffectiveLens,
      toggleLens,
      toggleLocalLens,
      logout,
    }),
    [
      isLoggedIn,
      userName,
      userId,
      userJurisdiction,
      userAnswers,
      selectedTopics,
      allTopics,
      invertedSpokes,
      verdicts,
      initialTopicId,
      politicianIdsWithStances,
      compassLoading,
      compassDataLoaded,
      myRepresentatives,
      myRepresentativesAddress,
      myLocationNotSet,
      suggestedSaveAddress,
      loadCompassData,
      toggleInversion,
      batchInvertSpokes,
      lensOverride,
      getEffectiveLens,
      toggleLens,
      toggleLocalLens,
    ]
  );

  return (
    <CompassContext.Provider value={value}>{children}</CompassContext.Provider>
  );
}
