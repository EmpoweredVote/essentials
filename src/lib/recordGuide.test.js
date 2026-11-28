import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateRange,
  formatBillNumber,
  isCeremonial,
  readableTitle,
  positionWord,
  positionKind,
  groupVotesByBill,
  recordSource,
  earlierOfficeNote,
  sortCommittees,
  legislativeGlance,
  councilGlance,
  shortCategory,
  questionStatesOutcome,
  voteResultWord,
} from './recordGuide';

describe('dates and numbers', () => {
  it('formats dates from the text, not the timezone', () => {
    expect(formatDate('2026-02-27T00:00:00.000Z')).toBe('Feb 27, 2026');
  });
  it('shortens a range within one year', () => {
    expect(formatDateRange(['2026-02-27', '2026-02-23'])).toBe('Feb 23 – Feb 27, 2026');
    expect(formatDateRange(['2020-12-02', '2026-11-04'])).toBe('Dec 2, 2020 – Nov 4, 2026');
  });
  it('drops leading zeros from state bill numbers only', () => {
    expect(formatBillNumber('SB0239')).toBe('SB 239');
    expect(formatBillNumber('HCR0024')).toBe('HCR 24');
    expect(formatBillNumber('HR 8404')).toBe('HR 8404');
    expect(formatBillNumber('Ord 2026-22')).toBe('Ord 2026-22');
  });
});

describe('ceremonial resolutions', () => {
  it('recognises recognitions, honors and memorials', () => {
    expect(isCeremonial('Memorializing Lee Hamilton.')).toBe(true);
    expect(isCeremonial('Recognizing Heisman Trophy winner Fernando Mendoza.')).toBe(true);
    expect(isCeremonial('Honoring Don Fischer.')).toBe(true);
    expect(isCeremonial('Celebrating the 25th anniversary of the Adopt-A-Block program.')).toBe(true);
  });
  it('leaves policy bills alone', () => {
    expect(isCeremonial('Natural resource entrance fees.')).toBe(false);
    expect(isCeremonial('Signal jamming devices.')).toBe(false);
    expect(isCeremonial('Condemning religious persecution worldwide.')).toBe(false);
  });
});

describe('readableTitle', () => {
  it('turns all-capital city titles into title case and keeps acronyms', () => {
    expect(readableTitle('APPROVING AGREEMENT WITH THE COMMUNITY JUSTICE AND MEDIATION CENTER (CJAM) TO FACILITATE SESSIONS')).toBe(
      'Approving Agreement with the Community Justice and Mediation Center (CJAM) to Facilitate Sessions',
    );
  });
  it('leaves mixed-case titles as written', () => {
    const t = 'To Amend Title 2 of the Bloomington Municipal Code Entitled "Administration and Personnel"';
    expect(readableTitle(t)).toBe(t);
  });
});

describe('positions', () => {
  it('uses plain words and ballot-mark kinds', () => {
    expect(positionWord('yea')).toBe('Yes');
    expect(positionWord('nay')).toBe('No');
    expect(positionWord('not_voting')).toBe('Did not vote');
    expect(positionKind('yea')).toBe('yes');
    expect(positionKind('absent')).toBe('other');
  });
});

describe('groupVotesByBill', () => {
  it('puts every vote on a bill under one entry, newest first', () => {
    const groups = groupVotesByBill([
      { id: 1, bill_id: 'a', bill_number: 'SB0239', bill_title: 'Education', vote_date: '2026-02-24' },
      { id: 2, bill_id: 'b', bill_number: 'SB0256', bill_title: 'Foreign agents', vote_date: '2026-02-26' },
      { id: 3, bill_id: 'a', bill_number: 'SB0239', bill_title: 'Education', vote_date: '2026-02-27' },
    ]);
    expect(groups.map((g) => g.number)).toEqual(['SB0239', 'SB0256']);
    expect(groups[0].votes.map((v) => v.id)).toEqual([3, 1]);
  });
});

