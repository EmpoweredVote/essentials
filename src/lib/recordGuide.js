// Pure helpers for the legislative record page (the "voter guide" layout).
// No React here, so every rule can be unit-tested.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Year from the text itself ("2026-02-27..." -> "2026"); never through new Date, which drifts by timezone. */
export function extractYear(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const year = dateStr.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

/** "2026-02-27" -> "Feb 27, 2026". */
export function formatDate(dateStr) {
  const year = extractYear(dateStr);
  if (!year) return dateStr || '';
  const m = parseInt(dateStr.slice(5, 7), 10) - 1;
  const d = parseInt(dateStr.slice(8, 10), 10);
  if (Number.isNaN(m) || m < 0 || m > 11) return year;
  if (Number.isNaN(d)) return `${MONTHS[m]} ${year}`;
  return `${MONTHS[m]} ${d}, ${year}`;
}

/** "Feb 23 – Feb 27, 2026", or "Dec 1, 2021 – Dec 8, 2022" across years. */
export function formatDateRange(dates, sep = ' – ') {
  const sorted = (dates || []).filter((d) => extractYear(d)).sort();
  if (sorted.length === 0) return '';
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first.slice(0, 10) === last.slice(0, 10)) return formatDate(first);
  if (extractYear(first) === extractYear(last)) {
    return `${formatDate(first).replace(/, \d{4}$/, '')}${sep}${formatDate(last)}`;
  }
  return `${formatDate(first)}${sep}${formatDate(last)}`;
}

/** The date range as it reads in a sentence: ", from Feb 23 to Feb 27, 2026", ", on Feb 23, 2026", or ''. */
function rangeClause(dates) {
  const range = formatDateRange(dates, ' to ');
  if (!range) return '';
  return range.includes(' to ') ? `, from ${range}` : `, on ${range}`;
}

/** "SB0239" -> "SB 239", "HCR0024" -> "HCR 24"; anything else is left as it is ("HR 8404", "Ord 2026-22"). */
export function formatBillNumber(number) {
  const s = String(number || '').trim();
  const m = s.match(/^([A-Z]{1,5})0*(\d+)$/);
  return m ? `${m[1]} ${m[2]}` : s;
}

// Ceremonial resolutions recognise, honour or remember someone; they carry no policy.
const CEREMONIAL = /^(a resolution )?(recogniz|recognis|honou?r|memorializ|celebrat|congratulat|commemorat|acknowledg|reaffirming the commitment of sister|designating .* as .* (day|week|month))/i;

/** True for "Recognizing…", "Honoring…", "Memorializing…" and similar resolutions. */
export function isCeremonial(title) {
  return CEREMONIAL.test(String(title || '').trim());
}

const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with']);

/**
 * Some city titles arrive in all capitals. Show them in title case (proper names such as
 * "Monroe County" stay right), keeping short words in brackets (acronyms such as "(CJAM)")
 * and roman numerals in capitals. Titles that are not mostly capitals are left as they are.
 */
