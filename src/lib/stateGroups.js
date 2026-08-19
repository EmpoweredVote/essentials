// src/lib/stateGroups.js
// Pure function — no React import, no I/O, mirrors bannerProps/resolvePopulation's
// no-side-effects convention so it can be unit-tested without jsdom.

/**
 * Read the state a government body belongs to, from the officials inside it.
 *
 * `representing_state` (a two-letter abbrev) is on every state-tier official in the
 * API payload, so this needs no title parsing — the alternative was matching against
 * body titles like "State of California Executive" vs "California State Assembly"
 * vs "Nevada Assembly", which have no single shape.
 *
 * Scans until it finds an official that actually carries one: a body whose first
 * subgroup happens to hold an official with no state is not evidence about the body.
 *
 * @returns {string|null} upper-case abbrev, or null when no official declares one
 */
function stateOfBody(body) {
  for (const subgroup of body?.subgroups ?? []) {
    for (const pol of subgroup?.pols ?? []) {
      const abbrev = (pol?.representing_state || '').trim().toUpperCase();
      if (abbrev) return abbrev;
    }
  }
  return null;
}

/**
 * Split one tier's `bodies` into per-state groups, so a ZIP that straddles a state
 * line can render a banner per state instead of one undifferentiated pile.
 *
 * Why this exists: ZIP 89439 is CA+NV, and the State tier arrived with both states'
 * bodies INTERLEAVED — Newsom, Kounalakis, Bonta, then Lombardo, Anthony, Aguilar,
 * then CA and NV legislators mixed. Grouping is what makes a per-state banner mean
 * anything; without it a banner would sit above a list that is only partly its state.
 *
 * Order: the dominant state leads, then the rest alphabetically. Dominance comes from
 * the ZIP's own county (Washoe County, 32031 → NV for 89439), because the state the
 * ZIP mostly sits in should be the one the reader meets first. Alphabetical alone
 * would put California above Nevada for a Nevada ZIP.
 *
 * Bodies whose officials declare no `representing_state` collect into a trailing group
 * with `stateAbbrev: null` — the caller renders those with no sub-banner. They are
 * deliberately kept rather than dropped: an unknown state is a reason to show a body
 * without a label, never a reason to hide officials from the person who searched.
 *
 * @param {Array<{key:string, subgroups?:Array<{pols?:Array}>}>} bodies one tier's bodies, in render order
 * @param {{dominantState?: string|null}} opts
 * @returns {Array<{stateAbbrev: string|null, bodies: Array}>} groups; bodies keep their relative order
 */
export function splitBodiesByState(bodies = [], { dominantState = null } = {}) {
  const byState = new Map();

  for (const body of bodies) {
    const abbrev = stateOfBody(body);
    if (!byState.has(abbrev)) byState.set(abbrev, []);
    byState.get(abbrev).push(body);
  }

  const named = [...byState.keys()].filter((abbrev) => abbrev !== null).sort();
  const lead = (dominantState || '').trim().toUpperCase();
  // Only hoist a dominant state that actually has bodies here — otherwise the
  // hoist would invent an empty group, or silently reorder nothing.
  const ordered = named.includes(lead)
    ? [lead, ...named.filter((abbrev) => abbrev !== lead)]
    : named;

  const groups = ordered.map((abbrev) => ({ stateAbbrev: abbrev, bodies: byState.get(abbrev) }));

  if (byState.has(null)) {
    groups.push({ stateAbbrev: null, bodies: byState.get(null) });
  }

  return groups;
}

/**
 * The same state ordering as splitBodiesByState, flattened back to one list — for a
 * tier that should read dominant-state-first WITHOUT gaining a banner per state.
 *
 * The Local tier is this case. Unlike the State tier, its accordions already carry
 * the community name ("Clark County", "San Bernardino County"), so a reader can
 * already tell the two sides of a straddling ZIP apart and the "In ZIP …" band above
 * them is simply true. What was left to chance was the ORDER: name-sorting leads with
 * whichever community sorts first, which for a Nevada ZIP can be the California one
 * (Alpine County before Clark County). This makes the invariant explicit instead.
 *
 * @param {Array} bodies one tier's bodies, in render order
 * @param {{dominantState?: string|null}} opts
 * @returns {Array} the same bodies, dominant state's first, then the rest
 *                  alphabetically by state, then any with no determinable state
 */
export function orderBodiesByState(bodies = [], opts = {}) {
  return splitBodiesByState(bodies, opts).flatMap((group) => group.bodies);
}
