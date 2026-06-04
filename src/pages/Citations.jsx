import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchPolitician } from '../lib/api';
import { apiFetch } from '../lib/auth';
import { Layout } from '../components/Layout';

function formatVerifiedDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function CitationItem({ citation }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block px-2 py-0.5 rounded text-xs font-semibold font-[Manrope]"
          style={{ backgroundColor: '#00657c', color: '#fff' }}
        >
          {citation.domain}
        </span>
        {citation.verified_at && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-[Manrope]">
            Verified {formatVerifiedDate(citation.verified_at)}
          </span>
        )}
      </div>
      {citation.snippet && (
        <blockquote className="border-l-4 border-[#59b0c4] pl-4 my-2 text-sm text-gray-700 dark:text-gray-300 italic font-[Manrope] leading-relaxed">
          {citation.snippet}
        </blockquote>
      )}
      <a
        href={citation.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-[Manrope] underline break-all"
        style={{ color: '#00657c' }}
      >
        View source &rarr;
      </a>
    </div>
  );
}

function TopicSection({ topic }) {
  const primaryCitations = (topic.citations || []).filter((c) => c.is_primary);
  const secondaryCitations = (topic.citations || []).filter((c) => !c.is_primary);

  return (
    <div className="mb-10">
      {/* Topic heading */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-[Manrope] leading-snug mb-1">
        {topic.topic_title}
      </h2>
      {topic.topic_tension_name && (
        <p className="text-sm text-gray-500 dark:text-gray-400 font-[Manrope] mb-4">
          {topic.topic_tension_name}
        </p>
      )}

      {/* Stance indicator */}
      {topic.has_stance ? (
        <div
          className="rounded-lg px-4 py-3 mb-4"
          style={{ backgroundColor: 'var(--ev-bg-card, #f0f4f8)' }}
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 font-[Manrope]">
            {topic.stance_text}
          </p>
        </div>
      ) : (
        <div className="inline-block mb-4">
          <span className="text-xs font-[Manrope] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            Position under review
          </span>
        </div>
      )}

      {/* Reasoning */}
      {topic.reasoning && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide font-[Manrope] mb-1">
            Why this position?
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-[Manrope] leading-relaxed">
            {topic.reasoning}
          </p>
        </div>
      )}

      {/* Primary citations */}
      {primaryCitations.length > 0 && (
        <div>
          {primaryCitations.map((c, i) => (
            <CitationItem key={i} citation={c} />
          ))}
        </div>
      )}

      {/* Secondary citations */}
      {secondaryCitations.length > 0 && (
        <>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-[Manrope] whitespace-nowrap">
              Additional sources
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
          {secondaryCitations.map((c, i) => (
            <CitationItem key={`secondary-${i}`} citation={c} />
          ))}
        </>
      )}
    </div>
  );
}

function Citations() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pol, setPol] = useState(null);
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [result, citRes] = await Promise.all([
          fetchPolitician(id),
          apiFetch(`/compass/politicians/${id}/citations`),
        ]);

        setPol(result);

        if (!citRes || !citRes.ok) {
          throw new Error(`Failed to load citations: ${citRes?.status ?? 'network error'}`);
        }
        const citData = await citRes.json();
        setCitations(Array.isArray(citData) ? citData : []);
      } catch (err) {
        console.error('Citations fetch error:', err);
        setError(err.message || 'Failed to load citations');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const polName = pol
    ? `${pol.first_name || ''} ${pol.last_name || ''}`.trim()
    : '';

  return (
    <Layout>
      <div className="min-h-screen bg-[var(--ev-bg-light)] dark:bg-ev-navy">
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">

          {/* Back link */}
          <button
            onClick={() => navigate(`/politician/${id}`)}
            className="mb-4 flex items-center gap-1 text-sm text-[var(--ev-teal)] hover:underline font-[Manrope]"
          >
            &larr; Back to {polName || 'Profile'}
          </button>

          {/* Page header */}
          <h1 className="text-2xl font-bold text-[var(--ev-teal)] mb-1 font-[Manrope]">
            Sourced Positions{polName ? ` — ${polName}` : ''}
          </h1>
          {polName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 font-[Manrope] mb-8">
              Sourced positions — every verified citation for {polName}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--ev-teal)] border-t-transparent" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-5 py-4">
              <p className="text-sm text-red-700 dark:text-red-300 font-[Manrope]">
                {error}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && citations.length === 0 && (
            <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-6 py-10 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-[Manrope]">
                No sourced positions on record for {polName || 'this politician'} yet.
              </p>
            </div>
          )}

          {/* Topic sections */}
          {!loading && !error && citations.length > 0 && (
            <div>
              {citations.map((topic, i) => (
                <div
                  key={topic.topic_key || i}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-6 py-6 mb-6"
                >
                  <TopicSection topic={topic} />
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </Layout>
  );
}

export default Citations;
