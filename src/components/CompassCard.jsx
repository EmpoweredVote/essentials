import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { RadarChartCore, StanceAccordion, ExpandCompassNudge } from '@empoweredvote/ev-ui';
import { fetchPoliticianAnswers, buildAnswerMapByShortTitle } from '../lib/compass';
import { useCompass } from '../contexts/CompassContext';

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
  const {
    politicianIdsWithStances,
    userAnswers,
    selectedTopics,
    allTopics,
    invertedSpokes,
    toggleInversion,
    verdicts,
    initialTopicId,
    compassLoading,
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

  // Build chart data using the spec §2 spoke-selection algorithm
  let topicsFiltered = [];
  let polData = {};
  let userData = {};
  let replacedSpokes = {};
  let hasEnoughSpokes = true;

  if (!polLoading && polAnswers !== null && scopedTopics.length > 0 && hasUserCompass) {
    const polAnsweredSet = new Set(polAnswers.filter((a) => a.value > 0).map((a) => String(a.topic_id)));
    const userAnsweredSet = new Set(userAnswers.map((a) => String(a.topic_id)));

    let displayTopicIds = [];
    const newReplacedSpokes = {};

    if (selectedTopics && selectedTopics.length > 0) {
      const topicById = new Map(scopedTopics.map((t) => [String(t.id), t]));
      const selectedTopicSet = new Set(selectedTopics.map(String));

      // Replacement pool: scoped topics not in user's selected set where both parties have answered
      const replacementPool = scopedTopics.filter((t) =>
        !selectedTopicSet.has(String(t.id)) &&
        userAnsweredSet.has(String(t.id)) &&
        polAnsweredSet.has(String(t.id))
      );
      let ri = 0;

      for (const id of selectedTopics) {
        const t = topicById.get(String(id));
        if (!t) continue;

        const userHas = userAnsweredSet.has(String(id));
        const polHas = polAnsweredSet.has(String(id));

        if (userHas && polHas) {
          displayTopicIds.push(String(id));
        } else if (ri < replacementPool.length) {
          // Either side is missing an answer — replace with a topic both have covered
          const sub = replacementPool[ri++];
          displayTopicIds.push(String(sub.id));
          newReplacedSpokes[sub.short_title] = true;
        }
        // else: no replacement available — spoke dropped
      }
    } else {
      // Fallback: topics where both user and pol have answered
      displayTopicIds = scopedTopics
        .filter((t) => userAnsweredSet.has(String(t.id)) && polAnsweredSet.has(String(t.id)))
        .map((t) => String(t.id));
    }

    // Cap at MAX_SPOKES
    if (displayTopicIds.length > MAX_SPOKES) {
      displayTopicIds = displayTopicIds.slice(0, MAX_SPOKES);
    }

    hasEnoughSpokes = displayTopicIds.length >= 3;
    replacedSpokes = newReplacedSpokes;

    if (hasEnoughSpokes) {
      const allowedShorts = displayTopicIds
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

                  {/* Chart container — responsive, fills left column */}
                  <div style={{ width: '100%', overflow: 'hidden' }}>
                    <RadarChartCore
                      topics={topicsFiltered}
                      data={userData}
                      compareData={polData}
                      invertedSpokes={invertedSpokes}
                      replacedSpokes={replacedSpokes}
                      boldOriginalSpokes={true}
                      onToggleInversion={toggleInversion}
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
            <ExpandCompassNudge
              politicianName={politicianName}
              missingCount={missingTopicCount}
              compassUrl={ctaHref}
            />
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
