import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

export function CompassProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userJurisdiction, setUserJurisdiction] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [politicianIdsWithStances, setPoliticianIdsWithStances] = useState(
    new Set()
  );
  const [invertedSpokes, setInvertedSpokes] = useState({});
  const [verdicts, setVerdicts] = useState({});
  const [initialTopicId, setInitialTopicId] = useState(null);
  const [compassLoading, setCompassLoading] = useState(true);
  const [myRepresentatives, setMyRepresentatives] = useState(null);
  const [myRepresentativesAddress, setMyRepresentativesAddress] = useState(null);
  const [myLocationNotSet, setMyLocationNotSet] = useState(false);
  // Address found in ev-context for an authed user who has no saved API location.
  // Pages can render a "Save this as your address?" prompt from this signal.
  const [suggestedSaveAddress, setSuggestedSaveAddress] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        // 1. Extract Bearer token from URL hash if present (synchronous — must happen first
        //    so the token is in localStorage before any apiFetch calls)
        extractHashToken();

        // 2. Check for URL fragment (highest priority — fresh bridge data from CompassV2)
        //    Must be synchronous and happen before any async calls so the fragment is
        //    available when we decide which data source to use.
        const fragment = parseCompassFragment();

        // 3. SSO check — only when no local token exists
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
            // Silent fallback — no cookie or network error
          }
        }

        // 4. Auth check — only attempt if we have a token
        const token = getToken();
        let authedUser = null;

        if (token) {
          const authRes = await publicFetch('/account/me');
          if (authRes.status === 401) {
            clearToken();
          } else if (authRes.ok) {
            const authData = await authRes.json();
            authedUser = authData;
          }
        }

        // 5. Public data (topics + politician stances) — always fetched
        const [topics, polsWithStances] = await Promise.all([
          fetchTopics(),
          fetchPoliticiansWithStances(),
        ]);

        if (!cancelled) {
          setAllTopics(topics);
          setPoliticianIdsWithStances(
            new Set(polsWithStances.map((p) => String(p.id)))
          );
        }

        // 6. User-specific data — priority: logged-in API > fragment > localStorage cache > empty
        let answers = [];
        let selected = [];
        let inverted = {};

        if (authedUser) {
          // Logged-in path: fetch from API, clear any guest cache
          if (!cancelled) {
            setIsLoggedIn(true);
            setUserName(authedUser.display_name ?? null);
            // Capture userId for authed ev-context slice (260426-mc5).
            if (authedUser.id) setUserId(authedUser.id);
            setUserJurisdiction(authedUser.jurisdiction ?? null);
          }
          // Authed SWR hydrate (260426-mc5): before the API responds, seed
          // local state from the userId-stamped authed slice so the compass /
          // address render instantly. The API fetch below replaces these
          // values silently — API always wins on conflict.
          if (authedUser?.id && !cancelled) {
            try {
              const authedSlice = await evContext.getAuthedSlice(authedUser.id);
              if (authedSlice?.compass?.a && typeof authedSlice.compass.a === 'object') {
                const cached = convertGuestAnswersToApiFormat(authedSlice.compass.a, topics);
                if (cached.length > 0) setUserAnswers(cached);
                if (authedSlice.compass.i && typeof authedSlice.compass.i === 'object') {
                  setInvertedSpokes(authedSlice.compass.i);
                }
              }
              if (authedSlice?.address?.addr && typeof authedSlice.address.addr === 'string') {
                setMyRepresentativesAddress(authedSlice.address.addr);
              }
            } catch { /* broker offline — fall through to API */ }
          }

          const [answersResult, selectedResult, repsResult] = await Promise.all([
            fetchUserAnswers(),
            fetchSelectedTopics(),
            fetchMyRepresentatives(),
          ]);
          if (!cancelled && !repsResult.error && repsResult.data.length > 0) {
            setMyRepresentatives(repsResult.data);
            setMyRepresentativesAddress(repsResult.formattedAddress || null);
            // Mirror API-saved address to ev-context so other apps (read-rank,
            // compass) see the canonical value even before this user signed up.
            // API > ev-context: overwrite the guest entry so the apps converge.
            if (repsResult.formattedAddress) {
              const stateMatch = repsResult.formattedAddress.match(/\b([A-Z]{2})\b\s*\d{5}/);
              const state = stateMatch ? stateMatch[1] : (authedUser?.jurisdiction?.state ?? null);
              if (state) {
                const addrPayload = { addr: repsResult.formattedAddress, state, ts: Date.now() };
                evContext.get().then((current) => {
                  const next = { ...(current || {}), address: addrPayload };
                  evContext.set(next).catch(() => {});
                }).catch(() => {});
                // Authed mirror (260426-mc5): also stamp under userId-keyed slice
                // so cross-subdomain hydration for this user is namespaced.
                if (authedUser?.id) {
                  evContext.setAuthedSlice(authedUser.id, { address: addrPayload }).catch(() => {});
                }
              }
            }
          } else if (!cancelled && repsResult.noLocation) {
            setMyLocationNotSet(true);
            // Authed user with no saved location yet: surface ev-context address
            // via suggestedSaveAddress so pages can offer to save it to the account.
            evContext.get().then((shared) => {
              const a = shared && shared.address;
              if (cancelled || !a || typeof a.addr !== 'string') return;
              setSuggestedSaveAddress({ addr: a.addr, state: a.state || null });
            }).catch(() => {});
          }
          if (answersResult.length === 0) {
            // API has no answers — fall back to guest cache so returning calibrated guests
            // see their compass overlay even before they've saved API answers (INTG-01 fix).
            const guestCache = loadGuestCompass();
            if (guestCache) {
              if (import.meta.env.DEV) {
                console.log('[CompassContext] priority=storage (authed+empty-api, guest cache fallback)', { guestCache });
              }
              answers = convertGuestAnswersToApiFormat(guestCache.answers, topics);
              selected = guestCache.selectedTopics;
              inverted = guestCache.invertedSpokes || {};
              // Preserve guest cache — don't clear, user may return without fragment
            } else {
              if (import.meta.env.DEV) {
                console.log('[CompassContext] priority=empty (authed, no api answers, no guest cache)');
              }
              clearGuestCompass();
            }
          } else {
            if (import.meta.env.DEV) {
              console.log('[CompassContext] priority=api (authed, api answers count:', answersResult.length, ')');
            }
            [answers, selected] = [answersResult, selectedResult];
            clearGuestCompass(); // Has API answers — clean separation
            // Mirror API compass to ev-context so other apps see canonical state.
            // Convert API rows back to {short_title: value} format.
            const aMap = {};
            for (const row of answersResult) {
              const t = topics.find((tt) => tt.id === row.topic_id);
              if (t?.short_title) aMap[t.short_title] = row.value ?? 0;
            }
            if (Object.keys(aMap).length > 0) {
              const compassPayload = { a: aMap, s: Array.isArray(selectedResult) ? selectedResult : [], i: {} };
              evContext.get().then((current) => {
                const next = { ...(current || {}), compass: compassPayload };
                evContext.set(next).catch(() => {});
              }).catch(() => {});
              // Authed mirror (260426-mc5): per D-01 we exclude `s` (selectedTopics)
              // from the authed slice — only answers/inverted/writeIns.
              if (authedUser?.id) {
                evContext.setAuthedSlice(authedUser.id, {
                  compass: { a: aMap, i: {} },
                }).catch(() => {});
              }
            }
          }
        } else if (fragment) {
          // Guest with fresh fragment: convert to API format and cache for future visits
          // Guard: fragment.answers may be null if user came from Read & Rank without CompassV2
          if (fragment.answers !== null) {
            if (import.meta.env.DEV) {
              console.log('[CompassContext] priority=fragment (guest, fresh compass fragment)', { answers: fragment.answers });
            }
            answers = convertGuestAnswersToApiFormat(fragment.answers, topics);
            selected = fragment.selectedTopics;
            inverted = fragment.invertedSpokes || {};
            saveGuestCompass(fragment.answers, fragment.selectedTopics, inverted);
            // Push fragment data to ev-context broker so other subdomains pick it up
            try {
              const current = await evContext.get();
              const next = { ...(current || {}), compass: {
                a: fragment.answers, s: fragment.selectedTopics, i: inverted,
              }};
              evContext.set(next).catch(() => {});
            } catch { /* broker offline — fragment still works locally */ }
          }
          // Note: verdicts from fragment are handled separately in the verdicts block below
        } else {
          // Guest without fragment: try cross-subdomain ev-context broker first,
          // then fall back to same-origin localStorage cache.
          let shared = null;
          try { shared = await evContext.get(); } catch { shared = null; }
          const sharedCompass = shared && shared.compass;
          if (sharedCompass && sharedCompass.a && Object.keys(sharedCompass.a).length > 0) {
            if (import.meta.env.DEV) {
              console.log('[CompassContext] priority=ev-context (guest, cross-subdomain shared)', { sharedCompass });
            }
            answers = convertGuestAnswersToApiFormat(sharedCompass.a, topics);
            selected = Array.isArray(sharedCompass.s) ? sharedCompass.s : [];
            inverted = sharedCompass.i || {};
            saveGuestCompass(sharedCompass.a, selected, inverted);
          } else {
            const cached = loadGuestCompass();
            if (cached) {
              if (import.meta.env.DEV) {
                console.log('[CompassContext] priority=storage (guest, loading cached guestCompass)', { cached });
              }
              answers = convertGuestAnswersToApiFormat(cached.answers, topics);
              selected = cached.selectedTopics;
              inverted = cached.invertedSpokes || {};
            } else {
              if (import.meta.env.DEV) {
                console.log('[CompassContext] priority=empty (guest, no fragment, no cached data)');
              }
            }
          }
        }

        // Verdict priority: API > fragment > localStorage > empty
        let newVerdicts = {};
        if (authedUser) {
          newVerdicts = await fetchUserVerdicts();
          clearGuestVerdicts();
        } else if (fragment && Object.keys(fragment.verdicts || {}).length > 0) {
          // Guest with fresh verdict fragment
          newVerdicts = fragment.verdicts;
          saveGuestVerdicts(newVerdicts);
        } else {
          // Guest without fragment: try localStorage cache
          newVerdicts = loadGuestVerdicts() || {};
        }

        if (!cancelled) {
          setUserAnswers(answers);
          setSelectedTopics(selected);
          setInvertedSpokes(inverted);
          setVerdicts(newVerdicts);
          // Deep-link: resolve topic_key from fragment to the UUID used by StanceAccordion rows
          if (fragment?.topicId) {
            const match = topics.find((t) => t.topic_key === fragment.topicId);
            if (match) setInitialTopicId(String(match.id));
          }
        }
      } catch (err) {
        console.error("CompassContext load error:", err);
      } finally {
        if (!cancelled) {
          setCompassLoading(false);
        }
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cross-subdomain live-sync via ev-context broker: when the user updates
  // their compass on any other EV subdomain (compass.*, readrank.*, etc.),
  // we apply it locally without requiring a refresh. Guest only —
  // logged-in users use API as source of truth.
  useEffect(() => {
    if (isLoggedIn) return;
    const unsub = evContext.subscribe((shared) => {
      const c = shared && shared.compass;
      if (!c || typeof c.a !== 'object' || c.a === null) return;
      if (allTopics.length === 0) {
        // Topics not loaded yet — cache the raw payload so initial load picks it up
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
  }, [isLoggedIn, allTopics]);

  const logout = async () => {
    try {
      const token = getToken();
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // Network error — clear local state anyway
    }
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
      myRepresentatives,
      myRepresentativesAddress,
      myLocationNotSet,
      suggestedSaveAddress,
      dismissSuggestedSaveAddress: () => setSuggestedSaveAddress(null),
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
      myRepresentatives,
      myRepresentativesAddress,
      myLocationNotSet,
      suggestedSaveAddress,
    ]
  );

  return (
    <CompassContext.Provider value={value}>{children}</CompassContext.Provider>
  );
}
