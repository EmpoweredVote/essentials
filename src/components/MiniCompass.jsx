import { useMemo, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RadarChartCore } from '@empoweredvote/ev-ui';
import { computeDisplaySpokes, buildAnswerMapByShortTitle } from '../lib/compass';

const MAX_SPOKES = 8;
const INNER_SVG_SIZE = 200;
// Mirrors RadarChartCore internals exactly so dot positions match
const RADAR_RADIUS = INNER_SVG_SIZE / 2 - 40; // 60
const CENTER = INNER_SVG_SIZE / 2;             // 100
const HIT_RADIUS_SVG = 20;                    // SVG coordinate units

function adjustedValue(value, shortTitle, invertedSpokes, topics) {
  if (!value || Number(value) === 0) return 0;
  const topic = topics.find((t) => t.short_title === shortTitle);
  const max = topic?.stances?.length || 10;
  const pct = Number(value) / max * 10;
  return invertedSpokes[shortTitle] ? (max + 1) * 10 / max - pct : pct;
}

function stanceLabel(shortTitle, value, topics) {
  const topic = topics.find((t) => t.short_title === shortTitle);
  const stances = topic?.stances || [];
  const idx = Math.round(Number(value)) - 1;
  return (idx >= 0 && idx < stances.length) ? (stances[idx].text || shortTitle) : shortTitle;
}

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
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);

  const { hasEnoughSpokes, topicsFiltered, userData, polData, hasReplacedSpokes, dotPositions } = useMemo(() => {
    const empty = { hasEnoughSpokes: false, topicsFiltered: [], userData: {}, polData: {}, hasReplacedSpokes: false, dotPositions: [] };

    if (!polAnswers || !userAnswers || userAnswers.length === 0 || !scopedTopics || scopedTopics.length === 0) {
      return empty;
    }

    const result = computeDisplaySpokes({
      selectedTopics,
      userAnswers,
      polAnswers,
      scopedTopics,
      maxSpokes: MAX_SPOKES,
      localLensActive,
    });

    if (!result.hasEnoughSpokes) return empty;

    const allowedShorts = result.displayTopicIds
      .map((id) => scopedTopics.find((t) => String(t.id) === id)?.short_title)
      .filter(Boolean);

    const { topicsFiltered: tFiltered, answersByShort: pMap } = buildAnswerMapByShortTitle(scopedTopics, polAnswers, allowedShorts);
    const { answersByShort: uMap } = buildAnswerMapByShortTitle(scopedTopics, userAnswers, allowedShorts);

    // Mirror RadarChartCore's point calculation to know where each dot lands in SVG space
    const inverted = invertedSpokes || {};
    const spokes = Object.entries(uMap);
    const numSpokes = spokes.length;
    const dots = [];

    spokes.forEach(([shortTitle, userVal], i) => {
      const angle = 2 * Math.PI * i / numSpokes;

      if (userVal && Number(userVal) !== 0) {
        const adj = adjustedValue(userVal, shortTitle, inverted, tFiltered);
        const r = adj / 10 * RADAR_RADIUS;
        dots.push({
          shortTitle,
          cx: CENTER + r * Math.sin(angle),
          cy: CENTER - r * Math.cos(angle),
          stanceText: stanceLabel(shortTitle, userVal, tFiltered),
        });
      }

      const polVal = pMap[shortTitle];
      if (polVal && Number(polVal) !== 0) {
        const adj = adjustedValue(polVal, shortTitle, inverted, tFiltered);
        const r = adj / 10 * RADAR_RADIUS;
        dots.push({
          shortTitle,
          cx: CENTER + r * Math.sin(angle),
          cy: CENTER - r * Math.cos(angle),
          stanceText: stanceLabel(shortTitle, polVal, tFiltered),
        });
      }
    });

    return {
      hasEnoughSpokes: true,
      topicsFiltered: tFiltered,
      userData: uMap,
      polData: pMap,
      hasReplacedSpokes: Object.keys(result.replacedSpokes).length > 0,
      dotPositions: dots,
    };
  }, [polAnswers, userAnswers, selectedTopics, scopedTopics, localLensActive, invertedSpokes]);

  const handleMouseMove = useCallback((e) => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg || dotPositions.length === 0) return;
    try {
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const { x: svgX, y: svgY } = pt.matrixTransform(ctm.inverse());

      let nearest = null;
      let nearestDist = HIT_RADIUS_SVG;
      for (const dot of dotPositions) {
        const d = Math.hypot(svgX - dot.cx, svgY - dot.cy);
        if (d < nearestDist) { nearestDist = d; nearest = dot; }
      }
      setTooltip(nearest ? { x: e.clientX, y: e.clientY, ...nearest } : null);
    } catch {
      setTooltip(null);
    }
  }, [dotPositions]);

  if (!hasEnoughSpokes) return null;

  const containerOpacity = hasReplacedSpokes && localLensActive ? 0.7 : 1;

  return (
    <div
      className="mini-compass-host"
      ref={containerRef}
      style={{
        width: size,
        height: 'auto',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: containerOpacity,
        position: 'relative',
      }}
      aria-label="Mini compass"
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
        showLabels={false}
        tightFit={true}
        ringColor="transparent"
        darkMode={!!isDark}
      />
      {/* Transparent overlay captures mouse events — suppresses built-in RadarChartCore SVG tooltip */}
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 10 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      {tooltip && createPortal(
        <div style={{
          position: 'fixed',
          left: tooltip.x + 14,
          top: tooltip.y - 14,
          background: isDark ? '#2a3347' : '#ffffff',
          border: isDark ? '1px solid #59B0C4' : '1px solid #d1d5db',
          borderRadius: 8,
          padding: '6px 11px',
          lineHeight: 1.45,
          color: isDark ? '#EBEDEF' : '#111',
          boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.12)',
          maxWidth: 200,
          zIndex: 9999,
          pointerEvents: 'none',
          fontFamily: 'Manrope, sans-serif',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textDecoration: 'underline', marginBottom: 2, textTransform: 'capitalize' }}>
            {tooltip.shortTitle}
          </div>
          <div style={{ fontSize: 12 }}>{tooltip.stanceText}</div>
        </div>,
        document.body
      )}
    </div>
  );
}
