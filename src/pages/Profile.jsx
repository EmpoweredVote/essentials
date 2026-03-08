import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchPolitician, fetchLegislativeSummary } from '../lib/api';
import {
  Header,
  PoliticianProfile,
} from '@chrisandrewsedu/ev-ui';
import CompassCard from '../components/CompassCard';

const API = import.meta.env.VITE_API_URL || '/api';

function formatElectionDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pol, setPol] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [legislativeSummary, setLegislativeSummary] = useState(null);
  const [activeElection, setActiveElection] = useState(null);

  // Navigation config
  const navItems = [
    { label: 'About Us', href: '/about' },
    {
      label: 'Features',
      href: '/features',
      dropdown: [
        { label: 'Political Compass', href: '/compass' },
        { label: 'Find Representatives', href: '/' },
        { label: 'Treasury Tracker', href: '/treasury' },
      ],
    },
    { label: 'Volunteer', href: '/volunteer' },
    { label: 'FAQ', href: '/faq' },
  ];

  const ctaButton = {
    label: 'Donate',
    href: '/donate',
  };

  // Fetch politician, legislative summary, and elections in parallel
  useEffect(() => {
    if (!id) return;
    setLoadingProfile(true);

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

    (async () => {
      try {
        const [result, legSummary, elections] = await Promise.all([
          fetchPolitician(id),
          fetchLegislativeSummary(id),
          fetchElections(),
        ]);
        setPol(result);
        setLegislativeSummary(legSummary);
        const active = (elections || []).find((e) => !e.withdrawn) || elections?.[0] || null;
        setActiveElection(active);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-[var(--ev-bg-light)]">
      <Header
        logoSrc="/EVLogo.svg"
        logoAlt="Empowered Vote"
        navItems={navItems}
        ctaButton={ctaButton}
        onNavigate={(href) => navigate(href)}
      />

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-6xl">
        {loadingProfile ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--ev-teal)] border-t-transparent" />
          </div>
        ) : (
          <>
          <PoliticianProfile
            politician={pol}
            onBack={() => {
              try {
                const cached = sessionStorage.getItem('ev:results');
                if (cached) {
                  const { query } = JSON.parse(cached);
                  if (query) {
                    navigate(`/results?q=${encodeURIComponent(query)}`);
                    return;
                  }
                }
              } catch { /* fall through */ }
              navigate('/');
            }}
            backLabel={
              pol.first_name
                ? `${pol.first_name} ${pol.last_name}`
                : undefined
            }
            banner={
              activeElection ? (
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
              ) : null
            }
            legislativeSummary={legislativeSummary}
            politicianId={id}
            onNavigateToRecord={(href) => navigate(href)}
          />

          <CompassCard
            politicianId={id}
            politicianName={pol.first_name ? `${pol.first_name} ${pol.last_name}` : ''}
          />
          </>
        )}
      </main>
    </div>
  );
}

export default Profile;
