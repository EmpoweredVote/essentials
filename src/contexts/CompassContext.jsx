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

const API = import.meta.env.VITE_API_URL || "/api";

const CompassContext = createContext(null);

export function useCompass() {
  return useContext(CompassContext);
}

export function CompassProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState(null);
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

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        // 1. Check for URL fragment (highest priority — fresh bridge data from CompassV2)
        //    Must be synchronous and happen before any async calls so the fragment is
        //    available when we decide which data source to use.
        const fragment = parseCompassFragment();

        // 2. Auth check
        const authRes = await fetch(`${API}/auth/me`, { credentials: "include" });

        // 3. Public data (topics + politician stances) — always fetched
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

        // 4. User-specific data — priority: logged-in API > fragment > localStorage cache > empty
        let answers = [];
        let selected = [];
        let inverted = {};

        if (authRes.ok) {
          // Logged-in path: fetch from API, clear any guest cache
          const authData = await authRes.json();
          if (!cancelled) {
            setIsLoggedIn(true);
            setUserName(authData.username ?? null);
          }
          [answers, selected] = await Promise.all([
            fetchUserAnswers(),
            fetchSelectedTopics(),
          ]);
          clearGuestCompass(); // Clean separation: logged-in = API only
        } else if (fragment) {
          // Guest with fresh fragment: convert to API format and cache for future visits
          // Guard: fragment.answers may be null if user came from Read & Rank without CompassV2
          if (fragment.answers !== null) {
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
            answers = convertGuestAnswersToApiFormat(cached.answers, topics);
            selected = cached.selectedTopics;
            inverted = cached.invertedSpokes || {};
          }
        }

        // Verdict priority: API > fragment > localStorage > empty
        let newVerdicts = {};
        if (authRes.ok) {
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

  const value = useMemo(
    () => ({
      isLoggedIn,
      userName,
      userAnswers,
      selectedTopics,
      allTopics,
      invertedSpokes,
      verdicts,
      initialTopicId,
      politicianIdsWithStances,
      compassLoading,
    }),
    [
      isLoggedIn,
      userName,
      userAnswers,
      selectedTopics,
      allTopics,
      invertedSpokes,
      verdicts,
      initialTopicId,
      politicianIdsWithStances,
      compassLoading,
    ]
  );

  return (
    <CompassContext.Provider value={value}>{children}</CompassContext.Provider>
  );
}
