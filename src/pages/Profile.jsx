// src/pages/Profile.jsx
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { fetchPolitician } from "../lib/api";
import { RadarChartCore } from "@EmpoweredVote/ev-ui";
import {
  fetchTopics,
  fetchPoliticianAnswers,
  buildAnswerMapByShortTitle,
} from "../lib/compass";

const DEFAULT_SHORT_TITLES = [
  "Abortion",
  "Gun Control",
  "Education",
  "Climate Change",
  "Healthcare",
  "Policing",
];

function Profile() {
  const { id } = useParams();

  // existing state
  const [pol, setPol] = useState({});

  // NEW: chart state
  const [topics, setTopics] = useState([]); // filtered topics (only the 6 defaults)
  const [answersByShort, setAnswersByShort] = useState({}); // { short_title: value }
  const [loadingCompass, setLoadingCompass] = useState(true);
  const [invertedSpokes, setInvertedSpokes] = useState({});
  const inversionKey = `invertedSpokes:pol:${id}`; // per-politician key

  // existing clamp state
  const [expanded, setExpanded] = useState(false);
  const [bioMax, setBioMax] = useState(null);
  const [isClamped, setIsClamped] = useState(false);

  // Refs for layout
  const imgWrapRef = useRef(null);
  const headerRef = useRef(null);
  const bioRef = useRef(null);

  // Fetch politician
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const result = await fetchPolitician(id);
        setPol(result);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [id]);

  // Load inversion for THIS politician
  useEffect(() => {
    try {
      const saved = localStorage.getItem(inversionKey);
      if (saved) setInvertedSpokes(JSON.parse(saved));
    } catch {}
  }, [inversionKey]);

  // Save inversion per politician
  useEffect(() => {
    try {
      localStorage.setItem(inversionKey, JSON.stringify(invertedSpokes));
    } catch {}
  }, [invertedSpokes, inversionKey]);

  // Fetch topics + answers for this politician and build chart data
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingCompass(true);
        const [allTopics, polAnswers] = await Promise.all([
          fetchTopics(),
          fetchPoliticianAnswers(id),
        ]);
        if (cancelled) return;

        const { topicsFiltered, answersByShort } = buildAnswerMapByShortTitle(
          allTopics,
          polAnswers,
          DEFAULT_SHORT_TITLES
        );

        setTopics(topicsFiltered);
        setAnswersByShort(answersByShort);
      } catch (err) {
        console.error("[Profile] compass load failed", err);
        setTopics([]);
        setAnswersByShort({});
      } finally {
        if (!cancelled) setLoadingCompass(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ---- Normalize notes (yours) ----
  const normalizeNotes = (s) =>
    String(s ?? "")
      .replace(/\\r\\n/g, " ")
      .replace(/\r\n/g, " ")
      .replace(/\\n/g, " ")
      .replace(/\\t/g, " ");

  const notes = normalizeNotes(
    pol.notes ??
      `No bio for ${pol.first_name ?? ""} ${pol.last_name ?? ""} yet.`
  );

  const notesClean = String(notes).replace(/\s?\b\d{4}-\d{2}-\d{2}\b\s*$/, "");

  // ---- Helpers: measure & clamp (yours) ----
  const measure = () => {
    const imgEl = imgWrapRef.current;
    const headerEl = headerRef.current;
    const bioEl = bioRef.current;
    if (!imgEl || !headerEl || !bioEl) return { ok: false };

    const imageHeight = imgEl.clientHeight;
    const headerHeight = headerEl.offsetHeight;
    const verticalGaps = 8;
    const available = Math.max(0, imageHeight - headerHeight - verticalGaps);
    return { ok: true, available };
  };

  const applyClamp = () => {
    const { ok, available } = measure();
    if (!ok) return;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    if (!isDesktop) {
      setIsClamped(false);
      setBioMax(null);
      return;
    }

    setBioMax(available);

    if (bioRef.current) {
      const prev = bioRef.current.style.maxHeight;
      bioRef.current.style.maxHeight = "none";
      const natural = bioRef.current.scrollHeight;
      bioRef.current.style.maxHeight = prev;

      const shouldClamp = natural > available;
      setIsClamped(shouldClamp && !expanded);
    }
  };

  useEffect(() => {
    applyClamp();
    let rAF = 0;
    const onResize = () => {
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(applyClamp);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(rAF);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesClean, expanded]);

  const handleImageLoad = () => applyClamp();

  useEffect(() => {
    if (!bioRef.current) return;
    if (expanded) {
      bioRef.current.style.maxHeight = "none";
      setIsClamped(false);
    } else if (bioMax != null) {
      bioRef.current.style.maxHeight = `${bioMax}px`;
    }
  }, [expanded, bioMax]);

  // Toggle inversion by short_title
  const toggleInversion = (shortTitle) =>
    setInvertedSpokes((prev) => ({ ...prev, [shortTitle]: !prev[shortTitle] }));

  return (
    <div>
      {/* top section (yours) */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div ref={imgWrapRef} className="w-32 md:w-64 flex-shrink-0">
          <div className="aspect-[3/4] w-full">
            <img
              src={pol.photo_origin_url}
              alt={`${pol.first_name ?? ""} ${pol.last_name ?? ""} portrait`}
              className="w-full h-full rounded-lg object-cover"
              onLoad={handleImageLoad}
            />
          </div>
        </div>

        <div className="flex flex-col text-left flex-1">
          <div ref={headerRef} className="flex flex-col gap-2">
            <h1 className="text-sky-950 font-bold text-2xl">
              {pol.first_name} {pol.last_name}
            </h1>
            {pol.party && (
              <h2 className="text-sky-900 font-semibold text-lg">
                {pol.party} Party
              </h2>
            )}
          </div>

          <div style={{ height: 8 }} />

          <div
            ref={bioRef}
            className={[
              "relative isolate text-sky-900 whitespace-pre-line",
              "transition-[max-height] duration-300 ease-out",
              isClamped && !expanded
                ? "overflow-hidden after:content-[''] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-10 after:bg-gradient-to-t after:from-white after:to-transparent after:z-0"
                : "",
            ].join(" ")}
            style={{
              maxHeight: !expanded && bioMax != null ? `${bioMax}px` : "none",
            }}
          >
            {notesClean}
          </div>

          {bioMax != null && (isClamped || expanded) && (
            <div className="mt-2 mr-4 flex justify-end">
              <button
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="rounded bg-white px-2 py-1 text-sm font-semibold text-sky-700 hover:underline shadow"
              >
                {expanded ? "See less" : "See more"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow h-px bg-gray-300 mt-6" />

      {/* Compass section */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">
          {pol.first_name} {pol.last_name}&rsquo;s Compass
        </h3>

        {loadingCompass ? (
          <p className="text-gray-600">Loading compass…</p>
        ) : topics.length === 0 ? (
          <p className="text-gray-600">
            No topics available for the default set.
          </p>
        ) : (
          <div className="max-w-xl mx-auto">
            <RadarChartCore
              topics={topics}
              data={answersByShort}
              compareData={{}} // no comparison on profile page (for now)
              invertedSpokes={invertedSpokes}
              onToggleInversion={toggleInversion}
              onReplaceTopic={() => {}} // not used on profile page
              size={420}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
