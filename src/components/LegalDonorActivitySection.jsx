import React, { useEffect, useState } from 'react';
import { fetchLegalDonorActivity } from '../lib/api';

const ACCENT = '#1a6b5e'; // neutral teal — no conflict/amber coloring

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function LegalDonorActivitySection({ politicianId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!politicianId) return;
    let cancelled = false;
    (async () => {
      const result = await fetchLegalDonorActivity(politicianId);
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [politicianId]);

  if (loading) return null;
  if (!data) return null;

  const { firms = [] } = data;

  return (
    <section className="mt-8" aria-label="Legal Donor Activity">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        <h2 className="text-xl font-bold" style={{ color: ACCENT, fontFamily: "'Manrope', sans-serif", margin: 0 }}>
          Legal Donor Activity
        </h2>
      </div>
      <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
        Legal professionals who donated to this campaign, grouped by firm
      </p>

      {firms.length === 0 ? (
        <div
          className="rounded-lg p-4 bg-white dark:bg-gray-900"
          style={{ border: '1px solid #e5e7eb' }}
        >
          <p className="text-sm text-gray-500" style={{ fontFamily: "'Manrope', sans-serif" }}>
            No legal professional donor data available for this candidate.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {firms.map((firm, i) => {
              const visibleOccupations = Array.isArray(firm.occupations_seen)
                ? firm.occupations_seen.slice(0, 3)
                : [];
              return (
                <div
                  key={i}
                  className="rounded-lg p-3 bg-white dark:bg-gray-900 flex items-start justify-between gap-3"
                  style={{ border: '1px solid #e5e7eb' }}
                >
                  <div className="min-w-0">
                    <p
                      className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      {firm.firm_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      {firm.donor_count} donor{firm.donor_count !== 1 ? 's' : ''}
                    </p>
                    {visibleOccupations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {visibleOccupations.map((occ, j) => (
                          <span
                            key={j}
                            className="inline-block text-xs rounded px-1.5 py-0.5"
                            style={{
                              backgroundColor: '#f0fdf9',
                              color: ACCENT,
                              border: `1px solid #a7f3d0`,
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
                            {occ}
                          </span>
                        ))}
                        {firm.occupations_seen.length > 3 && (
                          <span
                            className="inline-block text-xs rounded px-1.5 py-0.5"
                            style={{
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
                              border: '1px solid #e5e7eb',
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
                            +{firm.occupations_seen.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p
                      className="font-bold text-sm"
                      style={{ color: ACCENT, fontFamily: "'Manrope', sans-serif" }}
                    >
                      {currencyFmt.format(firm.total_donated)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {firms.length === 50 && (
            <p className="text-xs text-gray-400 mt-3" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Showing top 50 by amount donated.
            </p>
          )}
        </>
      )}
    </section>
  );
}
