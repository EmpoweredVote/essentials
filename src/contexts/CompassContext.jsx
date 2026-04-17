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

const CompassContext = createContext(null);

export function useCompass() {
  return useContext(CompassContext);
}

export function CompassProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState(null);
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
            setUserJurisdiction(authedUser.jurisdiction ?? null);
          }
          const [answersResult, selectedResult, repsResult] = await Promise.all([
            fetchUserAnswers(),
            fetchSelectedTopics(),
            fetchMyRepresentatives(),
          ]);
          if (!cancelled && !repsResult.error && repsResult.data.length > 0) {
            setMyRepresentatives(repsResult.data);
            setMyRepresentativesAddress(repsResult.formattedAddress || null);
          } else if (!cancelled && repsResult.noLocation) {
            setMyLocationNotSet(true);
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
          }
          // Note: verdicts from fragment are handled separately in the verdicts block below
        } else {
          // Guest without fragment: try localStorage cache
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
      logout,
    }),
    [
      isLoggedIn,
      userName,
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
    ]
  );

  return (
    <CompassContext.Provider value={value}>{children}</CompassContext.Provider>
  );
}
