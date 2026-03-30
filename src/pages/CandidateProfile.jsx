import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchPolitician, fetchLegislativeSummary } from '../lib/api';
import { apiFetch } from '../lib/auth';
import { PoliticianProfile } from '@chrisandrewsedu/ev-ui';
import { Layout } from '../components/Layout';
import { getSeatBallotStatus } from '../utils/ballotStatus';

function formatElectionDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pol, setPol] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [legislativeSummary, setLegislativeSummary] = useState(null);
  const [activeElection, setActiveElection] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoadingProfile(true);

    const fetchElections = async () => {
      try {
        const res = await apiFetch(`/essentials/politicians/${id}/elections`);
        if (!res || !res.ok) return [];
        return res.json();
      } catch {
        return [];
      }
    };

    (async () => {
      try {
        const [result, legSummary, elections] = await Promise.all([
          fetchPolitician(id),
          fetchLegislativeSummary(id),
          fetchElections(),
        ]);
        setPol(result);
        setLegislativeSummary(legSummary);
        const active = (elections || []).find((e) => e.is_active && !e.withdrawn) || null;
        setActiveElection(active);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [id]);

  return (
    <Layout>
    <div className="min-h-screen bg-[var(--ev-bg-light)]">

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-6xl">
        {loadingProfile ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--ev-teal)] border-t-transparent" />
          </div>
        ) : (
          <PoliticianProfile
            politician={pol}
            onBack={() => {
              const fromView = sessionStorage.getItem('ev:fromView') || 'representatives';
              const viewParam = fromView === 'elections' ? '&view=elections' : '';
              try {
                const cached = sessionStorage.getItem('ev:results');
                if (cached) {
                  const { query } = JSON.parse(cached);
                  if (query) {
                    navigate(`/results?q=${encodeURIComponent(query)}${viewParam}`);
                    return;
                  }
                }
              } catch { /* fall through */ }
              navigate('/');
            }}
            backLabel={
              (sessionStorage.getItem('ev:fromView') === 'elections')
                ? 'Elections'
                : 'Representatives'
            }
            banner={(() => {
              const ballotStatus = getSeatBallotStatus(pol.term_end, pol.term_date_precision);

              if (ballotStatus) {
                return (
                  <div
                    style={{
                      borderLeft: '4px solid #f6ad55',
                      backgroundColor: '#fffaf0',
                      borderRadius: '0 8px 8px 0',
                      padding: '12px 16px',
                      marginTop: '16px',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#2d3748' }}>
                      This seat is on the ballot
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#718096' }}>
                      {activeElection
                        ? `Incumbent is seeking reelection${activeElection.election_date ? ` · Election: ${formatElectionDateFull(activeElection.election_date)}` : ''}`
                        : 'Open seat'}
                    </p>
                  </div>
                );
              }

              if (activeElection) {
                return (
                  <div
                    style={{
                      borderLeft: '4px solid #fed12e',
                      backgroundColor: '#fffef5',
                      borderRadius: '0 8px 8px 0',
                      padding: '12px 16px',
                      marginTop: '16px',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#2d3748' }}>
                      Candidate for {activeElection.position_name || pol.office_title}
                    </p>
                    {activeElection.election_date && (
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#718096' }}>
                        Election: {formatElectionDateFull(activeElection.election_date)}
                      </p>
                    )}
                  </div>
                );
              }

              return null;
            })()}
            legislativeSummary={legislativeSummary}
            politicianId={id}
            onNavigateToRecord={(href) => navigate(href)}
          />
        )}
      </main>
    </div>
    </Layout>
  );
}
