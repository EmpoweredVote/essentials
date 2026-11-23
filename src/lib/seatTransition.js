/**
 * seatTransition — decide what a seat's transition block says, from the API's transition fields.
 *
 * PURE LOGIC. No JSX, no DOM, no fetch. The component renders what these functions return and
 * decides nothing, which is what lets the whole display be tested without a browser.
 *
 * THE FIVE CASES, and why each exists:
 *
 *   DATED_HANDOVER    A dated term exists and it belongs to someone else. Current -> arrow ->
 *                     incoming, with the date. 172 of the 638 dated seats.
 *   DATED_REELECTION  A dated term exists and it belongs to the person already sitting there.
 *                     451 of the 638. 🔴 NO ARROW: an arrow from someone to themselves reads as
 *                     a bug, so this is one quiet line instead.
 *   RESULT_HANDOVER   No term, but a recorded election result, and the district holds exactly
 *                     this one seat. We know who won; we do not know when they start.
 *   RESULT_REELECTION The same, where the winner is the sitting person. 914 of the 1,419
 *                     result-only seats — the single most common card in the feature. Rendered
 *                     like a handover it would read "Jane Doe ... winner: Jane Doe".
 *   RESULT_GROUP      A multi-seat body whose outgoing and incoming groups can both be named.
 *   RESULT_PARTIAL    A multi-seat body where they cannot. Body-level line, no arrow.
 *
 * 🔴 A RESULT IS NOT A TERM. An election result records who won a count. Taking office is a
 * separate, later event: people decline, resign and die in between, and a result that is merely
 * "called" can still be reversed in the canvass. Every RESULT_* string says so; none of them
 * asserts a date we do not have.
 */

export const CASES = {
  DATED_HANDOVER: 'dated_handover',
  DATED_REELECTION: 'dated_reelection',
  RESULT_HANDOVER: 'result_handover',
  RESULT_REELECTION: 'result_reelection',
  RESULT_GROUP: 'result_group',
  RESULT_PARTIAL: 'result_partial',
  NONE: 'none',
};

const NOTHING = Object.freeze({ case: CASES.NONE, lines: [], people: [] });

/**
 * 🔴 PARSE THE PARTS, NEVER new Date(iso). `new Date('2026-11-03')` is UTC midnight, which is
 * November 2nd at 4pm in California — where most of this site's readers are. Formatting that
 * would move every election one day earlier for them.
 */
