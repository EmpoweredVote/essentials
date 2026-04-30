import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchPolitician, fetchLegislativeSummary, fetchJudicialRecord } from '../lib/api';
import { apiFetch } from '../lib/auth';
import { PoliticianProfile } from '@empoweredvote/ev-ui';
import { Layout } from '../components/Layout';
import CompassCard from '../components/CompassCard';
import CampaignFinanceSection from '../components/CampaignFinance/CampaignFinanceSection';
import { getSeatBallotStatus } from '../utils/ballotStatus';
import { useCompass } from '../contexts/CompassContext';

function formatElectionDateFull(dateStr) {
  if (!dateStr) return '';
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T12:00:00` : dateStr;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pol, setPol] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [legislativeSummary, setLegislativeSummary] = useState(null);
  const [activeElection, setActiveElection] = useState(null);
  const [judicialRecord, setJudicialRecord] = useState(null);
  const { politicianIdsWithStances } = useCompass();

  // Fetch politician, legislative summary, elections, and judicial record in parallel
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
        const [result, legSummary, elections, jRecord] = await Promise.all([
          fetchPolitician(id),
          fetchLegislativeSummary(id),
          fetchElections(),
          fetchJudicialRecord(id),
        ]);
        setPol(result);
        setLegislativeSummary(legSummary);
        const active = (elections || []).find((e) => e.is_active && !e.withdrawn) || null;
        setActiveElection(active);
        if (result.is_judicial) {
          setJudicialRecord(jRecord);
        }
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
          <>
          <PoliticianProfile
            politician={pol}
            imageFocalPoint={(() => {
              const defaultImg = pol.images?.find((img) => img.type === 'default');
              const img = defaultImg || pol.images?.[0];
              return img?.focal_point || undefined;
            })()}
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
              const addressParam = searchParams.get('q');
              if (addressParam) {
                navigate(`/results?q=${encodeURIComponent(addressParam)}${viewParam}`);
                return;
              }
              navigate('/');
            }}
            backLabel={
              (sessionStorage.getItem('ev:fromView') === 'elections')
                ? 'Elections'
                : 'Representatives'
            }
            banner={(() => {
              const ballotStatus = getSeatBallotStatus(pol.term_end, pol.term_date_precision, pol.next_primary_date, pol.next_general_date);

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
            judicialRecord={judicialRecord}
            politicianId={id}
            onNavigateToRecord={(href) => navigate(href)}
          />

          {(() => {
            // Plan C: explicit treatment for offices where compass doesn't apply
            const engagement = pol.policy_engagement_level || 'full';
            const hasStances = politicianIdsWithStances.has(String(id));

            // Administrative offices — no compass comparison applies
            if (engagement === 'none') {
              return (
                <section className="mt-8">
                  <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    Compass &amp; Issues
                  </h2>
                  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <p className="text-gray-600" style={{ fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
                      This is an administrative office — it doesn't take policy positions,
                      so no compass comparison applies. See the role description and contact
                      information above.
                    </p>
                  </div>
                </section>
              );
            }

            // Contested judges without stance research — honest placeholder.
            // Use district_type (reliably set by backend) instead of is_judicial
            // (which is not on the API response per pre-execution verification).
            const isJudge =
              pol.district_type === 'JUDICIAL' || pol.district_type === 'NATIONAL_JUDICIAL';
            if (isJudge && engagement === 'full' && !hasStances) {
              return (
                <section className="mt-8">
                  <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    Compass &amp; Issues
                  </h2>
                  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <p className="text-gray-600 mb-2" style={{ fontSize: '15px', lineHeight: 1.6 }}>
                      Judges are typically evaluated on their record rather than stated policy positions.
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                      We're working on surfacing judicial records. In the meantime, you can review the
                      role description and contact information above.
                    </p>
                  </div>
                </section>
              );
            }

            // Default: render the existing CompassCard
            return (
              <CompassCard
                politicianId={id}
                politicianName={pol.first_name ? `${pol.first_name} ${pol.last_name}` : ''}
                politicianTitle={pol.office_title || ''}
              />
            );
          })()}
          <div className="mt-6">
            <CampaignFinanceSection politicianId={id} />
          </div>
          </>
        )}
      </main>
    </div>
    </Layout>
  );
}

export default Profile;
