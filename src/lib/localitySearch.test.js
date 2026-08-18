/**
 * Tests for localitySearch.js route builders.
 */

import { describe, it, expect } from 'vitest';
import { zipRoute } from './localitySearch.js';

describe('zipRoute', () => {
  it('builds the Results ZIP hand-off URL', () => {
    expect(zipRoute('46220')).toBe('/results?zip=46220');
  });

  it('percent-encodes rather than concatenating untrusted input', () => {
    // Same guard as coordinateRoute: never string-concatenate into a path.
    expect(zipRoute('46220&browse_geo_id=x')).toBe('/results?zip=46220%26browse_geo_id%3Dx');
  });
});
