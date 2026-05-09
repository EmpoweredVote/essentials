import React from 'react';

const ACCENT = '#c2410c'; // Match JudicialCompassSection burnt orange

// LACBA rating badge colors
const RATING_COLORS = {
  'Exceptionally Well Qualified': { bg: '#dcfce7', text: '#166534', border: '#16a34a' },
  'Well Qualified': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  'Qualified': { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' },
  'Not Qualified': { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
  'Not evaluated — office not covered by LACBA JEEC': { bg: '#fefce8', text: '#854d0e', border: '#d97706' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T12:00:00` : dateStr;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function BarEvaluationSection({ judicialRecord }) {
  if (!judicialRecord) return null;

  const { evaluations = [], disciplinary_records = [] } = judicialRecord;

  // Only show LACBA evaluations (not State Bar "Active" rows — no signal)
  const lacbaEntries = evaluations.filter(e => e.source === 'LACBA JEEC');

  // Only show imposed CJP discipline (disciplinary_records are only inserted when discipline was imposed)
  const cjpRecords = disciplinary_records;

  if (lacbaEntries.length === 0 && cjpRecords.length === 0) return null;

  return (
    <section className="mt-8" aria-label="Bar Evaluations and Discipline Record">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 13L8 7l4-4 6 6-4 4z"/>
          <path d="M3 21l7-7"/>
          <path d="M21 3l-3 3"/>
        </svg>
        <h2 className="text-xl font-bold" style={{ color: ACCENT, fontFamily: "'Manrope', sans-serif", margin: 0 }}>
          Bar Evaluations
        </h2>
      </div>

      {/* LACBA ratings */}
      {lacbaEntries.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            LACBA Judicial Evaluation (2026)
          </p>
          {lacbaEntries.map((ev, i) => {
            const colors = RATING_COLORS[ev.rating] || RATING_COLORS['Qualified'];
            const isNotEvaluated = ev.rating?.startsWith('Not evaluated');
            return (
              <div
                key={i}
                className="rounded-lg p-3 mb-2 flex items-start justify-between gap-3"
                style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
              >
                <div>
                  <span className="font-semibold text-sm" style={{ color: colors.text }}>
                    {isNotEvaluated ? 'Not Evaluated by LACBA' : ev.rating}
                  </span>
                  {isNotEvaluated && (
                    <p className="text-xs mt-0.5" style={{ color: colors.text }}>
                      LACBA's Judicial Elections Evaluation Committee rates only contested Superior Court races — not City Attorney candidates.
                    </p>
                  )}
                </div>
                {ev.source_url && (
                  <a
                    href={ev.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs whitespace-nowrap flex-shrink-0"
                    style={{ color: ACCENT }}
                  >
                    Source →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CJP Disciplinary Records */}
      {cjpRecords.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            California Commission on Judicial Performance
          </p>
          {cjpRecords.map((rec, i) => (
            <div
              key={i}
              className="rounded-lg p-4 mb-3 bg-white dark:bg-gray-900"
              style={{ border: '1px solid #fca5a5', borderLeft: '4px solid #ef4444' }}
            >
              {/* Description is the primary voter-facing content */}
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-2">
                {rec.description}
              </p>
              {/* record_type and date are secondary metadata */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">
                  {rec.record_type}{rec.record_date ? ` · ${formatDate(rec.record_date)}` : ''}
                </span>
                {rec.source_url && (
                  <a
                    href={rec.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex-shrink-0"
                    style={{ color: ACCENT }}
                  >
                    Read CJP document →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
