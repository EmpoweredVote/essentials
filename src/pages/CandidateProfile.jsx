import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchPolitician, fetchLegislativeSummary, fetchJudicialRecord, fetchRaceCandidate } from '../lib/api';
import { PoliticianProfile } from '@empoweredvote/ev-ui';
import { Layout } from '../components/Layout';
import CompassCard from '../components/CompassCard';
import CampaignFinanceSection from '../components/CampaignFinance/CampaignFinanceSection';
import { cleanPositionName } from '../components/ElectionsView';

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
  const [judicialRecord, setJudicialRecord] = useState(null);
  const [candidateData, setCandidateData] = useState(null);
  const [polId, setPolId] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoadingProfile(true);
    setNotFound(false);

    (async () => {
      try {
        // Step 1: fetch race candidate detail (always)
        const candidate = await fetchRaceCandidate(id);

        if (!candidate) {
          setNotFound(true);
          return;
        }

        setCandidateData(candidate);

        if (candidate.politician_id) {
          // Step 2a: INCUMBENT — fetch full politician + legislative + judicial
          const [polResult, legSummary, jRecord] = await Promise.all([
            fetchPolitician(candidate.politician_id),
            fetchLegislativeSummary(candidate.politician_id),
            fetchJudicialRecord(candidate.politician_id),
          ]);
          setPol(polResult);
          setLegislativeSummary(legSummary);
          if (polResult.is_judicial) {
            setJudicialRecord(jRecord);
          }
          setPolId(candidate.politician_id);
        } else {
          // Step 2b: CHALLENGER — build minimal pol object from candidate data only
          setPol({
            full_name: candidate.full_name,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            photo_origin_url: candidate.photo_url,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [id]);

  const handleBack = () => {
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
  };

  const backLabel = (sessionStorage.getItem('ev:fromView') === 'elections')
    ? 'Elections'
    : 'Representatives';

  // Not-found state (withdrawn or invalid candidate)
  if (notFound && !loadingProfile) {
    return (
      <Layout>
        <div className="min-h-screen bg-[var(--ev-bg-light)]">
          <main className="container mx-auto px-4 sm:px-6 py-16 max-w-6xl text-center">
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#2d3748', margin: 0 }}>
              Candidate not found
            </h2>
            <p style={{ fontSize: '14px', color: '#718096', marginTop: '8px' }}>
              This candidate may have withdrawn or the link may be incorrect.
            </p>
            <button
              onClick={handleBack}
              className="mt-4 text-[var(--ev-teal)] underline cursor-pointer bg-transparent border-none"
              style={{ fontSize: '14px', fontFamily: "'Manrope', sans-serif" }}
            >
              &larr; Back to {backLabel}
            </button>
          </main>
        </div>
      </Layout>
    );
  }

  // Candidate banner — shown for all candidates reaching this page
  const candidateBanner = candidateData ? (
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
        Candidate for {cleanPositionName(candidateData.position_name)}
      </p>
      {candidateData.election_date && (
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#718096' }}>
          Election: {formatElectionDateFull(candidateData.election_date)}
        </p>
      )}
    </div>
  ) : null;

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
                onBack={handleBack}
                backLabel={backLabel}
                banner={candidateBanner}
                legislativeSummary={legislativeSummary}
                judicialRecord={judicialRecord}
                politicianId={polId || id}
                onNavigateToRecord={(href) => navigate(href)}
              />

              {/* CompassCard — only for incumbents. Self-gates via politicianIdsWithStances. Per D-04. */}
              {polId && (
                <CompassCard
                  politicianId={polId}
                  politicianName={pol.full_name || `${pol.first_name} ${pol.last_name}`}
                  politicianTitle={pol.office_title || candidateData?.position_name || ''}
                />
              )}
              {polId && (
                <div className="mt-6">
                  <CampaignFinanceSection politicianId={polId} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </Layout>
  );
}
