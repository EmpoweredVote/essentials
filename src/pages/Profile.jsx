import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchPolitician } from '../lib/api';
import {
  Header,
  RadarChartCore,
  PoliticianProfile,
  IssueTags,
} from '@chrisandrewsedu/ev-ui';
import {
  fetchTopics,
  fetchPoliticianAnswers,
  buildAnswerMapByShortTitle,
} from '../lib/compass';

const DEFAULT_SHORT_TITLES = [
  'Abortion',
  'Gun Control',
  'Education',
  'Climate Change',
  'Healthcare',
  'Policing',
];

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pol, setPol] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [topics, setTopics] = useState([]);
  const [answersByShort, setAnswersByShort] = useState({});
  const [loadingCompass, setLoadingCompass] = useState(true);
  const [invertedSpokes, setInvertedSpokes] = useState({});
  const [showUserComparison, setShowUserComparison] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});

  const inversionKey = `invertedSpokes:pol:${id}`;

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

  // Fetch politician
  useEffect(() => {
    if (!id) return;
    setLoadingProfile(true);
    (async () => {
      try {
        const result = await fetchPolitician(id);
        setPol(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [id]);

  // Load inversion for this politician
  useEffect(() => {
    try {
      const saved = localStorage.getItem(inversionKey);
      if (saved) setInvertedSpokes(JSON.parse(saved));
    } catch {}
  }, [inversionKey]);

  // Save inversion per politician
  useEffect(() => {
    try {
      localStorage.setItem(inversionKey, JSON.stringify(invertedSpokes));
    } catch {}
  }, [invertedSpokes, inversionKey]);

  // Load user compass data if available
  useEffect(() => {
    try {
      const compassAnswers = localStorage.getItem('compassAnswers');
      if (compassAnswers) {
        const parsed = JSON.parse(compassAnswers);
        setUserAnswers(parsed);
      }
    } catch {}
  }, []);

  // Fetch topics + answers for this politician
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingCompass(true);
        const [allTopics, polAnswers] = await Promise.all([
          fetchTopics(),
          fetchPoliticianAnswers(id),
        ]);
        if (cancelled) return;

        const { topicsFiltered, answersByShort } = buildAnswerMapByShortTitle(
          allTopics || [],
          polAnswers || [],
          DEFAULT_SHORT_TITLES
        );

        setTopics(topicsFiltered);
        setAnswersByShort(answersByShort);
      } catch (err) {
        console.error('[Profile] compass load failed', err);
        setTopics([]);
        setAnswersByShort({});
      } finally {
        if (!cancelled) setLoadingCompass(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Toggle inversion by short_title
  const toggleInversion = (shortTitle) =>
    setInvertedSpokes((prev) => ({ ...prev, [shortTitle]: !prev[shortTitle] }));

  // Format topics as tags
  const issueTags = topics.map((t) => ({
    label: t.short_title,
    value: t.short_title,
  }));

  const hasUserData = Object.keys(userAnswers).length > 0;

  return (
    <div className="min-h-screen bg-[var(--ev-bg-light)]">
      <Header
        logoSrc="/EVLogo.svg"
        logoAlt="Empowered Vote"
        navItems={navItems}
        ctaButton={ctaButton}
        onNavigate={(href) => navigate(href)}
      />

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {loadingProfile ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--ev-teal)] border-t-transparent" />
          </div>
        ) : (
        <PoliticianProfile
          politician={pol}
          onBack={() => navigate(-1)}
          backLabel={
            pol.first_name
              ? `${pol.first_name} ${pol.last_name}`
              : undefined
          }
        >
          {/* Issues and Prioritization Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-[var(--ev-teal)] mb-6">
              Issues and Prioritization
            </h3>

            {/* Toggle Tabs */}
            {hasUserData && (
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setShowUserComparison(false)}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    !showUserComparison
                      ? 'bg-[var(--ev-teal)] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pol.first_name} {pol.last_name}
                </button>
                <button
                  onClick={() => setShowUserComparison(true)}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    showUserComparison
                      ? 'bg-[var(--ev-teal)] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  User
                </button>
              </div>
            )}

            {/* Compass */}
            {loadingCompass ? (
              <p className="text-gray-600">Loading compass…</p>
            ) : topics.length === 0 ? (
              <p className="text-gray-600">No topics available for the default set.</p>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Radar Chart */}
                <div className="flex-shrink-0">
                  <RadarChartCore
                    topics={topics}
                    data={answersByShort}
                    compareData={showUserComparison && hasUserData ? userAnswers : {}}
                    invertedSpokes={invertedSpokes}
                    onToggleInversion={toggleInversion}
                    onReplaceTopic={() => {}}
                    size={420}
                  />
                </div>

                {/* Issue Tags and Policy Positions */}
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    Issue Tags
                  </h4>
                  <IssueTags tags={issueTags} variant="default" />

                  {pol.notes && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">
                        Policy Positions
                      </h4>
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>View full policy details on their official website</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </PoliticianProfile>
        )}
      </main>
    </div>
  );
}

export default Profile;
