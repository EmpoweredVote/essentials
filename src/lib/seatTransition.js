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

  if (!pol.pending_winner || winnersOf(pol).length === 0) return NOTHING;

  // A single-seat body is unambiguous: this winner takes this seat. Anything else is a group
  // question and belongs to buildGroupTransition, which can see the sibling rows.
  const group = pol.seat_group;
  if (!group || group.offices === 1) return singleSeatResult(pol);

  return NOTHING;
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

  return {
    case: CASES.RESULT_PARTIAL,
    lines: [`${people.length} seats elected ${day}:`, ...people.map((p) => p.name)],
    people,
  };
}
