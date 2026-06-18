/**
 * A candidate's headshot lives on the race_candidates record (`photo_url`), but a
 * linked politician record often has no photo of its own (`photo_origin_url` empty,
 * `images` empty). The election card reads the candidate's `photo_url`, while the
 * candidate profile renders the politician record — so the card showed the photo and
 * the profile fell back to initials.
 *
 * Returns the politician object with `photo_origin_url` filled from the candidate
 * photo ONLY when the politician has neither a `photo_origin_url` nor any `images`.
 * `PoliticianProfile` resolves the image as `photo_origin_url || images[0]?.url`, so
 * we leave `photo_origin_url` untouched when the politician already has its own photo.
 *
 * @param {object|null} politician - politician record (may be null for challengers)
 * @param {object|null} candidate  - race_candidates record carrying `photo_url`
 * @returns {object} politician object safe to pass to PoliticianProfile
 */
export function withCandidatePhotoFallback(politician, candidate) {
  const pol = politician || {};
  const hasOwnPhoto =
    !!pol.photo_origin_url || (Array.isArray(pol.images) && pol.images.length > 0);

  if (hasOwnPhoto) return pol;

  return {
    ...pol,
    photo_origin_url: (candidate && candidate.photo_url) || pol.photo_origin_url || '',
  };
}
