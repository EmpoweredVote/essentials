import { useMemo } from 'react';
import { RadarChartCore } from '@empoweredvote/ev-ui';
import { computeDisplaySpokes, buildAnswerMapByShortTitle } from '../lib/compass';

const MAX_SPOKES = 8;
// RadarChartCore internal coordinate size — CSS-constrains the container to `size` (default 120px).
// Do NOT set to 120: at that size, tooltip foreignObjects (190px wide) and hit-dots (r=14) dominate
// the chart geometry. Pass 200, let the CSS container shrink it.
const INNER_SVG_SIZE = 200;

/**
 * MiniCompass — label-free radar chart tile for ElectionsView candidate cards.
 *
 * Pure-presentational: no useState, no useEffect, no data fetching.
 * Returns null silently when fewer than 3 bilateral spokes are available.
 *
 * Props:
 *   userAnswers      — [{ topic_id, value }, ...] from CompassContext
 *   polAnswers       — [{ topic_id, value }, ...] or null when not yet fetched
 *   selectedTopics   — string[] of topic UUIDs from CompassContext
 *   scopedTopics     — topic objects pre-filtered to the race's districtScope (parent provides)
 *   invertedSpokes   — { [short_title]: boolean } from CompassContext
 *   localLensActive  — boolean: whether Local Lens preset is active
 *   isDark           — boolean: dark mode flag
 *   size             — outer container px (default 120); SVG is CSS-scaled inside
 */
export default function MiniCompass({
  userAnswers,
  polAnswers,
  selectedTopics,
  scopedTopics,
  invertedSpokes,
  localLensActive,
  isDark,
  size = 120,
}) {
  const { hasEnoughSpokes, topicsFiltered, userData, polData, hasReplacedSpokes } = useMemo(() => {
    if (
      !polAnswers ||
      !userAnswers ||
      userAnswers.length === 0 ||
      !scopedTopics ||
      scopedTopics.length === 0
    ) {
      return { hasEnoughSpokes: false, topicsFiltered: [], userData: {}, polData: {}, hasReplacedSpokes: false };
    }

    const result = computeDisplaySpokes({
      selectedTopics,
      userAnswers,
      polAnswers,
      scopedTopics,
      maxSpokes: MAX_SPOKES,
      localLensActive,
    });

    if (!result.hasEnoughSpokes) {
      return { hasEnoughSpokes: false, topicsFiltered: [], userData: {}, polData: {}, hasReplacedSpokes: false };
    }

    const allowedShorts = result.displayTopicIds
      .map((id) => scopedTopics.find((t) => String(t.id) === id)?.short_title)
      .filter(Boolean);

    const { topicsFiltered: tFiltered, answersByShort: pMap } = buildAnswerMapByShortTitle(
      scopedTopics,
      polAnswers,
      allowedShorts
    );
    const { answersByShort: uMap } = buildAnswerMapByShortTitle(
      scopedTopics,
      userAnswers,
      allowedShorts
    );

    return {
      hasEnoughSpokes: true,
      topicsFiltered: tFiltered,
      userData: uMap,
      polData: pMap,
      hasReplacedSpokes: Object.keys(result.replacedSpokes).length > 0,
    };
  }, [polAnswers, userAnswers, selectedTopics, scopedTopics, localLensActive]);

  // Silent absence — no placeholder, no error, just nothing
  if (!hasEnoughSpokes) return null;

  // Replacement-spoke visual distinction: lower container opacity only when Lens is ON.
  // When Lens is OFF, replacements are normal user-selected fallbacks (no distinction needed).
  const containerOpacity = hasReplacedSpokes && localLensActive ? 0.7 : 1;

  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: containerOpacity,
        borderRadius: '50%',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'}`,
        boxSizing: 'border-box',
        padding: 4,
        overflow: 'hidden',
      }}
      aria-label="Mini compass"
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <RadarChartCore
          topics={topicsFiltered}
          data={userData}
          compareData={polData}
          invertedSpokes={invertedSpokes || {}}
          replacedSpokes={{}}
          boldOriginalSpokes={false}
          onToggleInversion={() => {}}
          onReplaceTopic={() => {}}
          size={INNER_SVG_SIZE}
          labelFontSize={0}
          padding={10}
          labelOffset={0}
          tightFit={true}
          darkMode={!!isDark}
        />
      </div>
    </div>
  );
}
