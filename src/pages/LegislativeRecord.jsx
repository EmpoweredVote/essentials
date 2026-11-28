import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchPolitician,
  fetchLegislativeCommittees,
  fetchLegislativeLeadership,
  fetchLegislativeBills,
  fetchLegislativeVotes,
  fetchAllCouncilRecord,
  fetchAllCouncilSponsorships,
} from '../lib/api';
import { fetchTopics } from '../lib/compass';
import { Layout } from '../components/Layout';
import LegiScanAttribution from '../components/LegiScanAttribution';
import CouncilRecordAttribution from '../components/CouncilRecordAttribution';
import { councilLayout } from '../lib/councilRecord';
import {
  recordSource,
  earlierOfficeNote,
  legislativeGlance,
  councilGlance,
  groupVotesByBill,
  isCeremonial,
  formatDateRange,
} from '../lib/recordGuide';
import { buildTopicIndex, itemTopics, topicChoices } from '../lib/recordTopics';
import { RECORD_TOPICS_PREVIEW } from '../mocks/recordTopics';
import {
  CommitteesSection,
  BillsSection,
  VotesSection,
  CouncilSponsorshipsSection,
  CouncilVotesSection,
} from '../components/RecordGuide/sections';
import { TopicFilterContext, BackArrow } from '../components/RecordGuide/parts';
import '../components/RecordGuide/recordGuide.css';

function displayName(pol) {
  if (!pol) return '';
  return (pol.preferred_name || `${pol.first_name || ''} ${pol.last_name || ''}`).trim();
}

