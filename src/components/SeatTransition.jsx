import { Link } from 'react-router-dom';
import { CASES } from '../lib/seatTransition.js';

/**
 * SeatTransition — the "who is arriving in this seat" block, rendered into PoliticianCard's
 * existing `footer` slot.
 *
 * 🔴 THIS COMPONENT DECIDES NOTHING. Every judgement — which case a seat is in, what the
 * sentence says, whether the winner is the sitting person — is made in src/lib/seatTransition.js
 * and tested there without a browser. This file turns a model into markup and no more.
 *
 * 🔴 IT DOES NOT TOUCH PoliticianCard. That component ships from @empoweredvote/ev-ui and its
 * `footer` prop already accepts any node, so the transition block composes beside IconOverlay
 * without a package change. (The local src/components/PoliticianCard.jsx is dead code that
 * nothing imports — do not edit that either.)
 */

/**
 * The cases that draw an arrow from the current holder to the incoming one.
 *
 * 🔴 BOTH RE-ELECTION CASES ARE ABSENT ON PURPOSE. An arrow from someone to themselves reads as
 * a bug, and together they are the majority of this feature: 451 of the 638 dated seats and 914
 * of the 1,419 result-only ones. RESULT_PARTIAL is absent too — a staggered body with five
 * members and three seats up would draw an arrow from five people to three and tell a voter the
 * body is shrinking.
 *
 * Exported so the test can assert the membership directly rather than inferring it from markup.
 */
export const ARROW_CASES = [CASES.DATED_HANDOVER, CASES.RESULT_GROUP];

/**
 * Whether there is anything to draw. A seat not in transition — which is almost every seat —
 * must add nothing at all to the card, not an empty box.
 */
export function shouldRender(model) {
  return !!(model && model.case !== CASES.NONE && model.lines && model.lines.length > 0);
}

/**
 * 🔴 A WINNER WITH NO POLITICIAN RECORD IS TEXT, NEVER A LINK. 237 winner rows are named from
 * race_candidates and have no profile page; /politician/null is a dead page, and a link that
 * goes nowhere is worse than plain text because it invites the click.
 */
function Person({ person }) {
  const name = person.name || 'Name not recorded';
  return person.id ? (
    <Link
      to={`/politician/${person.id}`}
      onClick={(e) => e.stopPropagation()}
      className="font-semibold no-underline text-[#00657c] dark:text-ev-teal-light"
    >
      {name}
    </Link>
  ) : (
    <span className="font-semibold">{name}</span>
  );
}

export default function SeatTransition({ model }) {
  if (!shouldRender(model)) return null;

  const drawsArrow = ARROW_CASES.includes(model.case);
  const people = Array.isArray(model.people) ? model.people : [];

  // The lines already contain the winners' names for the cases that list them inline
  // (RESULT_HANDOVER, RESULT_PARTIAL). Only the arrow cases render people separately, so the
  // same name is never shown twice.
  const namesAreInTheLines = !drawsArrow;

  return (
    <div
      data-seat-transition={model.case}
      // 🔴 COLOUR IS A CLASS WITH A dark: VARIANT, NEVER AN INLINE HEX. The first version used
      // inline '#334155' on the text and rgba(0,0,0,0.08) on the divider; on the dark theme that
      // is slate on near-black and a black line on black, and the production render showed the
      // sentence was barely legible. Inline colour cannot respond to the theme.
      // At phone width a three-person group wraps onto further lines rather than scrolling
      // sideways; a horizontal scroll inside a card is invisible and loses the last name.
      className="mt-1.5 pt-1.5 flex flex-col gap-0.5 border-t text-[13px] leading-snug
                 border-black/10 dark:border-white/15
                 text-slate-700 dark:text-gray-300"
    >
      {drawsArrow && (
        <span aria-hidden="true" className="text-sm leading-none text-slate-500 dark:text-gray-400">
          ↓
        </span>
      )}

      {model.lines.map((line, i) => (
        <span key={i} className={i === 0 ? 'font-semibold' : undefined}>
          {line}
        </span>
      ))}

      {!namesAreInTheLines && people.length > 0 && (
        <span className="flex flex-wrap gap-x-2">
          {people.map((person, i) => (
            <Person key={person.id || `${person.name}-${i}`} person={person} />
          ))}
        </span>
      )}
    </div>
  );
}
