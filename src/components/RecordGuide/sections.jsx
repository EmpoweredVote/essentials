import { useMemo, useState } from 'react';
import {
  extractYear,
  formatDate,
  formatBillNumber,
  groupVotesByBill,
  isCeremonial,
  readableTitle,
  roleWord,
  sortCommittees,
  tallyText,
  outcomeWord,
  sponsorLine,
  joinNames,
  voteResultWord,
} from '../../lib/recordGuide';
import { matchesTopic } from '../../lib/recordTopics';
import {
  GuideSection,
  Mark,
  Status,
  BillNo,
  TopicTags,
  SourceLink,
  Quote,
  CeremonialPocket,
  useShowMore,
  YearSelect,
} from './parts';

const NO_TOPIC_MATCH = 'Nothing on this topic in this part of the record.';

function Meta({ parts }) {
  const shown = parts.filter(Boolean);
  if (!shown.length) return null;
  return (
    <div className="rg-meta">
      {shown.map((p, i) => (
        <span key={i}>{p}</span>
      ))}
    </div>
  );
}

function yearsOf(dates) {
  return [...new Set(dates.map(extractYear).filter(Boolean))].sort((a, b) => b.localeCompare(a));
}

// ─── Committees ──────────────────────────────────────────────────────────────

export function CommitteesSection({ id = 'committees', n, committees, leadership }) {
  const rows = sortCommittees(committees);
  return (
    <GuideSection id={id} n={n} title="Committees">
      <ul className="rg-list">
        {(leadership || []).map((role, i) => (
          <li key={`lead-${i}`} className="rg-row rg-row-2">
            <span className="rg-title">{role.title}{role.chamber ? `, ${role.chamber}` : ''}</span>
            <span className="rg-status">Leadership</span>
          </li>
        ))}
        {rows.map((c) => (
          <li key={c.id || c.committee_id} className="rg-row rg-row-2">
            <span className="rg-title">
              {c.committee_name}
              {c.parent_name ? <span className="rg-meta">{c.parent_name}</span> : null}
            </span>
            <span className="rg-status" data-lead={/^member$/i.test(String(c.role || 'member')) ? 'false' : 'true'}>
              {roleWord(c.role)}
            </span>
          </li>
        ))}
      </ul>
    </GuideSection>
  );
}

// ─── Bills (state and federal) ───────────────────────────────────────────────

function BillRow({ bill, topics }) {
  const number = formatBillNumber(bill.number);
  return (
    <li className="rg-row">
      <BillNo number={bill.number} />
      <div>
        <div className="rg-title">{bill.title}</div>
        <Meta parts={[bill.introduced_at && `Introduced ${formatDate(bill.introduced_at)}`, bill.session_name]} />
        <TopicTags topics={topics} />
      </div>
      <div className="rg-side">
        <Status value={bill.status_label} />
        <SourceLink href={bill.url} kind="Bill page" of={number || bill.title} />
      </div>
    </li>
  );
}

function BillList({ bills, topicsOf, limit = 15 }) {
  const [visible, more] = useShowMore(bills, limit);
  return (
    <>
      <ul className="rg-list">
        {visible.map((b) => (
          <BillRow key={b.id || b.number} bill={b} topics={topicsOf(b)} />
        ))}
      </ul>
      {more}
    </>
  );
}

export function BillsSection({ id = 'bills', n, bills, topicsOf, topic }) {
  const ceremonial = bills.filter((b) => isCeremonial(b.title));
  const substantive = bills.filter((b) => !isCeremonial(b.title) && matchesTopic(topicsOf(b), topic));
  const sponsored = substantive.filter((b) => b.is_sponsor);
  const cosponsored = substantive.filter((b) => !b.is_sponsor);
  const filtering = topic && topic !== 'all';
  return (
    <GuideSection
      id={id}
      n={n}
      title="Bills sponsored and co-sponsored"
      intro="A sponsor writes or introduces a bill. A co-sponsor signs on to support it."
    >
      {substantive.length === 0 && (
        <p className="rg-empty">
          {filtering ? NO_TOPIC_MATCH : 'Every bill in this record is a ceremonial resolution.'}
        </p>
      )}
      {sponsored.length > 0 && (
        <>
          <h3>Sponsor ({sponsored.length})</h3>
          <BillList bills={sponsored} topicsOf={topicsOf} />
        </>
      )}
      {cosponsored.length > 0 && (
        <>
          <h3>Co-sponsor ({cosponsored.length})</h3>
          <BillList bills={cosponsored} topicsOf={topicsOf} />
        </>
      )}
      {!filtering && (
        <CeremonialPocket count={ceremonial.length}>
          <ul className="rg-list">
            {ceremonial.map((b) => (
              <BillRow key={b.id || b.number} bill={b} topics={[]} />
            ))}
          </ul>
        </CeremonialPocket>
      )}
    </GuideSection>
  );
}

