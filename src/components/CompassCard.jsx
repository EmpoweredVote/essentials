import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { track } from '@empoweredvote/analytics';
import { RadarChartCore, PlaceholderRadar, useMediaQuery } from '@empoweredvote/ev-ui';
import { fetchPoliticianAnswers, fetchResearchStates, researchedTopics, compassCardMode, buildAnswerMapByShortTitle, computeDisplaySpokes, saveLensPending } from '../lib/compass';
import { useCompass } from '../contexts/CompassContext';
import { useTheme } from '../hooks/useTheme';
import LensChipRow from './LensChipRow';
import CategorizedStances from './CategorizedStances';
import CompassIntro from './CompassIntro';
import { API_ORIGIN } from '../lib/apiOrigin';

const COMPASS_URL = import.meta.env.VITE_COMPASS_URL || 'https://compass.empowered.vote';
const MAX_SPOKES = 8;

const CARD_PADDING = 110;
const CARD_CENTER = 250; // size/2 for RadarChartCore size=500

function stanceLabel(shortTitle, value, topics) {
  const topic = topics.find((t) => t.short_title === shortTitle);
  const stances = topic?.stances || [];
  const idx = Math.round(Number(value)) - 1;
  return (idx >= 0 && idx < stances.length) ? (stances[idx].text || shortTitle) : shortTitle;
}

/**
 * CompassCard — profile page section showing compass comparison data.
 *
 * Gates display (compassCardMode): renders for politicians that have stance data,
 * and — breakdown only, no radar — for people Stage 5 researched who have none.
 * Left zone: RadarChartCore dual-overlay (coral user + blue politician).
 * Right zone: CategorizedStances — collapsible issue categories with stance labels, reasoning, and sources.
 *
 * Props:
 *   politicianId    — politician UUID
 *   politicianName  — display name for CTA text
 *   politicianTitle — office title (e.g., "U.S. Senator")
 *
 * The compass comparison honors the shared global lens selection (activeLensKey
 * from CompassContext) — the same one the results/community grid drives.
 */