describe('where the record comes from', () => {
  it('reads Congress and its years from a congress.gov link', () => {
    const s = recordSource({ votes: [{ bill_url: 'https://www.congress.gov/bill/117th-congress/house-bill/8404' }] });
    expect(s).toEqual({ level: 'federal', body: 'U.S. Congress', detail: '117th Congress, 2021–2022' });
  });
  it('reads the state from a LegiScan link and names its sessions', () => {
    const s = recordSource({
      bills: [
        { url: 'https://legiscan.com/IN/bill/HB1204/2026', session_name: '2026 Indiana Regular Session' },
        { url: 'https://legiscan.com/IN/bill/HB1245/2025', session_name: '2025 Indiana Regular Session' },
      ],
    });
    expect(s).toEqual({ level: 'state', body: 'Indiana Legislature', detail: '2025 and 2026 Indiana Regular Sessions' });
  });
  it('says when the record is from an earlier office', () => {
    const source = { level: 'federal', body: 'U.S. Congress' };
    expect(earlierOfficeNote({ name: 'Karen Bass', districtType: 'LOCAL_EXEC', officeTitle: 'Mayor', source })).toBe(
      'This record is from Karen Bass’s time in Congress. Karen Bass now serves as Mayor.',
    );
    expect(earlierOfficeNote({ name: 'A', districtType: 'NATIONAL_LOWER', source })).toBe('');
  });
});

describe('At a glance', () => {
  it('counts ceremonial resolutions apart from bills', () => {
    const g = legislativeGlance({
      name: 'Matt Pierce',
      committees: [{ committee_name: 'Utilities', role: 'ranking_member' }, { committee_name: 'Ethics', role: 'member' }],
      bills: [
        { title: 'Signal jamming devices.', is_sponsor: true },
        { title: 'Natural resource entrance fees.', is_sponsor: false },
        { title: 'Honoring Don Fischer.', is_sponsor: false },
      ],
      votes: [
        { bill_id: 'a', position: 'yea', vote_date: '2026-02-27' },
        { bill_id: 'a', position: 'nay', vote_date: '2026-02-24' },
      ],
    });
    expect(g.sentences).toEqual([
      'Matt Pierce sits on 2 committees and is ranking member of Utilities.',
      'They sponsored 1 bill and co-sponsored 1, not counting 1 ceremonial resolution.',
      'This record has 2 votes on 1 bill, from Feb 24 to Feb 27, 2026.',
    ]);
    expect(g.stats).toEqual([
      { label: 'Votes on file', value: 2 },
      { label: 'Voted yes', value: 1 },
      { label: 'Voted no', value: 1 },
      { label: 'Bills sponsored', value: 1 },
      { label: 'Co-sponsored', value: 1 },
    ]);
  });
  it('says plainly when only votes are on file', () => {
    const g = legislativeGlance({ name: 'Karen Bass', votes: [{ bill_id: 'a', position: 'yea', vote_date: '2022-12-08' }] });
    expect(g.sentences[1]).toBe('No sponsored bills or committee seats are on file for it.');
  });
  it('counts a council member’s roll calls', () => {
    const g = councilGlance({
      name: 'Isabel Piedmont-Smith',
      items: [{ votes: [{ position: 'yea', meeting_date: '2026-10-07' }, { position: 'nay', meeting_date: '2026-10-07' }] }],
      sponsorships: [{ title: 'Prohibiting use of plate readers' }],
    });
    expect(g.stats.map((s) => s.value)).toEqual([2, 1, 1, 1]);
  });
});

describe('committees and categories', () => {
  it('puts chairs first', () => {
    const sorted = sortCommittees([{ committee_name: 'B', role: 'member' }, { committee_name: 'A', role: 'chair' }]);
    expect(sorted[0].role).toBe('chair');
  });
  it('shortens Compass category names', () => {
    expect(shortCategory('Healthcare and Social Safety Nets')).toBe('Healthcare');
    expect(shortCategory('Governance, Democracy, and Institutional Reform')).toBe('Governance');
    expect(shortCategory('Judicial & Legal')).toBe('Judicial');
  });
});

describe('questionStatesOutcome', () => {
  it('spots a question that already says how it ended, so no result word can contradict it', () => {
    expect(questionStatesOutcome('House - Concurrence defeated')).toBe(true);
    expect(questionStatesOutcome('House - Amendment #12 (DeLaney) failed')).toBe(true);
    expect(questionStatesOutcome('House - Third reading')).toBe(false);
  });
});

describe('voteResultWord', () => {
  it('keeps a result that agrees with the question and drops one that contradicts it', () => {
    expect(voteResultWord('House - Amendment #12 (DeLaney) failed', 'failed')).toBe('Failed');
    expect(voteResultWord('House - Concurrence defeated', 'passed')).toBe('');
    expect(voteResultWord('House - Third reading', 'passed')).toBe('Passed');
  });
});
