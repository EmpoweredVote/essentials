import { useMemo, useState } from 'react';
import { track } from '@empoweredvote/analytics';
import { StanceAccordion } from '@empoweredvote/ev-ui';

const OTHER_CATEGORY = 'Other Issues';

// Each category gets a descriptive stroke icon (24×24, lucide-style) and its
// own color, so groups are told apart at a glance. Matched by a word in the
// category title rather than the exact title so a renamed category keeps its
// look; anything unmatched falls back to the neutral list icon.
// `light` / `dark` are the icon colors for each theme.
const CATEGORY_STYLES = [
  {
    key: 'econom', light: '#ca8a04', dark: '#facc15', // banknote
    icon: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 12h.01M18 12h.01" />
      </>
    ),
  },
  {
    key: 'education', light: '#f97316', dark: '#fb923c', // graduation cap
    icon: (
      <>
        <path d="M22 10 12 5 2 10l10 5 10-5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
        <path d="M22 10v6" />
      </>
    ),
  },
  {
    key: 'civil rights', light: '#9333ea', dark: '#c084fc', // people
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    key: 'governance', light: '#18181b', dark: '#f5f5f4', // ballot box
    icon: (
      <>
        <path d="m9 12 2 2 4-4" />
        <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" />
        <path d="M22 19H2" />
      </>
    ),
  },
  {
    key: 'judicial', light: '#78350f', dark: '#a47148', // gavel
    icon: (
      <>
        <path d="m14.5 12.5-8 8a2.12 2.12 0 1 1-3-3l8-8" />
        <path d="m16 16 6-6" />
        <path d="m8 8 6-6" />
        <path d="m9 7 8 8" />
        <path d="m21 11-8-8" />
      </>
    ),
  },
  {
    key: 'public safety', light: '#dc2626', dark: '#f87171', // police siren
    icon: (
      <>
        <path d="M7 18v-6a5 5 0 1 1 10 0v6" />
        <path d="M5 21a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1z" />
        <path d="M21 12h1M2 12h1M12 2v1M18.5 4.5 18 5M4.93 4.93l.71.71" />
        <path d="M12 12v6" />
      </>
    ),
  },
  {
    key: 'health', light: '#0891b2', dark: '#22d3ee', // stethoscope
    icon: (
      <>
        <path d="M11 2v2M5 2v2" />
        <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
        <path d="M8 15a6 6 0 0 0 12 0v-3" />
        <circle cx="20" cy="10" r="2" />
      </>
    ),
  },
  {
    key: 'foreign', light: '#2563eb', dark: '#60a5fa', // globe
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
  },
  {
    key: 'environment', light: '#16a34a', dark: '#4ade80', // leaf
    icon: (
      <>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </>
    ),
  },
  {
    key: 'technology', light: '#71717a', dark: '#a1a1aa', // chip
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
      </>
    ),
  },
];

const FALLBACK_STYLE = {
  light: '#6b7280', dark: '#a1a1aa', // list
  icon: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </>
  ),
};

function categoryStyle(title) {
  const lower = title.toLowerCase();
  return CATEGORY_STYLES.find((s) => lower.includes(s.key)) || FALLBACK_STYLE;
}

function CategoryIcon({ title, darkMode }) {
  const style = categoryStyle(title);
  const color = darkMode ? style.dark : style.light;
  return (
    <span
      style={{
        flexShrink: 0,
        width: 36,
        height: 36,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        // 8-digit hex: the category color at ~12% (light) / ~18% (dark) opacity
        backgroundColor: `${color}${darkMode ? '2e' : '1f'}`,
      }}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {style.icon}
      </svg>
    </span>
  );
}

/**
 * Groups a politician's stances into collapsible issue categories. Each topic
 * lands under its primary (first-listed) category so it appears exactly once;
 * groups are ordered largest first. Opening a group reveals the usual
 * StanceAccordion for just that group's questions and answers.
 *
 * The group holding initialExpandedTopicId (a deep-linked topic) starts open.
 */
export default function CategorizedStances({
  topics,
  polAnswers,
  userAnswerMap,
  politicianId,
  allTopics,
  darkMode,
  apiUrl,
  verdictsByQuote,
  initialExpandedTopicId,
}) {
  const groups = useMemo(() => {
    const byTitle = new Map();
    for (const topic of topics) {
      const title = topic.categories?.[0]?.title || OTHER_CATEGORY;
      if (!byTitle.has(title)) byTitle.set(title, []);
      byTitle.get(title).push(topic);
    }
    return [...byTitle.entries()]
      .map(([title, groupTopics]) => ({ title, topics: groupTopics }))
      .sort((a, b) => b.topics.length - a.topics.length || a.title.localeCompare(b.title));
  }, [topics]);

  const [openTitles, setOpenTitles] = useState(() => {
    if (!initialExpandedTopicId) return new Set();
    const group = groups.find((g) => g.topics.some((t) => String(t.id) === String(initialExpandedTopicId)));
    return new Set(group ? [group.title] : []);
  });

  const toggle = (title) => {
    const opening = !openTitles.has(title);
    track('essentials_compass_category_toggled', { category: title, open: opening, context: 'profile' });
    setOpenTitles((prev) => {
      const next = new Set(prev);
      if (opening) next.add(title);
      else next.delete(title);
      return next;
    });
  };

  const muted = darkMode ? '#9ca3af' : '#6b7280';
  const border = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: "'Manrope', sans-serif" }}>
      {groups.map((group) => {
        const open = openTitles.has(group.title);
        const panelId = `stance-group-${group.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
        const { light, dark } = categoryStyle(group.title);
        return (
          <div
            key={group.title}
            style={{
              border: `1px solid ${border}`,
              borderLeft: `4px solid ${darkMode ? dark : light}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => toggle(group.title)}
              aria-expanded={open}
              aria-controls={panelId}
              className="w-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'inherit',
              }}
            >
              <CategoryIcon title={group.title} darkMode={darkMode} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{group.title}</span>
                <span style={{ display: 'block', fontSize: 12, color: muted }}>
                  {group.topics.length} {group.topics.length === 1 ? 'topic' : 'topics'}
                </span>
              </span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {open && (
              <div id={panelId} style={{ padding: '4px 14px 14px', borderTop: `1px solid ${border}` }}>
                <StanceAccordion
                  topics={group.topics}
                  polAnswers={polAnswers}
                  userAnswerMap={userAnswerMap}
                  politicianId={politicianId}
                  allTopics={allTopics}
                  darkMode={darkMode}
                  apiUrl={apiUrl}
                  verdictsByQuote={verdictsByQuote}
                  initialExpandedTopicId={initialExpandedTopicId}
                  polDotColor={darkMode ? dark : light}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
