import { useState, useMemo, useEffect } from 'react';
import { SiteHeader, CategorySection, CompassCardHorizontal } from '@empoweredvote/ev-ui';
import { usePoliticianData } from '../hooks/usePoliticianData';
import {
  classifyCategory,
  orderedEntries,
  FEDERAL_ORDER,
  STATE_ORDER,
  LOCAL_ORDER,
} from '../lib/classify';
import SegmentedControl from '../components/SegmentedControl';
import CompassFirstCard, { VARIANT_CONFIG } from '../components/CompassFirstCard';
import MOCK_STANCES, { MOCK_USER_COMPASS } from '../data/mockCompassData';

// Shape MOCK_USER_COMPASS { [short_title]: value } into the array format
// CompassCardHorizontal's fallback path accepts: [{ short_title, value }]
const USER_ANSWERS = Object.entries(MOCK_USER_COMPASS).map(([short_title, value]) => ({
  short_title,
  value,
}));

const BLOOMINGTON_ADDRESS = '100 W Kirkwood Ave, Bloomington, IN 47404';

const VARIANT_OPTIONS = [
  { value: 'A', label: 'Spacious' },
  { value: 'B', label: 'Compact' },
  { value: 'C', label: 'Horizontal' },
];

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
  const [variant, setVariant] = useState('A');
  const [view, setView] = useState(() => {
    try {
      const stored = localStorage.getItem('ev:compass-card-view');
      return stored === 'portrait' ? 'portrait' : 'compass';
    } catch {
      return 'compass';
    }
  });
  const { data: politicians, phase } = usePoliticianData(BLOOMINGTON_ADDRESS, { enabled: true });

  useEffect(() => {
    document.title = 'Compass Prototype \u2014 Empowered Vote';
  }, []);

  useEffect(() => {
    try { localStorage.setItem('ev:compass-card-view', view); } catch {}
  }, [view]);

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

        {/* Controls bar: view-mode toggle + legacy variant toggle */}
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
            options={VARIANT_OPTIONS}
            value={variant}
            onChange={setVariant}
            ariaLabel="Card layout variant"
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
                    className={VARIANT_CONFIG[variant].gridCols}
                    style={{
                      display: 'grid',
                      gap: '16px',
                      gridColumn: '1 / -1', // span all CategorySection columns
                    }}
                  >
                    {polList.map((pol) => (
                      <CompassFirstCard
                        key={pol.id}
                        politician={pol}
                        mockAnswers={MOCK_STANCES[pol.id] || null}
                        variant={variant}
                      />
                    ))}
                  </div>
                </CategorySection>
              </div>
            ));
          })}

          {/* CompassCardHorizontal (ev-ui port) — 5 harness scenarios for Phase 127 verification */}
          {politicians && politicians.length > 0 && (
            <section style={{ marginTop: 48 }}>
              <h2 style={{ fontFamily: "'Manrope', sans-serif", color: '#003E4D', marginBottom: 8 }}>
                CompassCardHorizontal (ev-ui port)
              </h2>
              <p style={{ fontSize: 14, color: '#555', marginBottom: 24, fontFamily: "'Manrope', sans-serif" }}>
                Current view mode: <strong>{view}</strong> — toggle via the segmented control above.
              </p>

              {/* Scenarios 1 + 3: representatives surface — live userAnswers + explicit empty-data */}
              <h3 style={{ fontFamily: "'Manrope', sans-serif", color: '#003E4D', marginBottom: 12 }}>
                Representatives surface
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 16, marginBottom: 16 }}>
                {politicians.slice(0, 3).map((p) => (
                  <CompassCardHorizontal
                    key={`rep-${p.id}`}
                    politician={p}
                    userAnswers={USER_ANSWERS}
                    view={view}
                    surface="representatives"
                  />
                ))}

                {/* Scenario 3: explicit empty-data — forces PlaceholderRadar in compass view */}
                <CompassCardHorizontal
                  key="rep-empty"
                  politician={politicians[0]}
                  userAnswers={null}
                  view={view}
                  surface="representatives"
                />

                {/* Scenario: missing photo — forces initials fallback in portrait view */}
                <CompassCardHorizontal
                  key="rep-nophoto"
                  politician={{ ...politicians[0], photo_origin_url: null, images: null, full_name: 'No Photo Politician' }}
                  userAnswers={USER_ANSWERS}
                  view={view}
                  surface="representatives"
                />
              </div>

              {/* Scenario 5: elections surface with one running_unopposed=true */}
              <h3 style={{ marginTop: 32, fontFamily: "'Manrope', sans-serif", color: '#003E4D', marginBottom: 12 }}>
                Elections surface
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 16 }}>
                <CompassCardHorizontal
                  key="elec-contested"
                  politician={{ ...politicians[0], office_running_for: politicians[0].office_title, running_unopposed: false }}
                  userAnswers={USER_ANSWERS}
                  view={view}
                  surface="elections"
                />
                <CompassCardHorizontal
                  key="elec-unopposed"
                  politician={{ ...(politicians[1] || politicians[0]), office_running_for: (politicians[1] || politicians[0]).office_title, running_unopposed: true }}
                  userAnswers={USER_ANSWERS}
                  view={view}
                  surface="elections"
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
