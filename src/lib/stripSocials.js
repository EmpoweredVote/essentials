/**
 * Profile pages do not show social media links (LinkedIn, X/Twitter, Facebook,
 * Instagram, YouTube). `PoliticianProfile` in ev-ui renders them from three places
 * and has no prop to turn them off, so we remove the data before handing it over:
 *
 *   - `identifiers` of a social type (TWITTER, FACEBOOK, INSTAGRAM, LINKEDIN, YOUTUBE)
 *   - `urls` that point at a social platform (LinkedIn is pulled from here)
 *   - `contacts[].website_url` that point at a social platform
 *
 * Official (non-social) websites, phones, emails and addresses are kept.
 *
 * @param {object|null} politician - politician record
 * @returns {object} politician object with social links removed
 */
const SOCIAL_IDENTIFIER_TYPES = new Set(['TWITTER', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'YOUTUBE']);
const SOCIAL_URL = /(^|[./])(linkedin\.com|facebook\.com|twitter\.com|x\.com|instagram\.com|youtube\.com|youtu\.be)\b/i;

export function isSocialUrl(url) {
  return typeof url === 'string' && SOCIAL_URL.test(url);
}

export function stripSocials(politician) {
  const pol = politician || {};
  return {
    ...pol,
    identifiers: Array.isArray(pol.identifiers)
      ? pol.identifiers.filter(
          (i) => !SOCIAL_IDENTIFIER_TYPES.has((i?.identifier_type || '').toUpperCase()),
        )
      : pol.identifiers,
    urls: Array.isArray(pol.urls) ? pol.urls.filter((u) => !isSocialUrl(u)) : pol.urls,
    contacts: Array.isArray(pol.contacts)
      ? pol.contacts.map((c) =>
          c && isSocialUrl(c.website_url) ? { ...c, website_url: '' } : c,
        )
      : pol.contacts,
  };
}
