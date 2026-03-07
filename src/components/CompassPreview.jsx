import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RadarChartCore } from '@chrisandrewsedu/ev-ui';
import { fetchPoliticianAnswers, buildAnswerMapByShortTitle } from '../lib/compass';

/**
 * CompassPreview — tooltip/popover with a mini radar chart for a politician.
 *
 * Props:
 *   politicianId   — politician UUID to fetch answers for
 *   politicianName — display name for the header
 *   allTopics      — from CompassContext
 *   userAnswers    — from CompassContext (may be empty)
 *   selectedTopics — from CompassContext (user's selected topic IDs)
 *   anchorRef      — { current: HTMLElement } — badge button element for positioning
 *   onClose        — dismiss callback
 */
export default function CompassPreview({
  politicianId,
  politicianName,
  allTopics,
  userAnswers,
  selectedTopics,
  anchorRef,
  onClose,
}) {
  const [polAnswers, setPolAnswers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState({ top: 0, left: 0, arrowSide: 'bottom' });
  const popoverRef = useRef(null);
  const leaveTimerRef = useRef(null);
  const POPOVER_WIDTH = 220;

  // Fetch politician answers on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchPoliticianAnswers(politicianId)
      .then((answers) => {
        if (!cancelled) {
          setPolAnswers(answers);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPolAnswers([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [politicianId]);

  // Position the popover relative to the anchor element
  useEffect(() => {
    const anchor = anchorRef?.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const POPOVER_APPROX_HEIGHT = 260;
    const GAP = 8;

    // Decide whether to show above or below the anchor
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const showAbove = spaceBelow < POPOVER_APPROX_HEIGHT && spaceAbove > spaceBelow;

    const top = showAbove
      ? rect.top - POPOVER_APPROX_HEIGHT - GAP
      : rect.bottom + GAP;

    // Horizontally center on the anchor, clamped to viewport
    let left = rect.left + rect.width / 2 - POPOVER_WIDTH / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - POPOVER_WIDTH - 8));

    setPos({ top, left, arrowSide: showAbove ? 'bottom' : 'top' });
  }, [anchorRef]);

  // Dismiss on scroll
  useEffect(() => {
    const handleScroll = () => onClose();
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [onClose]);

  // Dismiss on outside click (for mobile and desktop)
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        // Allow a tiny delay so the badge button click event doesn't re-open immediately
        setTimeout(onClose, 50);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [onClose]);

  // Mouse leave handling with debounce to avoid flicker
  const handleMouseLeave = () => {
    leaveTimerRef.current = setTimeout(onClose, 200);
  };

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // Build the chart data once answers are loaded
  let topics = [];
  let polData = {};
  let userData = {};

  if (!loading && polAnswers !== null && allTopics.length > 0) {
    // Determine which short_titles to display:
    // If user has selectedTopics, filter to those; otherwise use all topics politician answered
    let allowedShorts;

    if (selectedTopics && selectedTopics.length > 0) {
      // Map topic IDs → short_title
      const selectedIdSet = new Set(selectedTopics.map(String));
      allowedShorts = allTopics
        .filter((t) => selectedIdSet.has(String(t.id)))
        .map((t) => t.short_title);
    } else {
      // Use all topics the politician answered
      const answeredTopicIds = new Set(polAnswers.map((a) => String(a.topic_id)));
      allowedShorts = allTopics
        .filter((t) => answeredTopicIds.has(String(t.id)))
        .map((t) => t.short_title);
    }

    if (allowedShorts.length > 0) {
      const { topicsFiltered, answersByShort: polMap } = buildAnswerMapByShortTitle(
        allTopics,
        polAnswers,
        allowedShorts
      );

      topics = topicsFiltered;
      polData = polMap;

      if (userAnswers && userAnswers.length > 0) {
        const { answersByShort: userMap } = buildAnswerMapByShortTitle(
          allTopics,
          userAnswers,
          allowedShorts
        );
        userData = userMap;
      }
    }
  }

  const hasData = topics.length > 0;

  const arrowStyle = pos.arrowSide === 'top'
    ? {
        position: 'absolute',
        top: '-6px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: '6px solid white',
      }
    : {
        position: 'absolute',
        bottom: '-6px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid white',
      };

  const popover = (
    <div
      ref={popoverRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: POPOVER_WIDTH,
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)',
        zIndex: 9999,
        fontFamily: "'Manrope', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Arrow caret */}
      <div style={arrowStyle} />

      {/* Header */}
      <div
        style={{
          padding: '8px 12px 4px',
          borderBottom: '1px solid #f0f4f5',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '11px',
            fontWeight: 700,
            color: '#00657c',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {politicianName + "'s Compass"}
        </p>
        {Object.keys(userData).length > 0 && (
          <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#9ca3af' }}>
            <span style={{ color: '#ff5740', fontWeight: 600 }}>Pink</span> = politician,{' '}
            <span style={{ color: '#59b0c4', fontWeight: 600 }}>blue</span> = you
          </p>
        )}
      </div>

      {/* Chart area */}
      <div style={{ padding: '4px 8px 8px' }}>
        {loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '140px',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#00657c',
                borderRadius: '50%',
                animation: 'ev-spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes ev-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && !hasData && (
          <p
            style={{
              margin: 0,
              padding: '12px 0',
              fontSize: '11px',
              color: '#9ca3af',
              textAlign: 'center',
            }}
          >
            No stance data available
          </p>
        )}

        {!loading && hasData && (
          <RadarChartCore
            topics={topics}
            data={polData}
            compareData={Object.keys(userData).length > 0 ? userData : {}}
            size={180}
            labelFontSize={9}
            padding={40}
            labelOffset={12}
          />
        )}
      </div>
    </div>
  );

  return createPortal(popover, document.body);
}
