import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchPolitician, fetchLegislativeSummary } from '../lib/api';
import {
  Header,
  PoliticianProfile,
} from '@chrisandrewsedu/ev-ui';

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pol, setPol] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [legislativeSummary, setLegislativeSummary] = useState(null);

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

  // Fetch politician and legislative summary in parallel
  useEffect(() => {
    if (!id) return;
    setLoadingProfile(true);
    (async () => {
      try {
        const [result, legSummary] = await Promise.all([
          fetchPolitician(id),
          fetchLegislativeSummary(id),
        ]);
        setPol(result);
        setLegislativeSummary(legSummary);
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
            legislativeSummary={legislativeSummary}
            politicianId={id}
            onNavigateToRecord={(href) => navigate(href)}
          />
        )}
      </main>
    </div>
  );
}

export default Profile;