export function readableTitle(title) {
  const s = String(title || '').trim();
  const letters = s.replace(/[^A-Za-z]/g, '');
  if (letters.length < 12) return s;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  if (upper / letters.length < 0.85) return s;
  const keep = new Set();
  for (const m of s.matchAll(/\(([A-Z]{2,6})\)/g)) keep.add(m[1]);
  let first = true;
  return s.toLowerCase().replace(/[a-z]+(?:'[a-z]+)?/g, (w, offset, whole) => {
    const up = w.toUpperCase();
    const atStart = first || /[:(]\s*$/.test(whole.slice(0, offset));
    first = false;
    if (keep.has(up) || /^(ii|iii|iv|vi|vii|viii|ix|xi|xii)$/.test(w)) return up;
    if (!atStart && SMALL_WORDS.has(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
}

const POSITION_WORDS = {
  yea: 'Yes',
  yes: 'Yes',
  aye: 'Yes',
  nay: 'No',
  no: 'No',
  present: 'Present',
  abstain: 'Abstain',
  absent: 'Absent',
  not_voting: 'Did not vote',
  'not voting': 'Did not vote',
  nv: 'Did not vote',
  excused: 'Excused',
};

/** Plain words for a vote position. */
export function positionWord(position) {
  const key = String(position || '').trim().toLowerCase();
  return POSITION_WORDS[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Unknown');
}

/** 'yes' | 'no' | 'other', for the ballot-mark style. */
export function positionKind(position) {
  const w = positionWord(position);
  if (w === 'Yes') return 'yes';
  if (w === 'No') return 'no';
  return 'other';
}

const OUTCOME_WORDS = { passed: 'Passed', failed: 'Failed', vetoed: 'Vetoed', adopted: 'Adopted' };

/** "passed" -> "Passed"; display text the API already sends ("Pending", "In Committee") passes through. */
export function outcomeWord(outcome) {
  if (!outcome) return '';
  return OUTCOME_WORDS[String(outcome).toLowerCase()] || outcome;
}

/** True when an outcome or status means the measure did not go through. */
export function isNegativeOutcome(outcome) {
  return /^(failed|vetoed|withdrawn|died)/i.test(String(outcome || ''));
}

/**
 * True when the vote question already says how it ended ("Amendment #12 failed", "Concurrence defeated").
 * The page then shows the question alone, so a separate result word can never contradict it.
 */
export function questionStatesOutcome(question) {
  return /\b(failed|defeated|adopted|passed|prevailed|concurred|withdrawn|rejected|agreed to)\s*$/i.test(String(question || '').trim());
}

/**
 * The result word to show beside a vote, or '' when it would contradict the question text
 * (the source records "Concurrence defeated" as passed, for example).
 */
export function voteResultWord(question, result) {
  const word = outcomeWord(result);
  if (!word || !questionStatesOutcome(question)) return word;
  const saysNegative = /\b(failed|defeated|withdrawn|rejected)\s*$/i.test(String(question).trim());
  return saysNegative === isNegativeOutcome(word) ? word : '';
}

/** "7 yes, 0 no" (and abstentions when there were any). */
export function tallyText({ yes, no, abstain } = {}) {
  if (yes == null || no == null) return '';
  const parts = [`${yes} yes`, `${no} no`];
  if (abstain) parts.push(`${abstain} abstain`);
  return parts.join(', ');
}

// "A", "A and B", "A, B and C".
export function joinNames(list) {
  const names = (list || []).map((p) => (typeof p === 'string' ? p : p && p.name)).filter(Boolean);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** "Sponsored by A, co-sponsored by B"; '' when nobody is named. Role 'cosponsor' is a co-sponsor; anything else a sponsor. */
export function sponsorLine(list) {
  const l = list || [];
  const sponsors = joinNames(l.filter((p) => p.role !== 'cosponsor'));
  const cosponsors = joinNames(l.filter((p) => p.role === 'cosponsor'));
  if (sponsors && cosponsors) return `Sponsored by ${sponsors}, co-sponsored by ${cosponsors}`;
  if (sponsors) return `Sponsored by ${sponsors}`;
  if (cosponsors) return `Co-sponsored by ${cosponsors}`;
  return '';
}

/**
 * Roll-call votes (one row per vote) grouped into one entry per bill, newest bill first,
 * keeping each bill's votes newest first.
 */
export function groupVotesByBill(votes) {
  const byBill = new Map();
  for (const v of votes || []) {
    const key = v.bill_id || v.bill_number || v.id;
    if (!byBill.has(key)) {
      byBill.set(key, {
        key,
        bill_id: v.bill_id,
        number: v.bill_number,
        title: v.bill_title || v.vote_question,
        url: v.bill_url,
        votes: [],
      });
    }
    byBill.get(key).votes.push(v);
  }
  const groups = [...byBill.values()];
  for (const g of groups) g.votes.sort((a, b) => String(b.vote_date).localeCompare(String(a.vote_date)));
  groups.sort((a, b) => String(b.votes[0].vote_date).localeCompare(String(a.votes[0].vote_date)));
  return groups;
}

/** Counts of each position word: { Yes: 64, No: 36 }. */
export function countPositions(positions) {
  const counts = {};
  for (const p of positions || []) {
    const w = positionWord(p);
    counts[w] = (counts[w] || 0) + 1;
  }
  return counts;
}

const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
};

// ["2025 Indiana Regular Session", "2026 Indiana Regular Session"] -> "2025 and 2026 Indiana Regular Sessions".
function sessionsText(sessions) {
  if (!sessions.length) return '';
  const parts = sessions.map((s) => s.match(/^(\d{4}(?:-\d{4})?)\s+(.+?)\s+Session$/i));
  if (sessions.length > 1 && parts.every(Boolean) && new Set(parts.map((p) => p[2])).size === 1) {
    return `${joinNames(parts.map((p) => p[1]))} ${parts[0][2]} Sessions`;
  }
  return joinNames(sessions);
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/**
 * Where a legislative record comes from, read from its source links.
 * Returns { level: 'federal' | 'state' | null, body, detail }, for example
 * { level: 'federal', body: 'U.S. Congress', detail: '117th Congress, 2021–2022' }.
 */
export function recordSource({ bills = [], votes = [] } = {}) {
  const urls = [...votes.map((v) => v.bill_url), ...bills.map((b) => b.url)].filter(Boolean);
  for (const url of urls) {
    const congress = url.match(/congress\.gov\/bill\/(\d+)(?:st|nd|rd|th)-congress/);
    if (congress) {
      const n = parseInt(congress[1], 10);
      const start = 1789 + 2 * (n - 1);
      return { level: 'federal', body: 'U.S. Congress', detail: `${ordinal(n)} Congress, ${start}–${start + 1}` };
    }
    const legiscan = url.match(/legiscan\.com\/([A-Z]{2})\//);
    if (legiscan) {
      if (legiscan[1] === 'US') return { level: 'federal', body: 'U.S. Congress', detail: '' };
      const state = STATE_NAMES[legiscan[1]];
      const sessions = [...new Set(bills.map((b) => b.session_name).filter(Boolean))].sort();
      return {
        level: 'state',
        body: state ? `${state} Legislature` : 'State legislature',
        detail: sessionsText(sessions),
      };
    }
  }
  return { level: null, body: '', detail: '' };
}

/** 'federal' | 'state' | 'local' | null, from the person's current district type ("STATE_LOWER", "LOCAL_EXEC"...). */
export function officeLevel(districtType) {
  const t = String(districtType || '').toUpperCase();
  if (t.startsWith('NATIONAL')) return 'federal';
  if (t.startsWith('STATE')) return 'state';
  if (t.startsWith('LOCAL') || t.startsWith('COUNTY') || t.startsWith('SCHOOL') || t.startsWith('JUDICIAL')) return 'local';
  return null;
}

/**
 * A sentence saying the record is from an earlier office, or '' when it matches the current one.
 * "These votes are from Karen Bass's time in the U.S. Congress. Karen Bass now serves as Mayor."
 */
export function earlierOfficeNote({ name, districtType, officeTitle, source }) {
  const now = officeLevel(districtType);
  if (!source || !source.level || !now || now === source.level) return '';
  const who = name || 'This person';
  const where = source.body === 'U.S. Congress' ? 'Congress' : `the ${source.body}`;
  const nowText = officeTitle ? ` ${who} now serves as ${officeTitle}.` : '';
  return `This record is from ${who}’s time in ${where}.${nowText}`;
}

/** Committee roles ordered chair first, then vice chair, ranking member, member. */
export function sortCommittees(committees) {
  const rank = (role) => {
    const r = String(role || '').toLowerCase();
    if (r === 'chair' || r === 'chairman' || r === 'chairwoman') return 0;
    if (r.includes('vice')) return 1;
    if (r.includes('ranking')) return 2;
    if (r === 'member' || !r) return 4;
    return 3;
  };
  return [...(committees || [])].sort(
    (a, b) => rank(a.role) - rank(b.role) || String(a.committee_name).localeCompare(String(b.committee_name)),
  );
}

/** "ranking_member" -> "Ranking member", "chair" -> "Chair". */
export function roleWord(role) {
  const r = String(role || 'member').replace(/_/g, ' ').trim().toLowerCase();
  return r.charAt(0).toUpperCase() + r.slice(1);
}

/** Short label for a compass category: "Healthcare and Social Safety Nets" -> "Healthcare". */
export function shortCategory(title) {
  return String(title || '').split(/,| and | & /)[0].trim();
}

function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

function committeeSentence(name, committees) {
  const list = committees || [];
  if (!list.length) return '';
  const lead = sortCommittees(list)
    .filter((c) => !/^member$/i.test(String(c.role || 'member')))
    .map((c) => `${roleWord(c.role).toLowerCase()} of ${c.committee_name}`);
  const roles = lead.length ? ` and is ${joinNames(lead)}` : '';
  return `${name} sits on ${plural(list.length, 'committee')}${roles}.`;
}

function positionStats(positions) {
  const counts = countPositions(positions);
  const stats = [];
  if (counts.Yes) stats.push({ label: 'Voted yes', value: counts.Yes });
  if (counts.No) stats.push({ label: 'Voted no', value: counts.No });
  for (const [word, value] of Object.entries(counts)) {
    if (word !== 'Yes' && word !== 'No') stats.push({ label: word, value });
  }
  return stats;
}

/**
 * The "At a glance" box for a state or federal record: plain sentences and the counts behind them.
 * Ceremonial resolutions are counted apart from bills.
 */
export function legislativeGlance({ name, committees = [], bills = [], votes = [] }) {
  const who = name || 'This person';
  const ceremonial = bills.filter((b) => isCeremonial(b.title)).length;
  const real = bills.filter((b) => !isCeremonial(b.title));
  const sponsored = real.filter((b) => b.is_sponsor).length;
  const cosponsored = real.length - sponsored;
  const sentences = [];
  const c = committeeSentence(who, committees);
  if (c) sentences.push(c);
  if (bills.length) {
    let s = `${c ? 'They' : who} sponsored ${plural(sponsored, 'bill')} and co-sponsored ${cosponsored}`;
    if (ceremonial) s += `, not counting ${plural(ceremonial, 'ceremonial resolution')}`;
    sentences.push(`${s}.`);
  }
  if (votes.length) {
    const billCount = groupVotesByBill(votes).length;
    sentences.push(`This record has ${plural(votes.length, 'vote')} on ${plural(billCount, 'bill')}${rangeClause(votes.map((v) => v.vote_date))}.`);
  }
  if (!bills.length && !committees.length && votes.length) {
    sentences.push('No sponsored bills or committee seats are on file for it.');
  }
  const stats = [];
  if (votes.length) stats.push({ label: 'Votes on file', value: votes.length }, ...positionStats(votes.map((v) => v.position)));
  if (bills.length) stats.push({ label: 'Bills sponsored', value: sponsored }, { label: 'Co-sponsored', value: cosponsored });
  return { sentences, stats };
}

/** The "At a glance" box for a city council member. */
export function councilGlance({ name, committees = [], items = [], sponsorships = [] }) {
  const who = name || 'This member';
  const calls = items.flatMap((i) => i.votes || []);
  const dates = items.flatMap((i) => [...(i.votes || []).map((v) => v.meeting_date), i.pending && i.pending.meeting_date]);
  const sentences = [];
  const c = committeeSentence(who, committees);
  if (c) sentences.push(c);
  if (sponsorships.length) {
    const ceremonial = sponsorships.filter((s) => isCeremonial(s.title)).length;
    let s = `The city's records name ${c ? 'them' : who} as sponsor or co-sponsor on ${plural(sponsorships.length, 'item')}`;
    if (ceremonial) s += `, ${ceremonial} of them ceremonial`;
    sentences.push(`${s}.`);
  }
  if (items.length) {
    sentences.push(`This record has ${plural(calls.length, 'vote')} on ${plural(items.length, 'item')}${rangeClause(dates.filter(Boolean))}.`);
  }
  const stats = [];
  if (calls.length) stats.push({ label: 'Votes on file', value: calls.length }, ...positionStats(calls.map((v) => v.position)));
  if (sponsorships.length) stats.push({ label: 'Items sponsored', value: sponsorships.length });
  return { sentences, stats };
}