function Glance({ sentences, stats }) {
  if (!sentences.length && !stats.length) return null;
  return (
    <section className="rg-glance" aria-labelledby="rg-glance-h">
      <h2 className="rg-tab" id="rg-glance-h">At a glance</h2>
      <div className="rg-box">
        {sentences.length > 0 && <p className="rg-summary">{sentences.join(' ')}</p>}
        {stats.length > 0 && (
          <dl className="rg-stats" data-count={stats.length}>
            {stats.map((s) => (
              <div key={s.label} className="rg-stat">
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

function Contents({ sections }) {
  if (sections.length < 2) return null;
  return (
    <nav className="rg-contents" aria-label="On this page">
      {sections.map((s) => (
        <a key={s.id} href={`#${s.id}`}>
          <span className="rg-n">{s.n}</span>
          <span>{s.label}</span>
        </a>
      ))}
    </nav>
  );
}

const COMPASS_URL = import.meta.env.VITE_COMPASS_URL || 'https://compass.empowered.vote';

function TopicFilter({ choices, value, onChange }) {
  if (choices.length === 0) return null;
  return (
    <section className="rg-topics" aria-labelledby="rg-topics-h">
      <div className="rg-topics-head">
        <h2 id="rg-topics-h">Read by topic</h2>
        <span className="rg-topics-note">
          Topics follow the <a href={`${COMPASS_URL}/library`} target="_blank" rel="noopener noreferrer">Empowered Compass</a>.
          {RECORD_TOPICS_PREVIEW && ' Preview: matched from titles on this computer only, until the API serves topics.'}
        </span>
      </div>
      <ul className="rg-chips">
        {[{ group: 'all', label: 'Everything' }, ...choices].map((c) => (
          <li key={c.group}>
            <button type="button" className="rg-chip" aria-pressed={value === c.group} onClick={() => onChange(c.group)}>
              {c.label}
              {c.count != null && <span className="rg-count">{c.count}</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LegislativeRecordPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pol, setPol] = useState(null);
  const [committees, setCommittees] = useState([]);
  const [leadership, setLeadership] = useState([]);
  const [bills, setBills] = useState([]);
  const [votes, setVotes] = useState([]);
  const [council, setCouncil] = useState({ total: 0, items: [] });
  const [sponsorships, setSponsorships] = useState({ items: [], failed: false });
  const [topicIndex, setTopicIndex] = useState(null);
  const [topic, setTopic] = useState('all');
  const [loading, setLoading] = useState(true);

  const layout = councilLayout({ loading, total: council.total });
  const name = displayName(pol);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setTopic('all');
    Promise.all([
      fetchPolitician(id),
      fetchLegislativeCommittees(id),
      fetchLegislativeLeadership(id),
      fetchLegislativeBills(id, { limit: 200 }),
      fetchLegislativeVotes(id, { limit: 200 }),
      fetchAllCouncilRecord(id),
      fetchAllCouncilSponsorships(id),
    ])
      .then(([p, fetchedCommittees, fetchedLeadership, fetchedBills, fetchedVotes, fetchedCouncil, fetchedSponsorships]) => {
        setPol(p || null);
        setCouncil(fetchedCouncil || { total: 0, items: [] });
        setSponsorships({
          items: (fetchedSponsorships && fetchedSponsorships.items) || [],
          failed: Boolean(fetchedSponsorships && fetchedSponsorships.failed),
        });
        setCommittees(fetchedCommittees || []);
        setLeadership(fetchedLeadership || []);
        setBills(fetchedBills || []);
        setVotes(fetchedVotes || []);
      })
      .catch((err) => console.error('Error loading legislative record:', err))
      .finally(() => setLoading(false));
  }, [id]);

  // Compass topics name the record's topic filter. Without them the filter simply does not show.
  // The page waits for them (at most 2.5 seconds) so the topic row does not push the record down later.
  const [topicsSettled, setTopicsSettled] = useState(false);
  useEffect(() => {
    let live = true;
    const settle = () => { if (live) setTopicsSettled(true); };
    const timer = setTimeout(settle, 2500);
    fetchTopics()
      .then((topics) => { if (live) setTopicIndex(buildTopicIndex(topics)); })
      .catch((err) => console.error('Compass topics failed to load for the record page:', err))
      .finally(() => { clearTimeout(timer); settle(); });
    return () => { live = false; clearTimeout(timer); };
  }, []);

  const isCouncil = layout === 'council';

  // A topic tag files the page under its topic and brings the reader back to the topic row.
  const fileUnderTopic = (group) => {
    setTopic(group);
    const row = document.getElementById('rg-topics-h');
    if (row) row.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  const voteGroups = useMemo(() => groupVotesByBill(votes), [votes]);

  // Topics depend only on an item's title and tags, so one lookup per distinct pair.
  const topicsOf = useMemo(() => {
    const cache = new Map();
    return (item) => {
      if (!item) return [];
      const key = `${item.title || ''}|${JSON.stringify(item.topic_tags || null)}`;
      if (cache.has(key)) return cache.get(key);
      const tags = itemTopics(item, topicIndex, { ceremonial: isCeremonial(item.title) });
      cache.set(key, tags);
      return tags;
    };
  }, [topicIndex]);

  const choices = useMemo(() => {
    if (!topicIndex || loading) return [];
    const items = isCouncil ? [...council.items, ...sponsorships.items] : [...bills, ...voteGroups];
    return topicChoices(items.map(topicsOf), topicIndex);
  }, [topicIndex, loading, isCouncil, council.items, sponsorships.items, bills, voteGroups, topicsOf]);

  const source = isCouncil ? null : recordSource({ bills, votes });
  const runheadRight = isCouncil
    ? (pol && pol.chamber_name_formal) || 'City council'
    : (source && source.body) || (pol && pol.chamber_name_formal) || '';
  const runheadLeft = isCouncil
    ? formatDateRange(council.items.flatMap((i) => (i.votes || []).map((v) => v.meeting_date)))
    : (source && source.detail) || formatDateRange(votes.map((v) => v.vote_date));
  const note = isCouncil
    ? ''
    : earlierOfficeNote({ name, districtType: pol && pol.district_type, officeTitle: pol && pol.office_title, source });

  const glance = isCouncil
    ? councilGlance({ name, committees, items: council.items, sponsorships: sponsorships.items })
    : legislativeGlance({ name, committees, bills, votes });

  // Sections appear only when they have something to say; their numbers follow what is shown.
  const sections = [];
  if (isCouncil) {
    if (committees.length) sections.push({ id: 'committees', label: 'Committees' });
    sections.push({ id: 'authored', label: 'Authored and co-sponsored' });
    sections.push({ id: 'votes', label: 'Council votes' });
  } else {
    if (committees.length || leadership.length) sections.push({ id: 'committees', label: 'Committees' });
    if (bills.length) sections.push({ id: 'bills', label: 'Bills' });
    if (votes.length) sections.push({ id: 'votes', label: 'Votes' });
  }
  sections.forEach((s, i) => { s.n = i + 1; });
  const num = (sid) => (sections.find((s) => s.id === sid) || {}).n;
  const empty = !loading && sections.length === 0;

  return (
    <Layout>
      <div className="rg">
        <TopicFilterContext.Provider value={fileUnderTopic}>
        <main className="rg-page">
          <button type="button" className="rg-back" onClick={() => navigate(`/politician/${id}`)}>
            <BackArrow /> Back to {name || 'profile'}
          </button>

          {loading || !topicsSettled ? (
            <div className="rg-loading" role="status" aria-label="Loading the record">
              <span /><span /><span />
            </div>
          ) : (
            <>
              <header className="rg-mast">
                <div className="rg-runhead">
                  <span>{runheadLeft}</span>
                  <span>{runheadRight}</span>
                </div>
                <h1 className="rg-name">{name || 'Legislative record'}</h1>
                <p className="rg-lede">What {name || 'this person'} has voted on and put their name to.</p>
                {note && (
                  <p className="rg-note">
                    <strong>Note: </strong>
                    {note}
                  </p>
                )}
              </header>

              {empty ? (
                <p className="rg-empty">
                  No votes, bills or committee seats are on file for {name || 'this person'} yet.
                </p>
              ) : (
                <>
                  <Glance sentences={glance.sentences} stats={glance.stats} />
                  <Contents sections={sections} />
                  <TopicFilter choices={choices} value={topic} onChange={setTopic} />
                </>
              )}

              {isCouncil ? (
                <>
                  {committees.length > 0 && (
                    <CommitteesSection n={num('committees')} committees={committees} />
                  )}
                  <CouncilSponsorshipsSection
                    n={num('authored')}
                    name={name}
                    items={sponsorships.items}
                    failed={sponsorships.failed}
                    topicsOf={topicsOf}
                    topic={topic}
                  />
                  <CouncilVotesSection n={num('votes')} items={council.items} topicsOf={topicsOf} topic={topic} />
                  <footer className="rg-credit">
                    <CouncilRecordAttribution governmentName={pol && pol.government_name} />
                  </footer>
                </>
              ) : (
                <>
                  {(committees.length > 0 || leadership.length > 0) && (
                    <CommitteesSection n={num('committees')} committees={committees} leadership={leadership} />
                  )}
                  {bills.length > 0 && (
                    <BillsSection n={num('bills')} bills={bills} topicsOf={topicsOf} topic={topic} />
                  )}
                  {votes.length > 0 && (
                    <VotesSection n={num('votes')} name={name} votes={votes} topicsOf={topicsOf} topic={topic} />
                  )}
                  <footer className="rg-credit">
                    <LegiScanAttribution bills={bills} votes={votes} />
                  </footer>
                </>
              )}
            </>
          )}
        </main>
        </TopicFilterContext.Provider>
      </div>
    </Layout>
  );
}

export default LegislativeRecordPage;
