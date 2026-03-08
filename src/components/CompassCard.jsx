import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { RadarChartCore } from '@chrisandrewsedu/ev-ui';
import { fetchPoliticianAnswers, buildAnswerMapByShortTitle } from '../lib/compass';
import { useCompass } from '../contexts/CompassContext';

const COMPASS_URL = import.meta.env.VITE_COMPASS_URL || 'https://compass.empowered.vote';
const MAX_SPOKES = 8;

/**
 * CompassCard — profile page section showing compass comparison data.
 *
 * Gates display: only renders for politicians that have stance data.
 * Left zone: RadarChartCore dual-overlay (coral user + blue politician).
 * Right zone: skeleton placeholder (Phase 71 fills with stance breakdown).
 *
 * Props:
 *   politicianId    — politician UUID
 *   politicianName  — display name for CTA text
 *   politicianTitle — office title (e.g., "U.S. Senator")
 */
export default function CompassCard({ politicianId, politicianName, politicianTitle }) {
  const {
    politicianIdsWithStances,
    userAnswers,
    selectedTopics,
    allTopics,
    invertedSpokes,
    compassLoading,
  } = useCompass();
  const location = useLocation();

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

  // Build chart data from intersection of user + politician answers
  let topicsFiltered = [];
  let polData = {};
  let userData = {};

  if (!polLoading && polAnswers !== null && allTopics.length > 0 && hasUserCompass) {
    // Determine which short_titles to display
    let allowedShorts;

    if (selectedTopics && selectedTopics.length > 0) {
      // Preserve user's chosen topic order
      const topicById = new Map(allTopics.map((t) => [String(t.id), t]));
      allowedShorts = selectedTopics
        .map((id) => topicById.get(String(id)))
        .filter(Boolean)
        .map((t) => t.short_title);
    } else {
      // Fall back to topics the politician answered
      const answeredTopicIds = new Set(polAnswers.map((a) => String(a.topic_id)));
      allowedShorts = allTopics
        .filter((t) => answeredTopicIds.has(String(t.id)))
        .map((t) => t.short_title);
    }

    // Intersection: only topics where BOTH user AND politician have answers
    const userAnsweredIds = new Set(userAnswers.map((a) => String(a.topic_id)));
    const polAnsweredIds = new Set(polAnswers.map((a) => String(a.topic_id)));
    const topicByShortLower = new Map(allTopics.map((t) => [t.short_title.toLowerCase(), t]));

    allowedShorts = allowedShorts.filter((s) => {
      const topic = topicByShortLower.get(s.toLowerCase());
      if (!topic) return false;
      return userAnsweredIds.has(String(topic.id)) && polAnsweredIds.has(String(topic.id));
    });

    // Cap at MAX_SPOKES
    if (allowedShorts.length > MAX_SPOKES) {
      allowedShorts = allowedShorts.slice(0, MAX_SPOKES);
    }

    if (allowedShorts.length > 0) {
      const { topicsFiltered: polTopics, answersByShort: polMap } = buildAnswerMapByShortTitle(
        allTopics,
        polAnswers,
        allowedShorts
      );

      topicsFiltered = polTopics;
      polData = polMap;

      const { answersByShort: userMap } = buildAnswerMapByShortTitle(
        allTopics,
        userAnswers,
        allowedShorts
      );
      userData = userMap;
    }
  }

  const hasData = topicsFiltered.length > 0;

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

      <div className="bg-white rounded-xl shadow-sm p-6">
        {hasUserCompass ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                /* Zero overlap: user has compass but no shared topics with politician */
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
                    Add more topics to see how you compare with {politicianName}
                  </p>

                  <a
                    href={ctaHref}
                    className="inline-block px-6 py-2.5 text-white font-semibold rounded-lg text-sm transition-colors"
                    style={{ backgroundColor: '#00657c' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#004d5c'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00657c'; }}
                  >
                    Take the Quiz
                  </a>
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
                          backgroundColor: '#ff5740',
                        }}
                      />
                      <span style={{ fontWeight: 600, color: '#4a5568' }}>You</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#59b0c4',
                        }}
                      />
                      <span style={{ fontWeight: 600, color: '#4a5568' }}>{legendLabel}</span>
                    </span>
                  </div>

                  {/* Chart container — responsive, fills left column */}
                  <div style={{ width: '100%', overflow: 'hidden' }}>
                    <RadarChartCore
                      topics={topicsFiltered}
                      data={userData}
                      compareData={polData}
                      invertedSpokes={invertedSpokes}
                      size={400}
                      labelFontSize={18}
                      padding={40}
                      labelOffset={14}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Right zone: breakdown placeholder (Phase 71) */}
            <div className="flex flex-col justify-center gap-3">
              <div className="h-4 bg-gray-100 animate-pulse rounded w-full" />
              <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
              <div className="h-4 bg-gray-100 animate-pulse rounded w-5/6" />
              <div className="h-4 bg-gray-100 animate-pulse rounded w-2/3" />
              <div className="h-4 bg-gray-100 animate-pulse rounded w-4/5" />
            </div>
          </div>
        ) : (
          /* CTA fallback — user has no compass data */
          <div className="flex flex-col items-center py-8 px-4">
            {/* Greyed-out compass SVG icon */}
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
              Take the Quiz
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
