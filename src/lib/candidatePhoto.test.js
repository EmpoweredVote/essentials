import { describe, it, expect } from 'vitest';
import { withCandidatePhotoFallback } from './candidatePhoto';

const CANDIDATE_PHOTO = 'https://cdn/storage/candidates/abc.png';

describe('withCandidatePhotoFallback', () => {
  it('falls back to the candidate photo when the linked politician has no photo (the bug: photo on card, initials on profile)', () => {
    const politician = { full_name: 'Gina Tanner', photo_origin_url: '', images: [] };
    const candidate = { photo_url: CANDIDATE_PHOTO };

    const result = withCandidatePhotoFallback(politician, candidate);

    expect(result.photo_origin_url).toBe(CANDIDATE_PHOTO);
    // Preserves the rest of the politician record.
    expect(result.full_name).toBe('Gina Tanner');
  });

  it('keeps the politician photo_origin_url when it already has one', () => {
    const politician = { photo_origin_url: 'https://cdn/politician.png', images: [] };
    const candidate = { photo_url: CANDIDATE_PHOTO };

    expect(withCandidatePhotoFallback(politician, candidate).photo_origin_url).toBe(
      'https://cdn/politician.png'
    );
  });

  it('does not clobber an images-based photo (PoliticianProfile prefers photo_origin_url, then images)', () => {
    const politician = { photo_origin_url: '', images: [{ url: 'https://cdn/img0.png' }] };
    const candidate = { photo_url: CANDIDATE_PHOTO };

    const result = withCandidatePhotoFallback(politician, candidate);
    // photo_origin_url stays empty so the existing images[0].url still wins.
    expect(result.photo_origin_url).toBe('');
    expect(result.images).toEqual([{ url: 'https://cdn/img0.png' }]);
  });

  it('handles a missing candidate photo without throwing', () => {
    const politician = { photo_origin_url: '', images: [] };
    expect(withCandidatePhotoFallback(politician, {}).photo_origin_url).toBe('');
    expect(withCandidatePhotoFallback(politician, null).photo_origin_url).toBe('');
  });

  it('tolerates a null/undefined politician', () => {
    expect(withCandidatePhotoFallback(null, { photo_url: CANDIDATE_PHOTO }).photo_origin_url).toBe(
      CANDIDATE_PHOTO
    );
  });
});
