import { useMemo } from 'react';
import { useCompass } from '../contexts/CompassContext';

const ACCENT = '#c2410c';
const BADGE_BG = '#ea580c';
const NOTCH_COLORS = ['#fbbf24', '#f97316', '#f59e0b', '#dc2626', '#b91c1c'];

function ScaleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={ACCENT}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M3 6l3 8a3 3 0 0 0 6 0L9 6" />
      <path d="M12 6l3 8a3 3 0 0 0 6 0L18 6" />
    </svg>
  );
}

function deriveJudicialSubRole(officeTitle) {
  const t = (officeTitle || '').toLowerCase();
  if (t.includes('judge')) return 'judge';
  if (t.includes('city attorney') || t.includes('district attorney')) return 'city_attorney_da';
  return null;
}

function filterJudicialTopics(judicialTopics, judicialSubRole) {
  if (!judicialSubRole) return judicialTopics;
  return judicialTopics.filter(
    (t) => t.judicial_role === null || t.judicial_role === undefined || t.judicial_role === judicialSubRole
  );
}

function EmptyNotchRow() {
  return (
    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
      {NOTCH_COLORS.map((color, i) => (
        <span
          key={i}
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: `2px solid ${color}`,
            backgroundColor: 'transparent',
            display: 'inline-block',
          }}
          aria-label={`Position ${i + 1} of 5`}
        />
      ))}
    </div>
  );
}

export default function JudicialCompassSection({ officeTitle, politicianId: _politicianId }) {
  const { allTopics, compassLoading } = useCompass();

  const judicialSubRole = useMemo(() => deriveJudicialSubRole(officeTitle), [officeTitle]);

  const displayTopics = useMemo(() => {
    if (!allTopics || allTopics.length === 0) return [];
    const judicialTopics = allTopics.filter((t) => t.applies_judicial === true);
    return filterJudicialTopics(judicialTopics, judicialSubRole);
  }, [allTopics, judicialSubRole]);

  if (compassLoading) return null;
  if (displayTopics.length === 0) return null;

  return (
    <section className="mt-8" aria-label="Judicial Evaluation">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          borderBottom: `2px solid ${ACCENT}`,
          paddingBottom: '8px',
        }}
      >
        <ScaleIcon />
        <h2
          className="text-2xl font-bold"
          style={{ color: ACCENT, fontFamily: "'Manrope', sans-serif", margin: 0 }}
        >
          Judicial Evaluation
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayTopics.map((topic) => (
          <div
            key={topic.id}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4"
            style={{ borderLeft: `4px solid ${ACCENT}` }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '4px',
              }}
            >
              <h3
                className="font-semibold text-gray-900 dark:text-gray-100"
                style={{ fontSize: '15px', margin: 0, lineHeight: 1.4 }}
              >
                {topic.title}
              </h3>
              <span
                style={{
                  backgroundColor: BADGE_BG,
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Judicial
              </span>
            </div>

            {topic.question_text && (
              <p
                className="text-gray-600 dark:text-gray-400"
                style={{ fontSize: '13px', margin: '0 0 8px 0', lineHeight: 1.5 }}
              >
                {topic.question_text}
              </p>
            )}

            <EmptyNotchRow />
            <p
              className="text-gray-400 dark:text-gray-500"
              style={{ fontSize: '12px', marginTop: '6px' }}
            >
              Stance research in progress
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
