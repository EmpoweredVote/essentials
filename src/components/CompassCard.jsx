import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { RadarChartCore, StanceAccordion } from '@empoweredvote/ev-ui';
import { fetchPoliticianAnswers, buildAnswerMapByShortTitle, computeDisplaySpokes } from '../lib/compass';
import { useCompass } from '../contexts/CompassContext';
import { useTheme } from '../hooks/useTheme';

const COMPASS_URL = import.meta.env.VITE_COMPASS_URL || 'https://compass.empowered.vote';
const MAX_SPOKES = 8;

/**
 * CompassCard — profile page section showing compass comparison data.
 *
 * Gates display: only renders for politicians that have stance data.
 * Left zone: RadarChartCore dual-overlay (coral user + blue politician).
 * Right zone: StanceAccordion with topic stance labels, reasoning, and sources.
 *
 * Props:
 *   politicianId    — politician UUID
 *   politicianName  — display name for CTA text
 *   politicianTitle — office title (e.g., "U.S. Senator")
 *   districtScope   — 'local' | 'state' | 'federal' | 'judicial' | null (filters topics shown)
 */
export default function CompassCard({ politicianId, politicianName, politicianTitle, districtScope }) {
  const { isDark } = useTheme();
  const {
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
    localLensActive,
  } = useCompass();
  const location = useLocation();

  // Derive scope-filtered topics. If districtScope is not provided, use all topics (no filter).
  const scopedTopics = useMemo(() => {
    if (!districtScope || allTopics.length === 0) return allTopics;
    const key = districtScope === 'local'    ? 'applies_local'
              : districtScope === 'state'    ? 'applies_state'
              : districtScope === 'judicial' ? 'applies_judicial'
              : 'applies_federal';
    return allTopics.filter((t) => t[key] !== false);
  }, [allTopics, districtScope]);

  const [polAnswers, setPolAnswers] = useState(null);
  const [polLoading, setPolLoading] = useState(true);

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

  // Gate: wait for compass data to load
  if (compassLoading) return null;

  // Gate: only show for politicians with stance data
  if (!politicianIdsWithStances.has(politicianId)) return null;

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

  // Build allPolTopics: ALL topics the politician has answered (for accordion), scoped by tier
  let allPolTopics = [];
  if (!polLoading && polAnswers !== null && polAnswers.length > 0 && scopedTopics.length > 0) {
    const polAnsweredIds = new Set(polAnswers.map((a) => String(a.topic_id)));
    allPolTopics = scopedTopics.filter((t) => polAnsweredIds.has(String(t.id)));
  }

  // Plan C: count topics the politician has stances on that the user hasn't answered
  const userAnsweredIds = new Set((userAnswers ?? []).map((a) => String(a.topic_id)));
  const missingTopicCount = allPolTopics.filter(
    (t) => !userAnsweredIds.has(String(t.id))
  ).length;

  const hasData = hasEnoughSpokes && topicsFiltered.length > 0;

  // Min/Max batch handlers — operate on what the user currently *sees* (display value),
  // not the raw stored value, so they work correctly on already-inverted spokes.
  function handleStanceMax() {
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

  // Build legend name: "[Position] [Last Name]"
  const lastName = politicianName ? politicianName.split(' ').pop() : '';
  const legendLabel = politicianTitle
    ? `${politicianTitle} ${lastName}`
    : politicianName || '';

  return (
    <section className="mt-8">
      <h2
        className="text-2xl font-bold mb-4"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Compass &amp; Issues
      </h2>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
        {hasUserCompass ? (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
            {/* Left zone: radar chart */}
            <div className="flex flex-col items-start">
              {polLoading && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '300px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid #e2e8f0',
                      borderTopColor: '#00657c',
                      borderRadius: '50%',
                      animation: 'ev-spin 0.8s linear infinite',
                    }}
                  />
                  <style>{`@keyframes ev-spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {!polLoading && !hasData && (
                <div className="flex flex-col items-center py-8 px-4">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ opacity: 0.25, marginBottom: '16px' }}
                  >
                    <polygon
                      points="12,1 21.5,6.5 21.5,17.5 12,23 2.5,17.5 2.5,6.5"
                      fill="none"
                      stroke="#00657c"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <line x1="12" y1="12" x2="12" y2="1" stroke="#00657c" strokeWidth="1" />
                    <line x1="12" y1="12" x2="21.5" y2="6.5" stroke="#00657c" strokeWidth="1" />
                    <line x1="12" y1="12" x2="21.5" y2="17.5" stroke="#00657c" strokeWidth="1" />
                    <line x1="12" y1="12" x2="12" y2="23" stroke="#00657c" strokeWidth="1" />
                    <line x1="12" y1="12" x2="2.5" y2="17.5" stroke="#00657c" strokeWidth="1" />
                    <line x1="12" y1="12" x2="2.5" y2="6.5" stroke="#00657c" strokeWidth="1" />
                    <polygon
                      points="12,4 18,7.5 18,16 12,19.5 7,15 5,8"
                      fill="#00657c"
                      opacity="0.35"
                    />
                    <polygon
                      points="12,4 18,7.5 18,16 12,19.5 7,15 5,8"
                      fill="none"
                      stroke="#00657c"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <p
                    className="text-gray-500 text-center mb-6"
                    style={{ fontSize: '15px', lineHeight: 1.6 }}
                  >
                    {!hasEnoughSpokes
                      ? 'Not enough shared topics to display a comparison compass.'
                      : `Add more topics to see how you compare with ${politicianName}`}
                  </p>

                  {hasEnoughSpokes && (
                    <a
                      href={ctaHref}
                      className="inline-block px-6 py-2.5 text-white font-semibold rounded-lg text-sm transition-colors"
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
                          backgroundColor: '#5A9A6E',
                        }}
                      />
                      <span className="font-semibold text-gray-600 dark:text-gray-300" style={{ fontSize: '15px', fontFamily: "'Manrope', sans-serif" }}>{legendLabel}</span>
                    </span>
                  </div>

                  {/* Chart container — position:relative so Min/Max buttons can overlay */}
                  <div style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
                    {/* Min / Max buttons */}
                    <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: '4px', zIndex: 10 }}>
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
                      labelFontSize={14}
                      padding={90}
                      labelOffset={18}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Right zone: stance breakdown accordion */}
            <div className="flex flex-col">
              {polLoading || !polAnswers ? (
                <div className="flex items-center justify-center py-8">
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid #e2e8f0',
                      borderTopColor: '#00657c',
                      borderRadius: '50%',
                      animation: 'ev-spin 0.8s linear infinite',
                    }}
                  />
                </div>
              ) : (
                <StanceAccordion
                  topics={topicsFiltered.length > 0 ? topicsFiltered : allPolTopics}
                  polAnswers={polAnswers}
                  politicianId={politicianId}
                  allTopics={scopedTopics}
                  expandedTopics={topicsFiltered.length > 0 ? allPolTopics : undefined}
                  apiUrl={import.meta.env.VITE_API_URL}
                  verdictsByQuote={verdicts}
                  initialExpandedTopicId={initialTopicId}
                />
              )}
            </div>
          </div>
          {!polLoading && missingTopicCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '14px 16px',
                marginTop: '16px',
                backgroundColor: '#F5F9FA',
                borderRadius: '10px',
                border: '1px solid #e0e6eb',
                fontFamily: "'Manrope', sans-serif",
                flexWrap: 'wrap',
              }}
            >
              <p style={{ margin: 0, fontSize: '14px', color: '#4a5568' }}>
                <span style={{ fontWeight: 600, color: '#2d3748' }}>{missingTopicCount} new {missingTopicCount === 1 ? 'topic' : 'topics'} available</span>
                {' '}— {politicianName ? `${politicianName} has stances on topics added since you last calibrated.` : 'Stances on topics added since you last calibrated.'}
              </p>
              <a
                href={ctaHref}
                style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  backgroundColor: '#00657c',
                  color: '#ffffff',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Update my compass →
              </a>
            </div>
          )}
          </>
        ) : (
          /* Guest fallback — 2-column: CTA left, accordion right */
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
            {/* Left zone: CTA with compass icon */}
            <div className="flex flex-col items-center py-8 px-4">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                style={{ opacity: 0.25, marginBottom: '16px' }}
              >
                <polygon
                  points="12,1 21.5,6.5 21.5,17.5 12,23 2.5,17.5 2.5,6.5"
                  fill="none"
                  stroke="#00657c"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <line x1="12" y1="12" x2="12" y2="1" stroke="#00657c" strokeWidth="1" />
                <line x1="12" y1="12" x2="21.5" y2="6.5" stroke="#00657c" strokeWidth="1" />
                <line x1="12" y1="12" x2="21.5" y2="17.5" stroke="#00657c" strokeWidth="1" />
                <line x1="12" y1="12" x2="12" y2="23" stroke="#00657c" strokeWidth="1" />
                <line x1="12" y1="12" x2="2.5" y2="17.5" stroke="#00657c" strokeWidth="1" />
                <line x1="12" y1="12" x2="2.5" y2="6.5" stroke="#00657c" strokeWidth="1" />
                <polygon
                  points="12,4 18,7.5 18,16 12,19.5 7,15 5,8"
                  fill="#00657c"
                  opacity="0.35"
                />
                <polygon
                  points="12,4 18,7.5 18,16 12,19.5 7,15 5,8"
                  fill="none"
                  stroke="#00657c"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>

              <p
                className="text-gray-500 text-center mb-6"
                style={{ fontSize: '15px', lineHeight: 1.6 }}
              >
                Calibrate your compass to see how you align with {politicianName}
              </p>

              <a
                href={ctaHref}
                className="inline-block px-6 py-2.5 text-white font-semibold rounded-lg text-sm transition-colors"
                style={{ backgroundColor: '#00657c' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#004d5c'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00657c'; }}
              >
                Calibrate your compass
              </a>
            </div>

            {/* Right zone: stance breakdown accordion */}
            <div className="flex flex-col">
              {polLoading || !polAnswers ? (
                <div className="flex items-center justify-center py-8">
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid #e2e8f0',
                      borderTopColor: '#00657c',
                      borderRadius: '50%',
                      animation: 'ev-spin 0.8s linear infinite',
                    }}
                  />
                </div>
              ) : allPolTopics.length > 0 ? (
                <StanceAccordion
                  topics={allPolTopics.slice(0, 4)}
                  polAnswers={polAnswers}
                  politicianId={politicianId}
                  allTopics={scopedTopics}
                  expandedTopics={allPolTopics.length > 4 ? allPolTopics : undefined}
                  apiUrl={import.meta.env.VITE_API_URL}
                  verdictsByQuote={verdicts}
                  initialExpandedTopicId={initialTopicId}
                />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
