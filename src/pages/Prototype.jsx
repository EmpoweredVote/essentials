import { useState, useMemo, useEffect } from 'react';
import { SiteHeader, CategorySection, CompassCardHorizontal, CompassCardVertical, useMediaQuery } from '@empoweredvote/ev-ui';
import { usePoliticianData } from '../hooks/usePoliticianData';
import {
  classifyCategory,
  orderedEntries,
  FEDERAL_ORDER,
  STATE_ORDER,
  LOCAL_ORDER,
  computeVariant,
} from '../lib/classify';
import SegmentedControl from '../components/SegmentedControl';
import { useCompass } from '../contexts/CompassContext';
import { fetchPoliticianAnswers } from '../lib/compass';


const COMPASS_URL = import.meta.env.VITE_COMPASS_URL || 'https://compass.empowered.vote';

const BLOOMINGTON_ADDRESS = '100 W Kirkwood Ave, Bloomington, IN 47404';

const TIER_ORDER_MAP = {
  Federal: FEDERAL_ORDER,
  State: STATE_ORDER,
  Local: LOCAL_ORDER,
};

const TIER_STRING_MAP = {
  Federal: 'federal',
  State: 'state',
  Local: 'local',
};

// Render tiers with Local first (matching Results.jsx order)
const TIER_RENDER_ORDER = ['Local', 'State', 'Federal'];

