// src/lib/featureIcons.js
import {
  findMatchingMunicipality,
  findStateTreasuryEntity,
  findFederalTreasuryEntity,
  toTreasurySlug,
  TREASURY_URL,
} from './treasury';

/**
 * Fixed-order product registry for the tethered feature-icon row (D-01/D-03).
 * Reserved order: treasury, then compass, then readrank — placement is
 * defined up front so future products plug in with zero layout change once
 * their per-location resolver contracts exist. Only entries with a live
 * `resolve()` are rendered today; compass/readrank are intentionally NOT
 * added as live entries (D-02) — no greyed/placeholder icons (TETH-03).
 *
 * Each entry's `resolve(ctx)` returns `{ key, href, label, iconSrc } | null`.
 * `ctx` = { tier: 'city'|'state'|'federal', representingCity, userState, treasuryCities }.
 */
export const PRODUCT_REGISTRY = [
  {
    key: 'treasury',
    label: 'Treasury Tracker',
    iconSrc: '/treasury-symbol.svg',
    resolve({ tier, representingCity, userState, treasuryCities }) {
      let entity = null;
      if (tier === 'city') {
        entity = findMatchingMunicipality(representingCity, treasuryCities, userState);
      } else if (tier === 'state') {
        entity = findStateTreasuryEntity(userState, treasuryCities);
      } else if (tier === 'federal') {
        entity = findFederalTreasuryEntity(treasuryCities);
      }
      if (!entity) return null;
      const slug = encodeURIComponent(toTreasurySlug(entity));
      return {
        key: 'treasury',
        href: `${TREASURY_URL}/?entity=${slug}`,
        label: 'Treasury Tracker',
        iconSrc: '/treasury-symbol.svg',
      };
    },
  },
  // Reserved slots — NOT rendered (no per-location contract yet, D-02):
  // { key: 'compass', label: 'Compass', iconSrc: '/compass-symbol-dark.svg', resolve: () => null },
  // { key: 'readrank', label: 'Read & Rank', iconSrc: '/readrank-symbol-dark.svg', resolve: () => null },
];

/**
 * Resolve the tethered feature-icon row for all three tiers.
 * Mirrors getBuildingImages' { Local, State, Federal } shape
 * (src/lib/buildingImages.js) — each tier's value is an array of resolved
 * `{key, href, label, iconSrc}` icons, in PRODUCT_REGISTRY order. A tier
 * with no matching entity for a product yields an omitted entry, never a
 * null/placeholder push (TETH-03).
 *
 * @param {{ representingCity?: string, userState?: string, treasuryCities?: Array }} ctx
 * @returns {{ Local: Array, State: Array, Federal: Array }}
 */
export function resolveFeatureIcons({
  representingCity = null,
  userState = null,
  treasuryCities = [],
} = {}) {
  const tiers = { Local: 'city', State: 'state', Federal: 'federal' };
  const result = { Local: [], State: [], Federal: [] };

  for (const [mapKey, tier] of Object.entries(tiers)) {
    for (const product of PRODUCT_REGISTRY) {
      const icon = product.resolve({
        tier,
        representingCity,
        userState,
        treasuryCities,
      });
      if (icon) result[mapKey].push(icon);
    }
  }

  return result;
}
