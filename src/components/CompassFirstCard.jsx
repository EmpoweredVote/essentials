import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadarChartCore } from '@chrisandrewsedu/ev-ui';
import { useCompass } from '../contexts/CompassContext';
import { buildAnswerMapByShortTitle } from '../lib/compass';
import IconOverlay from './IconOverlay';

/**
 * Variant configuration for CompassFirstCard.
 * Exported so the Prototype page can access gridCols for the grid wrapper.
 */
export const VARIANT_CONFIG = {
  A: {
    radarSize: 200,
    gridCols: 'grid-cols-1 md:grid-cols-2',
    padding: '16px',
    borderRadius: '12px',
    shadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    nameFontSize: '18px',
    titleFontSize: '14px',
    titleWeight: 600,
    titleLineClamp: 2,
    horizontal: false,
  },
  B: {
    radarSize: 150,
    gridCols: 'grid-cols-2 sm:grid-cols-3',
    padding: '12px',
    borderRadius: '10px',
    shadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
    nameFontSize: '16px',
    titleFontSize: '12px',
    titleWeight: 400,
    titleLineClamp: 1,
    horizontal: false,
  },
  C: {
    radarSize: 140,
    gridCols: 'grid-cols-1',
    padding: '16px',
    borderRadius: '12px',
    shadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    nameFontSize: '18px',
    titleFontSize: '14px',
    titleWeight: 600,
    titleLineClamp: 2,
    horizontal: true,
  },
};

/**
 * PlaceholderRadar — dashed octagon SVG for politicians with no mock data.
 * Renders at the same dimensions as a live radar to keep cards uniform (D-09).
 */
function PlaceholderRadar({ size = 200, name = '' }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.65;
  const n = 8;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    return `${cx + r * Math.sin(a)},${cy - r * Math.cos(a)}`;
  }).join(' ');
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={name ? `${name} — compass data unavailable` : 'compass data unavailable'}
      style={{ backgroundColor: '#F5F9FA', borderRadius: '4px', flexShrink: 0 }}
    >
      <polygon
        points={pts}
        fill="none"
        stroke="#D3D7DE"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
    </svg>
  );
}

/**
 * CompassFirstCard — compass-first politician card where the radar chart is
 * the visual anchor. Supports 3 layout variants (A/B/C) controlled by `variant` prop.
 *
 * Props:
 *   politician   — { id, full_name, office_title, branch, ballot, hasStances }
 *   mockAnswers  — { [short_title]: number } | null (from mockCompassData.js)
 *   variant      — 'A' | 'B' | 'C'
 */
export default function CompassFirstCard({ politician, mockAnswers, variant = 'A' }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const {
    allTopics,
    userAnswers,
    compassLoading,
    invertedSpokes,
  } = useCompass();

  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.A;
  const { radarSize, padding, borderRadius, shadow, nameFontSize, titleFontSize,
    titleWeight, titleLineClamp, horizontal } = config;

  // Build user answer map for dual overlay (coral layer — user data)
  let topicsFiltered = [];
  let userAnswerMap = {};

  if (!compassLoading && allTopics.length > 0) {
    const allowedShorts = allTopics
      .filter(t => t.is_active !== false)
      .map(t => t.short_title);

    const { topicsFiltered: tf, answersByShort } = buildAnswerMapByShortTitle(
      allTopics,
      userAnswers || [],
      allowedShorts
    );
    topicsFiltered = tf;
    userAnswerMap = answersByShort;
  }

  // Navigation handlers
  const handleClick = () => navigate(`/politician/${politician.id}`);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/politician/${politician.id}`);
    }
  };

  // Card shadow — hover upgrades to cardHover
  const hoverShadow = '0 12px 32px -4px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.04)';
  const focusShadow = '0 0 0 2px #FFFFFF, 0 0 0 4px #00657C';

  const cardStyle = {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius,
    padding,
    boxShadow: focused
      ? focusShadow
      : hovered
        ? hoverShadow
        : shadow,
    cursor: 'pointer',
    transition: 'box-shadow 200ms ease',
    display: 'flex',
    flexDirection: horizontal ? 'row' : 'column',
    alignItems: horizontal ? 'center' : 'stretch',
    gap: horizontal ? '16px' : '0',
    minHeight: '44px',
    outline: 'none',
  };

  // Radar area — either live RadarChartCore or placeholder
  const radarNode = !compassLoading && mockAnswers ? (
    <div style={{ flexShrink: 0, overflow: 'hidden', width: radarSize, height: radarSize }}>
      <RadarChartCore
        topics={topicsFiltered}
        data={userAnswerMap}
        compareData={mockAnswers}
        invertedSpokes={{}}
        onToggleInversion={() => {}}
        onReplaceTopic={() => {}}
        size={radarSize}
        labelFontSize={0}
        padding={0}
        labelOffset={0}
      />
    </div>
  ) : (
    <PlaceholderRadar size={radarSize} name={politician.full_name} />
  );

  // Text/icon content area
  const titleMinHeight = titleLineClamp === 2 ? '2.5rem' : '1.25rem';

  const contentNode = (
    <div
      style={{
        flex: horizontal ? 1 : undefined,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: horizontal ? 'center' : undefined,
        marginTop: horizontal ? 0 : '8px',
      }}
    >
      {/* Politician name */}
      <p
        style={{
          fontSize: nameFontSize,
          fontWeight: 600,
          lineHeight: 1.4,
          fontFamily: "'Manrope', sans-serif",
          textAlign: horizontal ? 'left' : 'center',
          color: '#1a202c',
          margin: 0,
          marginBottom: '4px',
        }}
      >
        {politician.full_name}
      </p>

      {/* Office title */}
      <p
        style={{
          fontSize: titleFontSize,
          fontWeight: titleWeight,
          lineHeight: 1.4,
          fontFamily: "'Manrope', sans-serif",
          color: '#4a5568',
          textAlign: horizontal ? 'left' : 'center',
          margin: 0,
          minHeight: titleMinHeight,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: titleLineClamp,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {politician.office_title || ''}
      </p>

      {/* Icon overlay row — wrapped in relative container so IconOverlay's
          absolute position anchors to this box, not the card root. */}
      {(politician.ballot || mockAnswers || politician.branch) && (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: horizontal ? 'flex-start' : 'center',
            marginTop: '8px',
            height: '28px',
          }}
        >
          {/* Inner relative anchor for IconOverlay's bottom:4/right:4 */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <IconOverlay
              ballot={politician.ballot || null}
              hasStances={Boolean(mockAnswers)}
              branch={politician.branch || null}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      role="article"
      aria-label={`${politician.full_name}, ${politician.office_title || ''}`}
      tabIndex={0}
      style={cardStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {/* Radar — centered on vertical variants, left-side on horizontal */}
      {!horizontal && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {radarNode}
        </div>
      )}
      {horizontal && radarNode}

      {contentNode}
    </div>
  );
}