export default function Prototype() {
  const [view, setView] = useState(() => {
    try {
      const stored = localStorage.getItem('ev:compass-card-view');
      return stored === 'portrait' ? 'portrait' : 'compass';
    } catch {
      return 'compass';
    }
  });
  const [layout, setLayout] = useState(() => {
    try {
      const stored = localStorage.getItem('ev:compass-card-layout');
      return stored === 'vertical' ? 'vertical' : 'horizontal';
    } catch {
      return 'horizontal';
    }
  });
  useEffect(() => {
    try { localStorage.setItem('ev:compass-card-layout', layout); } catch {}
  }, [layout]);
  const { data: politicians, phase } = usePoliticianData(BLOOMINGTON_ADDRESS, { enabled: true });

  const isWideForVertical = useMediaQuery('(min-width: 1080px)');
  const isWideForHorizontal = useMediaQuery('(min-width: 1240px)');
  const isTwoCol = layout === 'vertical' ? isWideForVertical : isWideForHorizontal;

  const compass = useCompass();
  const rawAnswers = compass?.userAnswers || [];
  const allTopics = compass?.allTopics || [];
  const politicianIdsWithStances = compass?.politicianIdsWithStances || new Set();
  const invertedSpokes = compass?.invertedSpokes || {};

  // CompassCardHorizontal.renderCompass() needs topic objects embedded on each answer.
  // API and guest-bridge both return { topic_id, value } without topic — enrich here.
  const userAnswers = rawAnswers.map(a => {
    if (a.topic?.short_title) return a; // already enriched
    const topic = allTopics.find(t => t.id === a.topic_id);
    return topic ? { ...a, topic } : a;
  });

  // Per-politician stances cache: { [politicianId]: { [short_title]: value } }
  const [stancesByPolId, setStancesByPolId] = useState({});

  // Fetch stances for every politician that has them, once topics + list are known.
  useEffect(() => {
    if (!politicians || politicians.length === 0 || allTopics.length === 0) return;
    const topicById = new Map(allTopics.map(t => [t.id, t]));
    const targets = politicians.filter(p => politicianIdsWithStances.has(String(p.id)) && !stancesByPolId[p.id]);
    if (targets.length === 0) return;
    let cancelled = false;
    Promise.all(
      targets.map(p =>
        fetchPoliticianAnswers(p.id)
          .then(rows => {
            const map = {};
            for (const r of rows) {
              const t = topicById.get(r.topic_id);
              if (t?.short_title) map[t.short_title] = r.value ?? 0;
            }
            return [p.id, map];
          })
          .catch(() => [p.id, {}])
      )
    ).then(pairs => {
      if (cancelled) return;
      setStancesByPolId(prev => {
        const next = { ...prev };
        for (const [id, map] of pairs) next[id] = map;
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [politicians, allTopics, politicianIdsWithStances]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = 'Compass Prototype — Empowered Vote';
  }, []);

  useEffect(() => {
    try { localStorage.setItem('ev:compass-card-view', view); } catch {}
  }, [view]);

  function handleBuildCompass() {
    const returnUrl = window.location.href;
    window.open(`${COMPASS_URL}/?return=${encodeURIComponent(returnUrl)}`, '_blank');
  }

  const tierGroups = useMemo(() => {
    if (!politicians || politicians.length === 0) return null;
    const groups = { Federal: {}, State: {}, Local: {} };
    for (const pol of politicians) {
      const { tier, group } = classifyCategory(pol);
      if (!groups[tier]) groups[tier] = {};
      if (!groups[tier][group]) groups[tier][group] = [];
      groups[tier][group].push(pol);
    }
    return groups;
  }, [politicians]);

  return (
    <div style={{ fontFamily: "'Manrope', sans-serif" }}>
      <SiteHeader />

      <div
        style={{
          backgroundColor: '#F0F8FA',
          minHeight: '100vh',
        }}
      >
        {/* Banner */}
        <div
          style={{
            backgroundColor: '#E4F3F6',
            borderBottom: '1px solid #C0E8F2',
            padding: '12px 32px',
          }}
        >
          <p
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#003E4D',
              marginBottom: '4px',
              margin: 0,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            Compass-First Prototype
          </p>
          <p
            style={{
              fontSize: '16px',
              fontWeight: 400,
              color: '#4a5568',
              margin: 0,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            Exploring a new card layout where your political compass is the visual anchor. Bloomington, IN representatives.
          </p>
        </div>

        {/* Controls bar: view-mode toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            margin: '24px auto 32px auto',
            padding: '0 32px',
          }}
        >
          <SegmentedControl
            options={[
              { value: 'compass', label: 'Compass' },
              { value: 'portrait', label: 'Portrait' },
            ]}
            value={view}
            onChange={setView}
            ariaLabel="Card view mode"
          />
          <SegmentedControl
            options={[
              { value: 'horizontal', label: 'Horizontal' },
              { value: 'vertical', label: 'Vertical' },
            ]}
            value={layout}
            onChange={setLayout}
            ariaLabel="Card layout"
          />
        </div>

        {/* Content area */}
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 32px 64px',
          }}
        >
          {/* Loading state */}
          {phase === 'loading' && (
            <div
              aria-busy="true"
              aria-label="Loading representatives"
            >
              {TIER_RENDER_ORDER.map((tier) => (
                <div key={tier} style={{ marginBottom: '24px' }}>
                  <CategorySection title={`${tier} Officials`} tier={TIER_STRING_MAP[tier]}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px',
                      }}
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: '120px',
                            height: '120px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '8px',
                          }}
                        />
                      ))}
                    </div>
                  </CategorySection>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {phase === 'error' && (
            <p
              style={{
                color: '#4a5568',
                textAlign: 'center',
                padding: '48px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Failed to load representative data. Refresh to try again.
            </p>
          )}

          {/* Empty state */}
          {phase === 'fresh' && (!politicians || politicians.length === 0) && (
            <div
              style={{
                textAlign: 'center',
                padding: '48px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#003E4D',
                  marginBottom: '8px',
                }}
              >
                No representatives found
              </p>
              <p style={{ color: '#4a5568' }}>
                Could not load Bloomington, IN representatives. Check your connection and refresh.
              </p>
            </div>
          )}

          {/* Tier sections */}
          {tierGroups && TIER_RENDER_ORDER.map((tier) => {
            const tierData = tierGroups[tier];
            if (!tierData || Object.keys(tierData).length === 0) return null;
            const orderArray = TIER_ORDER_MAP[tier];
            const tierStr = TIER_STRING_MAP[tier];
            const entries = orderedEntries(tierData, orderArray);

            return entries.map(([category, polList]) => (
              <div key={`${tier}-${category}`} style={{ marginBottom: '24px' }}>
                <CategorySection title={category} tier={tierStr}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isTwoCol
                        ? 'repeat(2, 1fr)'
                        : `minmax(0, ${layout === 'vertical' ? '560px' : '640px'})`,
                      justifyContent: 'center',
                      gap: '16px',
                      gridColumn: '1 / -1',
                    }}
                  >
                    {polList.map((pol) => {
                      const Card = layout === 'vertical' ? CompassCardVertical : CompassCardHorizontal;
                      return (
                        <Card
                          key={pol.id}
                          politician={{ ...pol, stances: stancesByPolId[pol.id] || pol.stances || {} }}
                          userAnswers={userAnswers || []}
                          invertedSpokes={invertedSpokes}
                          tierVisuals={null}
                          view={view}
                          surface="representatives"
                          variant={computeVariant(pol, userAnswers, politicianIdsWithStances.has(String(pol.id)))}
                          onBuildCompass={handleBuildCompass}
                          onClick={() => { /* prototype: no-op or navigate to profile */ }}
                        />
                      );
                    })}
                  </div>
                </CategorySection>
              </div>
            ));
          })}

        </div>
      </div>
    </div>
  );
}