// ─── Roll-call votes (state and federal) ────────────────────────────────────

function BillVotes({ group, topics }) {
  const number = formatBillNumber(group.number);
  return (
    <article className="rg-bill" data-vote-bill>
      <div className="rg-bill-head">
        <BillNo number={group.number} />
        <div>
          <div className="rg-title">{group.title}</div>
          <TopicTags topics={topics} />
        </div>
        <div className="rg-side">
          <SourceLink href={group.url} kind="Bill page" of={number || group.title} />
        </div>
      </div>
      <ul className="rg-calls">
        {group.votes.map((v) => (
          <li key={v.id} className="rg-call">
            <Mark position={v.position} />
            <div className="rg-call-q">
              {v.vote_question || 'Vote'}
              <Meta
                parts={[
                  voteResultWord(v.vote_question, v.result) && <Status value={voteResultWord(v.vote_question, v.result)} />,
                  tallyText({ yes: v.yea_count, no: v.nay_count }),
                  formatDate(v.vote_date),
                ]}
              />
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function VotesSection({ id = 'votes', n, name, votes, topicsOf, topic }) {
  const [year, setYear] = useState('All');
  const groups = useMemo(() => groupVotesByBill(votes), [votes]);
  const years = useMemo(() => yearsOf(votes.map((v) => v.vote_date)), [votes]);
  const shown = groups
    .map((g) => ({ ...g, votes: year === 'All' ? g.votes : g.votes.filter((v) => extractYear(v.vote_date) === year) }))
    .filter((g) => g.votes.length > 0 && matchesTopic(topicsOf(g), topic));
  const [visible, more, reset] = useShowMore(shown, 15);
  return (
    <GuideSection
      id={id}
      n={n}
      title={`How ${name || 'they'} voted`}
      intro="Grouped by bill. A bill can come up for several votes, such as on an amendment and on final passage."
      withKey
      controls={
        <YearSelect years={years} value={year} label="Filter votes by year" onChange={(y) => { setYear(y); reset(); }} />
      }
    >
      {shown.length === 0 ? (
        <p className="rg-empty">{NO_TOPIC_MATCH}</p>
      ) : (
        <div className="rg-bills">
          {visible.map((g) => (
            <BillVotes key={g.key} group={g} topics={topicsOf(g)} />
          ))}
        </div>
      )}
      {more}
    </GuideSection>
  );
}

// ─── City council: what they authored ────────────────────────────────────────

function sponsorRole(item) {
  const base = item.role === 'cosponsor' ? 'Co-sponsor' : 'Sponsor';
  const others = joinNames(item.co_sponsors || []);
  return others ? `${base}, with ${others}` : base;
}

// The city says an ordinance or resolution is "Adopted"; its amendments are "Passed".
function sponsorshipStatus(item) {
  if (!item.amendment_label && item.status === 'passed') return 'Adopted';
  return outcomeWord(item.status);
}

function SponsorshipRow({ item, topics }) {
  const docLabel = `${item.number}${item.amendment_label ? ` ${item.amendment_label}` : ''}`;
  return (
    <li className="rg-row" data-testid="sponsorship">
      <span className="rg-billno">
        {item.number}
        {item.amendment_label ? <span className="rg-meta">{item.amendment_label}</span> : null}
      </span>
      <div>
        <div className="rg-title">{readableTitle(item.title)}</div>
        <Meta parts={[sponsorRole(item)]} />
        <Quote text={item.sentence} />
        <TopicTags topics={topics} />
        <div className="rg-meta">
          {item.document_url && <SourceLink href={item.document_url} kind="City document" of={docLabel} doc />}
          {item.url && <SourceLink href={item.url} kind="Legislation page" of={item.number} />}
        </div>
      </div>
      <div className="rg-side">
        <Status value={sponsorshipStatus(item)} />
      </div>
    </li>
  );
}

export function CouncilSponsorshipsSection({ id = 'authored', n, name, items, failed, topicsOf, topic }) {
  const ceremonial = items.filter((i) => isCeremonial(i.title));
  const rest = items.filter((i) => !isCeremonial(i.title) && matchesTopic(topicsOf(i), topic));
  const filtering = topic && topic !== 'all';
  const [visible, more] = useShowMore(rest, 15);
  let body;
  if (failed) {
    body = <p className="rg-empty">Sponsorships could not be loaded. Try again later.</p>;
  } else if (items.length === 0) {
    body = (
      <p className="rg-empty">
        {`The city's records since December 2020 do not name ${name || 'this member'} as a sponsor. Most items are brought by the mayor's office or city staff.`}
      </p>
    );
  } else {
    body = (
      <>
        {rest.length === 0 ? (
          <p className="rg-empty">{filtering ? NO_TOPIC_MATCH : 'Every item here is ceremonial.'}</p>
        ) : (
          <ul className="rg-list">
            {visible.map((item) => (
              <SponsorshipRow key={`${item.bill_id}|${item.amendment_label ?? ''}`} item={item} topics={topicsOf(item)} />
            ))}
          </ul>
        )}
        {more}
        {!filtering && (
          <CeremonialPocket count={ceremonial.length}>
            <ul className="rg-list">
              {ceremonial.map((item) => (
                <SponsorshipRow key={`${item.bill_id}|${item.amendment_label ?? ''}`} item={item} topics={[]} />
              ))}
            </ul>
          </CeremonialPocket>
        )}
      </>
    );
  }
  return (
    <GuideSection
      id={id}
      n={n}
      title="Authored and co-sponsored"
      intro="Ordinances, resolutions and amendments the city's records name this member as bringing forward."
    >
      {body}
    </GuideSection>
  );
}

// ─── City council: how they voted ────────────────────────────────────────────

const WORKED_OUT_NOTE = "Worked out from the attendance list and tally in the clerk's record.";
const PENDING_COPY = 'How each member voted will appear when the clerk posts the record of this meeting.';

function itemDates(item) {
  const dates = (item.votes || []).map((v) => v.meeting_date);
  if (item.pending) dates.push(item.pending.meeting_date);
  return dates;
}

function CouncilItem({ item, year, topics }) {
  const votes = (item.votes || []).filter((v) => year === 'All' || extractYear(v.meeting_date) === year);
  const showPending = item.pending && (year === 'All' || extractYear(item.pending.meeting_date) === year);
  const sponsors = sponsorLine(item.sponsors);
  return (
    <article className="rg-bill">
      <div className="rg-bill-head">
        <span className="rg-billno">{item.number}</span>
        <div>
          <div className="rg-title">{readableTitle(item.title)}</div>
          <Meta parts={[sponsors]} />
          <TopicTags topics={topics} />
        </div>
        <div className="rg-side">
          <Status value={item.status_label} />
          <SourceLink href={item.url} kind="Legislation page" of={item.number} />
        </div>
      </div>
      {showPending && (
        <p className="rg-pending">
          {[formatDate(item.pending.meeting_date), outcomeWord(item.pending.outcome), tallyText(item.pending)]
            .filter(Boolean)
            .join(' · ')}
          . {PENDING_COPY}
        </p>
      )}
      {votes.length > 0 && (
        <ul className="rg-calls">
          {votes.map((v, i) => {
            const source = v.source_kind === 'memorandum' ? "Clerk's memo" : 'Minutes';
            return (
              <li key={v.roll_call_id || i} className="rg-call" data-vote-row title={v.worked_out ? WORKED_OUT_NOTE : undefined}>
                <Mark position={v.position} />
                <div className="rg-call-q">
                  {v.question}
                  {v.seat_label ? ` (as ${v.seat_label})` : ''}
                  <Meta
                    parts={[
                      v.outcome && <Status value={v.outcome} />,
                      tallyText(v),
                      formatDate(v.meeting_date),
                      sponsorLine(v.sponsors),
                      v.worked_out && <span title={WORKED_OUT_NOTE}>Worked out from the tally</span>,
                      v.minutes_url && <SourceLink href={v.minutes_url} kind={source} of={item.number} doc />,
                    ]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

export function CouncilVotesSection({ id = 'votes', n, items, topicsOf, topic }) {
  const [year, setYear] = useState('All');
  const years = useMemo(() => yearsOf(items.flatMap(itemDates)), [items]);
  const shown = items.filter(
    (it) =>
      (year === 'All' || itemDates(it).some((d) => extractYear(d) === year)) && matchesTopic(topicsOf(it), topic),
  );
  const [visible, more, reset] = useShowMore(shown, 15);
  return (
    <GuideSection
      id={id}
      n={n}
      title="Council votes"
      intro="Grouped by item, newest meeting first. An item can come up for several votes, such as on each amendment."
      withKey
      controls={
        <YearSelect years={years} value={year} label="Filter by year" onChange={(y) => { setYear(y); reset(); }} />
      }
    >
      {shown.length === 0 ? (
        <p className="rg-empty">{items.length === 0 ? 'No council votes on file.' : NO_TOPIC_MATCH}</p>
      ) : (
        visible.map((item, i) => <CouncilItem key={item.bill_id || i} item={item} year={year} topics={topicsOf(item)} />)
      )}
      {more}
    </GuideSection>
  );
}