function parts(iso) {
  if (typeof iso !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** '2026-11-03' -> 'November 3'. The year is omitted: the card is about this cycle. */
export function formatElectionDay(iso) {
  const p = parts(iso);
  if (!p || !MONTHS[p.mo - 1]) return '';
  return `${MONTHS[p.mo - 1]} ${p.d}`;
}

/** '2026-12-14' -> 'December 14, 2026'. The year is kept: a term start can be next year. */
export function formatTermStart(iso) {
  const p = parts(iso);
  if (!p || !MONTHS[p.mo - 1]) return '';
  return `${MONTHS[p.mo - 1]} ${p.d}, ${p.y}`;
}

/**
 * 🔴 A NULL ID IS NOT A MATCH. Both a vacant seat's row id and an unrecorded winner's id are
 * null, and 237 winners have no politician record. Comparing them loosely would make every
 * unidentified winner in an empty seat look like a re-election of nobody.
 */
function samePerson(rowId, winnerId) {
  return !!rowId && !!winnerId && String(rowId) === String(winnerId);
}

function winnersOf(pol) {
  const w = pol && pol.pending_winner && pol.pending_winner.winners;
  return Array.isArray(w) ? w : [];
}

/** The result-only copy for one seat. Hedged while the count is only 'called'. */
function singleSeatResult(pol) {
  const pw = pol.pending_winner;
  const day = formatElectionDay(pw.election_date);
  const certified = pw.certainty === 'certified';
  const winners = winnersOf(pol);

  if (winners.length === 1 && samePerson(pol.id, winners[0].id)) {
    return {
      case: CASES.RESULT_REELECTION,
      lines: [
        certified
          ? `Re-elected ${day} — date of the new term not yet confirmed`
          : `Declared re-elected ${day} — date of the new term not yet confirmed`,
      ],
      people: [],
    };
  }

  return {
    case: CASES.RESULT_HANDOVER,
    lines: certified
      ? [`Won the ${day} election:`, ...winners.map((w) => w.name)]
      : [`Declared winner, ${day}:`, ...winners.map((w) => w.name), 'Count not yet certified'],
    people: winners,
  };
}

/**
 * One seat's transition block.
 *
 * @param {object} pol a politician/seat row from the API
 * @returns {{case: string, lines: string[], people: {id: string|null, name: string}[]}}
 */
export function buildSeatTransition(pol) {
  if (!pol) return NOTHING;

  // A DATED TERM ALWAYS WINS. It is the stronger fact, and the two API fields are disjoint by
  // construction anyway — an office with a dated term never carries a pending winner.
  if (pol.incoming_on) {
    const when = formatTermStart(pol.incoming_on);
    if (samePerson(pol.id, pol.incoming_holder_id)) {
      return {
        case: CASES.DATED_REELECTION,
        lines: [`Re-elected — next term begins ${when}`],
        people: [],
      };
    }
    return {
      case: CASES.DATED_HANDOVER,
      lines: [`Takes office ${when}`],
      people: [{ id: pol.incoming_holder_id ?? null, name: pol.incoming_holder_name ?? '' }],
    };
  }

  const winners = winnersOf(pol);
  if (!pol.pending_winner || winners.length === 0) return NOTHING;

  // 🔴 THE TEST IS HOW MANY WINNERS ARE ON *THIS OFFICE'S* RACE, NOT HOW MANY SEATS THE BODY HAS.
  //
  // The group display exists for one reason: a multi-seat race attaches ALL its winners to ONE
  // office row, so we know the group and not the mapping (spec §4). When this office carries its
  // own race with exactly ONE winner, the mapping IS known — this person won THIS seat — and the
  // group treatment would throw that away.
  //
  // Measured on prod 2026-11-21: 46 multi-seat groups, 92 offices, have one race per office with
  // exactly one winner each. Keying on seat_group.offices described all 92 as a group: Washington
  // LD 1's two re-elected members became one card reading "Declared winners ... Davina Duerr ·
  // Shelley Kloba" under Kloba's photo, with an arrow — a false handover AND the self-pointing
  // arrow the no-arrow rule exists to remove — while 23 genuine per-seat handovers elsewhere were
  // buried in a list that claimed nothing about which seat each belonged to.
  if (winners.length === 1) return singleSeatResult(pol);

  // Several winners on one office row: only buildGroupTransition can see the sibling seats they
  // have to be spread across.
  return NOTHING;
}

/**
 * The transition block for one seat, choosing between a per-seat and a per-body statement.
 *
 * 🔴 `allRows` MUST BE THE WHOLE RESPONSE, NEVER THE SUBGROUP BEING RENDERED. The group key is
 * (district_id, chamber_id), but the page splits one body into role subgroups — a Mayor in EXEC,
 * their council in MEMBER, a clerk in ADMIN. Handed a subgroup, this function saw a body of one
 * and described a re-elected mayor as "1 seat elected November 3: <their own name>", with a body
 * count that was wrong as well. The counts always come from seat_group, which is computed across
 * the whole body in SQL; `allRows` only decides which sibling draws the block and which winners
 * are listed.
 *
 * @param {object} pol the seat being rendered
 * @param {object[]} allRows every seat row in the response
 */
export function buildTransitionModel(pol, allRows) {
  if (!pol) return NOTHING;

  // A dated term, or this office's own single-winner race, is a statement about THIS seat and
  // needs no siblings to make it.
  const direct = buildSeatTransition(pol);
  if (direct.case !== CASES.NONE) return direct;

  const groupId = pol.seat_group && pol.seat_group.group_id;
  if (!groupId) return NOTHING;

  const siblings = (Array.isArray(allRows) ? allRows : []).filter(
    (r) => r && r.seat_group && r.seat_group.group_id === groupId
  );
  if (siblings.length === 0) return NOTHING;

  // Only a body where SOME office carries several winners needs the group display at all; every
  // other multi-seat body has already been answered seat by seat above.
  const needsGroup = siblings.some(
    (r) => r.pending_winner && Array.isArray(r.pending_winner.winners) && r.pending_winner.winners.length > 1
  );
  if (!needsGroup) return NOTHING;

  // 🔴 ONE BODY, ONE STATEMENT. Ordered by office_id so it is the same seat on every render.
  const ordered = [...siblings].sort((a, b) =>
    String(a.office_id || '').localeCompare(String(b.office_id || ''))
  );
  if (ordered[0].office_id !== pol.office_id) return NOTHING;

  const model = buildGroupTransition(ordered);
  if (model.case === CASES.NONE) return NOTHING;

  // ⚠ THE BLOCK SITS UNDER ONE PERSON'S PHOTO AND IS ABOUT THE WHOLE BODY. Without a heading a
  // voter reads it as a claim about the seat it is printed under. Spec §7.2(c) shows the body
  // named above the card; this carries that name with the model so the renderer can.
  const heading = ordered[0].chamber_name || ordered[0].office_title;
  return heading ? { ...model, heading } : model;
}

/**
 * A multi-seat body's transition block, from every sibling row sharing one group_id.
 *
 * 🔴 THE SIBLINGS ARE THE WHOLE POINT. A multi-seat race attaches ALL its winners to ONE office
 * row — measured live at Maryland District 19, 1 of the 3 rows carries the result — so the other
 * seats know nothing and would read as "nobody is coming". AN OFFICE WITH NO RACE IS INVISIBLE,
 * NOT INCOMPLETE. The winners are unioned across the group and the counts come from the group.
 *
 * @param {object[]} rows sibling seat rows sharing a seat_group.group_id
 */
export function buildGroupTransition(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return NOTHING;

  const group = rows.find((r) => r && r.seat_group)?.seat_group;
  if (!group) return NOTHING;

  const withResult = rows.filter((r) => r && r.pending_winner && winnersOf(r).length > 0);
  if (withResult.length === 0) return NOTHING;

  const people = withResult.flatMap(winnersOf);
  const day = formatElectionDay(withResult[0].pending_winner.election_date);

  // 🔴 A GROUP IS ONLY AS CERTIFIED AS ITS WEAKEST ROW. The sentence is a claim about all of
  // them, so one called row holds the whole group at the hedged wording.
  const certified = withResult.every((r) => r.pending_winner.certainty === 'certified');

  // 🔴 THE THREE NUMBERS MUST ALL AGREE BEFORE AN ARROW IS DRAWN. A staggered body — five
  // members with three seats up — would otherwise draw an arrow from five people to three and
  // tell a voter the body is shrinking. `winners > offices` is a data defect and lands here too,
  // which is correct: it degrades to the body-level line rather than throwing.
  const whole =
    group.offices > 1 && group.offices === group.winners && group.offices === group.seated;

  if (whole) {
    return {
      case: CASES.RESULT_GROUP,
      lines: [
        certified
          ? `Won the ${day} election`
          : `Declared winners, ${day} — count not yet certified`,
      ],
      people,
    };
  }

  // ⚠ "1 seats elected May 2" reached a rendered card before this was pluralised. The incomplete
  // case is exactly where a body has FEWER winners than seats — Fort Worth District 3 is 11
  // offices and one recorded winner — so a count of one is routine here, not an edge case.
  const seatWord = people.length === 1 ? 'seat' : 'seats';

  return {
    case: CASES.RESULT_PARTIAL,
    lines: [`${people.length} ${seatWord} elected ${day}:`, ...people.map((p) => p.name)],
    people,
  };
}

/**
 * The one sentence a person's OWN profile page shows when they are arriving into a seat.
 *
 * 🔴 THE OPPOSITE QUESTION TO EVERY OTHER FIELD ON THAT PAGE. The rest answer "what does this
 * person hold now"; this answers "what are they about to hold". 136 people carry a future term
 * and no current seat, so office_current_holder resolves nothing for them and the whole office
 * block renders empty — and that is exactly the page a voter reaches by clicking the incoming
 * name on an address result.
 *
 * ⚠ BOTH HALVES OR NEITHER. A seat with no date, or a date with no seat, is a half-statement;
 * the page says nothing rather than something it cannot finish.
 */
export function arrivingNote(pol) {
  if (!pol) return null;
  const title = pol.arriving_office_title;
  const when = formatTermStart(pol.arriving_on);
  if (!title || !when) return null;
  return `Takes office as ${title} on ${when}`;
}
