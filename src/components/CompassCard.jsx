import { useCompass } from '../contexts/CompassContext';
import { useLocation } from 'react-router-dom';

const COMPASS_URL = import.meta.env.VITE_COMPASS_URL || 'https://compass.empowered.vote';

/**
 * CompassCard — profile page section showing compass comparison data.
 *
 * Gates display: only renders for politicians that have stance data.
 * Shows CTA when user has no compass data, skeleton placeholders otherwise
 * (Phase 70 fills left zone with RadarChartCore, Phase 71 fills right zone with breakdown).
 *
 * Props:
 *   politicianId   — politician UUID
 *   politicianName — display name for CTA text
 */
export default function CompassCard({ politicianId, politicianName }) {
  const { politicianIdsWithStances, userAnswers, compassLoading } = useCompass();
  const location = useLocation();

  // Gate: wait for compass data to load
  if (compassLoading) return null;

  // Gate: only show for politicians with stance data
  if (!politicianIdsWithStances.has(politicianId)) return null;

  const hasUserCompass = userAnswers && userAnswers.length > 0;
  const returnUrl = window.location.origin + location.pathname + location.search;
  const ctaHref = `${COMPASS_URL}?return=${encodeURIComponent(returnUrl)}`;

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
          /* Skeleton layout — 2-column grid for future chart + breakdown */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left zone: chart placeholder (Phase 70) */}
            <div className="bg-gray-100 animate-pulse rounded-lg aspect-square" />

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
