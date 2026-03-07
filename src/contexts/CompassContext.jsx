import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchTopics,
  fetchUserAnswers,
  fetchSelectedTopics,
  fetchPoliticiansWithStances,
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
  const [compassLoading, setCompassLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        // Auth check — always runs
        const authRes = await fetch(`${API}/auth/me`, {
          credentials: "include",
        });

        // Compass data — always runs (topics + politician stances are public)
        const [topics, polsWithStances] = await Promise.all([
          fetchTopics(),
          fetchPoliticiansWithStances(),
        ]);

        // User-specific data — only if logged in
        let answers = [];
        let selected = [];
        if (authRes.ok) {
          const authData = await authRes.json();
          if (!cancelled) {
            setIsLoggedIn(true);
            setUserName(authData.username ?? null);
          }
          [answers, selected] = await Promise.all([
            fetchUserAnswers(),
            fetchSelectedTopics(),
          ]);
        }

        if (!cancelled) {
          setAllTopics(topics);
          setPoliticianIdsWithStances(
            new Set(polsWithStances.map((p) => String(p.id)))
          );
          setUserAnswers(answers);
          setSelectedTopics(selected);
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
      politicianIdsWithStances,
      compassLoading,
    }),
    [
      isLoggedIn,
      userName,
      userAnswers,
      selectedTopics,
      allTopics,
      politicianIdsWithStances,
      compassLoading,
    ]
  );

  return (
    <CompassContext.Provider value={value}>{children}</CompassContext.Provider>
  );
}
