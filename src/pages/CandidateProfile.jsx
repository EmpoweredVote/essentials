import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchPolitician, fetchEndorsements } from '../lib/api';
import { fetchPoliticianAnswers, buildAnswerMapByShortTitle } from '../lib/compass';
import { SiteHeader, RadarChartCore } from '@chrisandrewsedu/ev-ui';
import { useCompass } from '../contexts/CompassContext';

const API = import.meta.env.VITE_API_URL || '/api';

function getImageUrl(pol) {
  if (pol.images && pol.images.length > 0) {
    const defaultImg = pol.images.find((img) => img.type === 'default');
    return defaultImg ? defaultImg.url : pol.images[0].url;
  }
  return pol.photo_origin_url;
}

function formatElectionDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pol, setPol] = useState(null);
  const [endorsements, setEndorsements] = useState([]);
  const [elections, setElections] = useState([]);
  const [polAnswers, setPolAnswers] = useState(null);
  const [loading, setLoading] = useState(true);

  const { allTopics, userAnswers, selectedTopics, invertedSpokes } = useCompass();

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const fetchElections = async () => {
      try {
        const res = await fetch(`${API}/essentials/politician/${id}/elections`, {
          credentials: 'include',
        });
        if (!res.ok) return [];
        return res.json();
      } catch {
        return [];
      }
    };

    Promise.all([
      fetchPolitician(id),
      fetchEndorsements(id),
      fetchPoliticianAnswers(id).catch(() => []),
      fetchElections(),
    ])
      .then(([polData, endData, ansData, elecData]) => {
        setPol(polData);
        setEndorsements(endData || []);
        setPolAnswers(ansData || []);
        setElections(elecData || []);
      })
      .catch((err) => {
        console.error('CandidateProfile load error:', err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleBack = () => {
    try {
      const cached = sessionStorage.getItem('ev:results');
      if (cached) {
        const { query } = JSON.parse(cached);
        navigate(`/results?q=${encodeURIComponent(query)}`);
        return;
      }
    } catch { /* ignore */ }
    navigate('/');
  };

  // Build radar chart data
  const hasUserCompass = userAnswers && userAnswers.length > 0;
  let radarTopics = [];
  let polDataMap = {};
  let userDataMap = {};

  if (polAnswers && polAnswers.length > 0 && allTopics.length > 0) {
    let allowedShorts;

    if (hasUserCompass && selectedTopics && selectedTopics.length > 0) {
      const topicById = new Map(allTopics.map((t) => [String(t.id), t]));
      allowedShorts = selectedTopics
        .map((tid) => topicById.get(String(tid)))
        .filter(Boolean)
        .map((t) => t.short_title);
    } else {
      const answeredIds = new Set(polAnswers.map((a) => String(a.topic_id)));
      allowedShorts = allTopics
        .filter((t) => answeredIds.has(String(t.id)))
        .map((t) => t.short_title);
    }

    if (allowedShorts.length > 0) {
      const { topicsFiltered, answersByShort: pMap } = buildAnswerMapByShortTitle(
        allTopics,
        polAnswers,
        allowedShorts
      );
      radarTopics = topicsFiltered;
      polDataMap = pMap;

      if (hasUserCompass) {
        const { answersByShort: uMap } = buildAnswerMapByShortTitle(
          allTopics,
          userAnswers,
          allowedShorts
        );
        userDataMap = uMap;
      }
    }
  }

  const hasRadarData = radarTopics.length > 0;

  // Find the active election for this candidate
  const activeElection = elections.find((e) => !e.withdrawn) || elections[0] || null;

  // Get campaign website URL
  const campaignUrl = pol?.urls?.[0] || null;

  // Photo or initials
  const photoUrl = pol ? getImageUrl(pol) : null;
  const initials = pol
    ? `${(pol.first_name || '')[0] || ''}${(pol.last_name || '')[0] || ''}`.toUpperCase()
    : '';

  return (
    <div className="min-h-screen bg-[var(--ev-bg-light)]">
      <SiteHeader logoSrc="/EVLogo.svg" />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Manrope', sans-serif",
            fontSize: '14px',
            color: '#00657c',
            fontWeight: 600,
            padding: '4px 0',
            marginBottom: '16px',
          }}
        >
          &larr; Back to results
        </button>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--ev-teal)] border-t-transparent" />
          </div>
        ) : !pol ? (
          <p className="text-center text-gray-600 mt-8">Candidate not found.</p>
        ) : (
          <>
            {/* Header section */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '24px' }}>
              {/* Photo */}
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={pol.full_name}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '36px',
                    fontWeight: 700,
                    color: '#94a3b8',
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
              )}

              {/* Name & info */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h1
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '28px',
                    fontWeight: 800,
                    color: '#00657c',
                    margin: '0 0 6px',
                    lineHeight: 1.2,
                  }}
                >
                  {pol.full_name || `${pol.first_name} ${pol.last_name}`}
                </h1>

                {pol.party && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: '12px',
                      color: '#4a5568',
                      backgroundColor: '#f7fafc',
                      borderRadius: '999px',
                      padding: '2px 10px',
                      marginBottom: '8px',
                    }}
                  >
                    {pol.party}
                  </span>
                )}

                {pol.office_title && (
                  <p
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: '15px',
                      color: '#4a5568',
                      margin: '4px 0 0',
                    }}
                  >
                    {pol.office_title}
                    {pol.district_id && /^[1-9]\d*$/.test(pol.district_id)
                      ? ` \u2014 District ${pol.district_id}`
                      : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Election banner */}
            {activeElection && (
              <div
                style={{
                  borderLeft: '4px solid #fed12e',
                  backgroundColor: '#fffef5',
                  borderRadius: '0 8px 8px 0',
                  padding: '12px 16px',
                  marginBottom: '24px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#2d3748' }}>
                  Running for {activeElection.position_name || pol.office_title}
                </p>
                {activeElection.election_date && (
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#718096' }}>
                    {formatElectionDateFull(activeElection.election_date)}
                  </p>
                )}
                {activeElection.election_name && (
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#a0aec0' }}>
                    {activeElection.election_name}
                  </p>
                )}
              </div>
            )}

            {/* Bio section */}
            {pol.bio_text && (
              <section style={{ marginBottom: '24px' }}>
                <h2
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#2d3748',
                    margin: '0 0 8px',
                  }}
                >
                  About
                </h2>
                <p
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '14px',
                    color: '#4a5568',
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {pol.bio_text}
                </p>
              </section>
            )}

            {/* Compass section */}
            {hasRadarData && (
              <section style={{ marginBottom: '24px' }}>
                <h2
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#2d3748',
                    margin: '0 0 12px',
                  }}
                >
                  Political Compass
                </h2>

                {hasUserCompass && (
                  <p style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '11px',
                    color: '#9ca3af',
                    margin: '0 0 8px',
                    textAlign: 'center',
                  }}>
                    <span style={{ color: '#ff5740', fontWeight: 600 }}>Coral</span> = you,{' '}
                    <span style={{ color: '#59b0c4', fontWeight: 600 }}>Blue</span> ={' '}
                    {pol.first_name} {pol.last_name}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <RadarChartCore
                    size={250}
                    topics={radarTopics.map((t) => t.short_title)}
                    dataA={hasUserCompass ? userDataMap : polDataMap}
                    dataB={hasUserCompass ? polDataMap : undefined}
                    invertedSpokes={invertedSpokes || {}}
                    interactive={false}
                    showLabels={true}
                  />
                </div>
              </section>
            )}

            {/* Endorsements section */}
            {endorsements.length > 0 && (
              <section style={{ marginBottom: '24px' }}>
                <h2
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#2d3748',
                    margin: '0 0 12px',
                  }}
                >
                  Endorsements
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {endorsements.map((e, i) => (
                    <span
                      key={i}
                      style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '13px',
                        color: '#4a5568',
                        backgroundColor: '#f7fafc',
                        borderRadius: '999px',
                        padding: '4px 12px',
                      }}
                    >
                      {e.organization_name || e.endorser_string}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Campaign website */}
            {campaignUrl && (
              <section style={{ marginBottom: '24px' }}>
                <a
                  href={campaignUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'white',
                    backgroundColor: '#ff5740',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    textDecoration: 'none',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Visit Campaign Website
                </a>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