export default function CompassCard({ politicianId, politicianName, politicianTitle }) {
  const { isDark } = useTheme();
  const {
    isLoggedIn,
    politicianIdsWithStances,
    userAnswers,
    selectedTopics,
    allTopics,
    invertedSpokes,
    toggleInversion,
    batchInvertSpokes,
    verdicts,
    initialTopicId,
    compassLoading,
    compassDataLoaded,
    lenses,
    activeLensKey,
    setActiveLens,
    isLensCalibrated,
  } = useCompass();
  const location = useLocation();
  // Whether any stance category is open in the guest layout (drives the intro's alignment).
  const [stancesOpen, setStancesOpen] = useState(false);
  // Height of the stance list beside the intro, so the intro's size and offset can
  // be set in px — px values transition smoothly where % ↔ rem class swaps jump.
  const [stancesHeight, setStancesHeight] = useState(0);
  const stancesObserver = useRef(null);
  const stancesEl = useRef(null);
  const stancesRef = useCallback((el) => {
    stancesObserver.current?.disconnect();
    stancesEl.current = el;
    if (!el || typeof ResizeObserver === 'undefined') return;
    stancesObserver.current = new ResizeObserver(([entry]) => setStancesHeight(entry.contentRect.height));
    stancesObserver.current.observe(el);
  }, []);
  // Re-measure synchronously when a group opens/closes: the ResizeObserver reports a
  // frame late, and the transition would first head for a target from the stale height.
  useLayoutEffect(() => {
    if (stancesEl.current) setStancesHeight(stancesEl.current.getBoundingClientRect().height);
  }, [stancesOpen]);
  const INTRO_MIN = 448; // 28rem
  const INTRO_MAX = 576; // 36rem
  const introHeight = stancesOpen ? INTRO_MAX : Math.min(INTRO_MAX, Math.max(INTRO_MIN, stancesHeight));
  const introTop = stancesOpen ? 0 : Math.max(0, (Math.max(stancesHeight, introHeight) - introHeight) / 2);
  const isDesktop = useMediaQuery('(min-width: 769px)');

  // Lens is the single, persisted global selection — the SAME one the results/
  // community grid drives (activeLensKey / setActiveLens). Picking a lens here
  // applies everywhere; default 'custom' (Best Match) uses the user's own compass.
  const localLensActive = activeLensKey === 'local';

  // The selected lens's curated topic set defines the comparison spokes
  // ('custom'/Best Match → null, i.e. the user's overlap-based Best Match).
  const activeLens = activeLensKey === 'custom' ? null : (lenses || []).find((l) => l.key === activeLensKey);
  const lensTopicIds = activeLens ? activeLens.topicIds : null;

  // Lens chips for the header row — mirrors the results grid's lensesForRow:
  // 'custom' (Best Match) first, then the API lenses, each annotated with its
  // calibrated flag + topic count so LensChipRow can show the calibrate dialog.
  const lensesForRow = useMemo(() => {
    const custom = {
      key: 'custom',
      name: 'Best Match',
      color: '#FF5740',
      calibrated: (userAnswers?.length ?? 0) >= 3,
      topicCount: 0,
    };
    const named = (lenses || []).map((lens) => ({
      ...lens,
      calibrated: isLensCalibrated(lens, userAnswers),
      topicCount: Array.isArray(lens.topicIds) ? lens.topicIds.length : 0,
    }));
    return [custom, ...named];
  }, [lenses, userAnswers, isLensCalibrated]);

  const handleSelectLens = (key) => {
    track('essentials_compass_lens_selected', { lens: key, context: 'profile' });
    setActiveLens(key);
  };

  // Un-calibrated lens → route to the compass quiz for just that lens's topics,
  // recording the pending key so CompassContext auto-selects it on return (D-12).
  const handleCalibrateLens = (key) => {
    const returnUrl = window.location.href;
    saveLensPending(key);
    window.location.assign(`${COMPASS_URL}/?calibrate=${encodeURIComponent(key)}&return=${encodeURIComponent(returnUrl)}`);
  };

  // A lens whose questions moved under the user. Routes to Compass, where the
  // lens is managed and where the per-topic explanation already lives — this app
  // reports that something changed, it does not host the fix.
  const handleRecalibrateLens = (key) => {
    const returnUrl = window.location.href;
    track('essentials_compass_lens_recalibrate_clicked', { lens: key, context: 'profile' });
    window.location.assign(`${COMPASS_URL}/?return=${encodeURIComponent(returnUrl)}#lens=${encodeURIComponent(key)}`);
  };

  // Topic pool for the comparison + stance breakdown:
  //   • Local Lens ON  → local-scoped topics (the lens is about local issues).
  //   • Local Lens OFF → all topics, so the comparison uses the user's full
  //     default/regular compass (selectedTopics) regardless of the office tier,
  //     and the stance breakdown surfaces every topic this official answered.
  const scopedTopics = useMemo(() => {
    if (allTopics.length === 0) return allTopics;
    if (localLensActive) return allTopics.filter((t) => t.applies_local !== false);
    return allTopics;
  }, [allTopics, localLensActive]);

  const [fetchedAnswers, setPolAnswers] = useState(null);
  const [fetchedLoading, setPolLoading] = useState(true);
  // Stage 5 research states: topics this person was researched on and holds no
  // position on. Fetched once per person and handed to the accordions. `null`
  // while in flight, not `undefined`: StanceAccordion fetches its own copy when
  // the prop is undefined, once per category group. [] on any failure.
  const [researchStates, setResearchStates] = useState(null);

  // Its own effect, keyed on the person only: the answers effect also re-runs
  // when the compass loads, which fetched this twice. Cleared first, so one
  // person's states never show under the next.
  useEffect(() => {
    let cancelled = false;
    setResearchStates(null);
    fetchResearchStates(politicianId).then((states) => {
      if (!cancelled) setResearchStates(states);
    });
    return () => { cancelled = true; };
  }, [politicianId]);
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);

  const hasStances = politicianIdsWithStances.has(politicianId);
  const mode = compassCardMode({ compassLoading, hasStances, scopedTopics, researchStates });
  // Someone researched with no answers has nothing to fetch: the breakdown is their research rows alone.
  const researchOnly = mode === 'research-only';
  const polAnswers = researchOnly ? [] : fetchedAnswers;
  const polLoading = researchOnly ? false : fetchedLoading;

  // Fetch politician answers (hook must be called unconditionally)
  useEffect(() => {
    // Skip fetch if gated out
    if (compassLoading || !politicianIdsWithStances.has(politicianId)) {
      return;
    }

    let cancelled = false;
    setPolLoading(true);

    fetchPoliticianAnswers(politicianId)
      .then((answers) => {
        if (!cancelled) {
          setPolAnswers(answers);
          setPolLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPolAnswers([]);
          setPolLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [politicianId, compassLoading, politicianIdsWithStances]);

  // Compute chart data — must happen before early returns so hooks below are
  // always called in the same order (Rules of Hooks).
  const hasUserCompass = userAnswers && userAnswers.length > 0;
  const returnUrl = window.location.origin + location.pathname + location.search;
  const ctaHref = `${COMPASS_URL}?return=${encodeURIComponent(returnUrl)}`;

  // Build chart data via shared spoke-selection algorithm
  let topicsFiltered = [];
  let polData = {};
  let userData = {};
  let replacedSpokes = {};
  let hasEnoughSpokes = false;

  if (!polLoading && polAnswers !== null && scopedTopics.length > 0 && hasUserCompass) {
    const result = computeDisplaySpokes({
      selectedTopics,
      userAnswers,
      polAnswers,
      scopedTopics,
      maxSpokes: MAX_SPOKES,
      localLensActive,
      lensTopicIds,
    });
    hasEnoughSpokes = result.hasEnoughSpokes;
    replacedSpokes = result.replacedSpokes;

    if (hasEnoughSpokes) {
      const allowedShorts = result.displayTopicIds
        .map((id) => scopedTopics.find((t) => String(t.id) === id)?.short_title)
        .filter(Boolean);

      const { topicsFiltered: polTopics, answersByShort: polMap } = buildAnswerMapByShortTitle(
        scopedTopics,
        polAnswers,
        allowedShorts
      );
      topicsFiltered = polTopics;
      polData = polMap;

      const { answersByShort: userMap } = buildAnswerMapByShortTitle(
        scopedTopics,
        userAnswers,
        allowedShorts
      );
      userData = userMap;
    }
  }

  // Build allPolTopics: ALL topics the politician has answered (for accordion), scoped by tier,
  // then the topics they were researched on with no position (Stage 5) so those rows show too.
  let answeredPolTopics = [];
  if (!polLoading && polAnswers !== null && polAnswers.length > 0 && scopedTopics.length > 0) {
    const polAnsweredIds = new Set(polAnswers.map((a) => String(a.topic_id)));
    answeredPolTopics = scopedTopics.filter((t) => polAnsweredIds.has(String(t.id)));
  }
  const allPolTopics = !polLoading && polAnswers !== null
    ? [...answeredPolTopics, ...researchedTopics(scopedTopics, polAnswers, researchStates)]
    : answeredPolTopics;

  // Plan C: count topics the politician has stances on that the user hasn't answered
  const userAnsweredIds = new Set((userAnswers ?? []).map((a) => String(a.topic_id)));

  // Map of the viewer's own answers (topic_id -> value) so the StanceAccordion
  // can place the "You" dot on the stance spectrum alongside the politician's.
  const userAnswerMap = {};
  (userAnswers ?? []).forEach((a) => { userAnswerMap[String(a.topic_id)] = a.value; });
  const missingTopicCount = answeredPolTopics.filter(
    (t) => !userAnsweredIds.has(String(t.id))
  ).length;

  const hasData = hasEnoughSpokes && topicsFiltered.length > 0;

  // Find nearest circle in screen space, then identify its spoke by angle from chart center
  // (not by radius), and its owner (user vs pol) by fill color. This avoids any radius
  // math that could mismatch due to max-stance differences.
  const HIT_PX = 20;
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || topicsFiltered.length === 0) { setTooltip(null); return; }
    const circles = Array.from(containerRef.current.querySelectorAll('svg circle'));
    let nearest = null;
    let nearestDist = HIT_PX;
    for (const circle of circles) {
      const rect = circle.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2));
      if (d < nearestDist) { nearestDist = d; nearest = circle; }
    }
    if (!nearest) { setTooltip(null); return; }

    // Identify spoke by angle — angle is purely a function of spoke index, not value.
    const svgCx = parseFloat(nearest.getAttribute('cx') ?? '0');
    const svgCy = parseFloat(nearest.getAttribute('cy') ?? '0');
    const spokes = Object.keys(userData);
    const numSpokes = spokes.length;
    const rawAngle = Math.atan2(svgCx - CARD_CENTER, -(svgCy - CARD_CENTER));
    const normAngle = ((rawAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    let shortTitle = null;
    let minDiff = Infinity;
    for (let i = 0; i < numSpokes; i++) {
      const sa = 2 * Math.PI * i / numSpokes;
      const diff = Math.min(Math.abs(normAngle - sa), 2 * Math.PI - Math.abs(normAngle - sa));
      if (diff < minDiff) { minDiff = diff; shortTitle = spokes[i]; }
    }
    if (!shortTitle) { setTooltip(null); return; }

    // Fill color tells us whether this is a user dot (#7C6B9E) or pol dot (#5A9A6E).
    // Yellow (#fed12e) means they match — use pol data (same value either way).
    const fill = (nearest.getAttribute('fill') || '').toLowerCase();
    const val = fill === '#5a9a6e' || fill === '#fed12e' ? polData[shortTitle] : userData[shortTitle];
    if (!val || Number(val) === 0) { setTooltip(null); return; }
    const stanceText = stanceLabel(shortTitle, val, topicsFiltered);
    const rect = nearest.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top, shortTitle, stanceText });
  }, [userData, polData, topicsFiltered]);

  // Gate: wait for compass data (and, for someone with no stances, their research states); show only
  // for politicians with stance data or research rows.
  if (mode === 'wait' || mode === 'hidden') return null;

  // Min/Max batch handlers — operate on what the user currently *sees* (display value),
  // not the raw stored value, so they work correctly on already-inverted spokes.
  function handleStanceMax() {
    track('essentials_compass_stance_alignment_set', { alignment: 'max', context: 'profile' });
    const next = { ...invertedSpokes };
    for (const topic of topicsFiltered) {
      const val = userData[topic.short_title];
      if (!val || val <= 0) continue;
      const isInverted = !!next[topic.short_title];
      const displayVal = isInverted ? 6 - val : val;
      if (displayVal < 3) {
        if (val < 3) next[topic.short_title] = true;
        else delete next[topic.short_title];
      }
    }
    batchInvertSpokes(next);
  }

  function handleStanceMin() {
    track('essentials_compass_stance_alignment_set', { alignment: 'min', context: 'profile' });
    const next = { ...invertedSpokes };
    for (const topic of topicsFiltered) {
      const val = userData[topic.short_title];
      if (!val || val <= 0) continue;
      const isInverted = !!next[topic.short_title];
      const displayVal = isInverted ? 6 - val : val;
      if (displayVal > 3) {
        if (val > 3) next[topic.short_title] = true;
        else delete next[topic.short_title];
      }
    }
    batchInvertSpokes(next);
  }

  // Legend pairs "You" with the politician. Use their name only — the title is
  // already shown in the profile header, and prepending long office titles (e.g.
  // "City Common Council - At Large Flaherty") reads awkwardly. Mirrors the
  // compass feature's ComparePanel, which labels the dot with the name alone.
  const legendLabel = politicianName || politicianTitle || 'Them';

  // Spinner used in both loading states below
  const spinnerTrack = isDark ? '#374151' : '#e2e8f0';
  const spinnerStyle = {
    width: '32px',
    height: '32px',
    border: `3px solid ${spinnerTrack}`,
    borderTopColor: '#00657c',
    borderRadius: '50%',
    animation: 'ev-spin 0.8s linear infinite',
  };

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Compass &amp; Issues
        </h2>
        {/* Lens chip row — the same multi-lens switcher the community/results grid
            uses (Best Match / Local / Federal / Judicial …), driving the shared
            global lens selection. Desktop: chips wrap in this row (icon-only with
            tooltips). Mobile: horizontal-scroll strip with text labels. */}
        {isDesktop ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, minWidth: 0 }}>
            <LensChipRow
              lenses={lensesForRow}
              activeLensKey={activeLensKey}
              onSelectLens={handleSelectLens}
              onCalibrate={handleCalibrateLens}
              onRecalibrate={handleRecalibrateLens}
              isDesktop={isDesktop}
              variant="grouped"
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', maxWidth: '100%' }}>
            <LensChipRow
              lenses={lensesForRow}
              activeLensKey={activeLensKey}
              onSelectLens={handleSelectLens}
              onCalibrate={handleCalibrateLens}
              onRecalibrate={handleRecalibrateLens}
              isDesktop={isDesktop}
              variant="grouped"
            />
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-ev-navy-card rounded-2xl border border-neutral-200 dark:border-[rgba(255,255,255,0.08)] shadow-sm p-6">
        {researchOnly && hasUserCompass ? (
          /* Researched, no answers, viewer has a compass: nothing to compare, so no radar — the
             breakdown alone. A guest still gets the calibrate CTA beside it (below). */
          <CategorizedStances
            topics={allPolTopics}
            polAnswers={polAnswers}
            userAnswerMap={userAnswerMap}
            politicianId={politicianId}
            allTopics={scopedTopics}
            darkMode={isDark}
            apiUrl={API_ORIGIN}
            verdictsByQuote={verdicts}
            initialExpandedTopicId={initialTopicId}
            politicianName={politicianName}
            researchStates={researchStates}
          />
        ) : hasUserCompass ? (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
            {/* Left zone: radar chart. Centered when the card collapses to a single
                column (below lg); fills the radar-width column when two-up. */}
            <div className="flex flex-col items-center lg:items-start">
              {polLoading && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '300px',
                  }}
                >
                  <div style={spinnerStyle} />
                  <style>{`@keyframes ev-spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {!polLoading && !hasData && (
                <div className="flex flex-col items-center py-8 px-4 w-full">
                  <div style={{ opacity: 0.85, marginBottom: '20px' }}>
                    <PlaceholderRadar size={260} name={politicianName} darkMode={isDark} highContrast />
                  </div>

                  <p
                    className="text-center mb-6"
                    style={{ fontSize: '15px', lineHeight: 1.6, color: isDark ? '#9ca3af' : '#6b7280', maxWidth: '22rem' }}
                  >
                    {!hasEnoughSpokes
                      ? 'Not enough shared topics to display a comparison compass.'
                      : `Add more topics to see how you compare with ${politicianName}`}
                  </p>

                  {hasEnoughSpokes && (
                    <a
                      href={ctaHref}
                      className="inline-block px-6 py-2.5 text-white font-semibold rounded-full text-sm transition-colors"
                      style={{ backgroundColor: '#00657c' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#004d5c'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00657c'; }}
                    >
                      Take the Quiz
                    </a>
                  )}
                </div>
              )}

              {!polLoading && hasData && (
                <>
                  {/* Legend */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '4px',
                      fontSize: '15px',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#7C6B9E',
                        }}
                      />
                      <span className="font-semibold text-gray-600 dark:text-gray-300" style={{ fontSize: '15px', fontFamily: "'Manrope', sans-serif" }}>You</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: isDark ? '#6DD28C' : '#5A9A6E',
                        }}
                      />
                      <span className="font-semibold text-gray-600 dark:text-gray-300" style={{ fontSize: '15px', fontFamily: "'Manrope', sans-serif" }}>{legendLabel}</span>
                    </span>
                  </div>

                  {/* Chart container — mouse handlers here so the overlay doesn't block spoke clicks */}
                  <div ref={containerRef} style={{ width: '100%', maxWidth: '700px', overflow: 'hidden', position: 'relative' }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {/* Min / Max buttons */}
                    <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: '4px', zIndex: 11 }}>
                      <button
                        type="button"
                        title="Stance Max — flip any spoke showing 1–2 to its strong side (4–5)"
                        onClick={handleStanceMax}
                        style={{
                          width: 28, height: 28,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 6, border: '1px solid',
                          borderColor: isDark ? '#4b5563' : '#e2e8f0',
                          backgroundColor: isDark ? '#1f2937' : '#fff',
                          color: isDark ? '#d1d5db' : '#4b5563',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {/* Expand / maximize icon */}
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 6V1h5M10 1h5v5M15 10v5h-5M6 15H1v-5"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Stance Min — flip any spoke showing 4–5 to its moderate side (1–2)"
                        onClick={handleStanceMin}
                        style={{
                          width: 28, height: 28,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 6, border: '1px solid',
                          borderColor: isDark ? '#4b5563' : '#e2e8f0',
                          backgroundColor: isDark ? '#1f2937' : '#fff',
                          color: isDark ? '#d1d5db' : '#4b5563',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {/* Compress / minimize icon */}
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 1v5H1M15 6h-5V1M10 15v-5h5M1 10h5v5"/>
                        </svg>
                      </button>
                    </div>
                    <RadarChartCore
                      topics={topicsFiltered}
                      data={userData}
                      compareData={polData}
                      invertedSpokes={invertedSpokes}
                      replacedSpokes={replacedSpokes}
                      boldOriginalSpokes={true}
                      onToggleInversion={toggleInversion}
                      darkMode={isDark}
                      size={500}
                      labelFontSize={16}
                      padding={CARD_PADDING}
                      labelOffset={22}
                      maxLabelLines={3}
                    />
                    {tooltip && createPortal(
                      <div style={{
                        position: 'fixed',
                        left: tooltip.x,
                        top: tooltip.y - 8,
                        transform: 'translateX(-50%)',
                        background: isDark ? '#2a3347' : '#ffffff',
                        border: isDark ? '1px solid #59B0C4' : '1px solid #d1d5db',
                        borderRadius: 8,
                        padding: '6px 11px',
                        lineHeight: 1.45,
                        color: isDark ? '#EBEDEF' : '#111',
                        boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.12)',
                        maxWidth: 220,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        fontFamily: 'Manrope, sans-serif',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 700, textDecoration: 'underline', marginBottom: 2, textTransform: 'capitalize' }}>
                          {tooltip.shortTitle}
                        </div>
                        <div style={{ fontSize: 13 }}>{tooltip.stanceText}</div>
                      </div>,
                      document.body
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right zone: stances grouped into collapsible issue categories — the
                same panel guests see, with the viewer's "You" dot on each spectrum. */}
            <div className="flex flex-col">
              {polLoading || !polAnswers ? (
                <div className="flex items-center justify-center py-8">
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      border: `2px solid ${spinnerTrack}`,
                      borderTopColor: '#00657c',
                      borderRadius: '50%',
                      animation: 'ev-spin 0.8s linear infinite',
                    }}
                  />
                </div>
              ) : allPolTopics.length > 0 ? (
                <CategorizedStances
                  topics={allPolTopics}
                  polAnswers={polAnswers}
                  userAnswerMap={userAnswerMap}
                  politicianId={politicianId}
                  allTopics={scopedTopics}
                  darkMode={isDark}
                  apiUrl={API_ORIGIN}
                  verdictsByQuote={verdicts}
                  initialExpandedTopicId={initialTopicId}
                  collapsedByDefault
                  politicianName={politicianName}
                  researchStates={researchStates}
                />
              ) : null}
            </div>
          </div>
          {!polLoading && missingTopicCount > 0 && (
            <p style={{
              margin: '12px 0 0',
              fontSize: '12px',
              fontFamily: "'Manrope', sans-serif",
              color: isDark ? '#9ca3af' : '#6b7280',
            }}>
              {missingTopicCount} {missingTopicCount === 1 ? 'topic' : 'topics'} not yet in your compass.{' '}
              <a href={ctaHref} style={{ color: isDark ? '#59b0c4' : '#00657c', textDecoration: 'underline' }}>
                Update →
              </a>
            </p>
          )}
          </>
        ) : isLoggedIn && !compassDataLoaded ? (
          /* Logged-in user: answers are still being fetched from the API.
             compassLoading (auth+stances) cleared before loadCompassData() finishes
             because they run concurrently. Show a spinner so the user never sees the
             "Calibrate your compass" CTA while their data is still in flight. */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '120px',
            }}
          >
            <div style={spinnerStyle} />
            <style>{`@keyframes ev-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          /* Guest (or logged-in with genuinely no answers) — 2-column: CTA left, accordion right */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
            {/* Left zone: two-step animated intro (calibrate, then compare). On lg the
                intro is taken out of flow so the stances column sets the row height:
                while every category is closed it spans that column exactly (same top,
                same bottom, centred); once one opens it grows to full size, pinned to
                the top. Height, offset and the zone's min-height are px values driven
                by the measured stance list, so the change animates instead of jumping;
                the min-height easing back also lets the card shrink smoothly on close. */}
            <div
              className="relative flex flex-col items-center lg:min-h-[var(--intro-h)] lg:transition-[min-height] lg:duration-500 lg:ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
              style={{ '--intro-h': `${introHeight}px`, '--intro-top': `${introTop}px` }}
            >
              <div className="w-full lg:absolute lg:inset-x-0 lg:top-[var(--intro-top)] lg:h-[var(--intro-h)] lg:transition-[top,height] lg:duration-500 lg:ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none">
                <CompassIntro politicianName={politicianName} ctaHref={ctaHref} isDark={isDark} />
              </div>
            </div>

            {/* Right zone: stance breakdown accordion */}
            <div className={`flex flex-col ${stancesOpen ? 'justify-start' : 'justify-center'}`}>
              <div ref={stancesRef}>
              {polLoading || !polAnswers ? (
                <div className="flex items-center justify-center py-8">
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      border: `2px solid ${spinnerTrack}`,
                      borderTopColor: '#00657c',
                      borderRadius: '50%',
                      animation: 'ev-spin 0.8s linear infinite',
                    }}
                  />
                </div>
              ) : allPolTopics.length > 0 ? (
                <CategorizedStances
                  topics={allPolTopics}
                  polAnswers={polAnswers}
                  userAnswerMap={userAnswerMap}
                  politicianId={politicianId}
                  allTopics={scopedTopics}
                  darkMode={isDark}
                  apiUrl={API_ORIGIN}
                  verdictsByQuote={verdicts}
                  initialExpandedTopicId={initialTopicId}
                  onOpenChange={setStancesOpen}
                  collapsedByDefault
                  politicianName={politicianName}
                  researchStates={researchStates}
                />
              ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
