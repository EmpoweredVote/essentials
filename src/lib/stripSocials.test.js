import { describe, it, expect } from 'vitest';
import { stripSocials, isSocialUrl } from './stripSocials';

describe('stripSocials', () => {
  const pol = {
    full_name: 'Kerry Thomson',
    identifiers: [
      { identifier_type: 'TWITTER', identifier_value: 'kt' },
      { identifier_type: 'facebook', identifier_value: 'kt' },
      { identifier_type: 'INSTAGRAM', identifier_value: 'kt' },
      { identifier_type: 'BIOGUIDE', identifier_value: 'X1' },
    ],
    urls: ['https://www.linkedin.com/in/kt', 'https://bloomington.in.gov/mayor', 'https://x.com/kt'],
    contacts: [
      { contact_type: 'office', phone: '812-555-0100', website_url: 'https://facebook.com/kt' },
      { contact_type: 'office', website_url: 'https://bloomington.in.gov' },
    ],
  };

  it('removes social handles, social urls and social contact websites', () => {
    const out = stripSocials(pol);
    expect(out.identifiers).toEqual([{ identifier_type: 'BIOGUIDE', identifier_value: 'X1' }]);
    expect(out.urls).toEqual(['https://bloomington.in.gov/mayor']);
    expect(out.contacts[0]).toEqual({ contact_type: 'office', phone: '812-555-0100', website_url: '' });
    expect(out.contacts[1].website_url).toBe('https://bloomington.in.gov');
  });

  it('does not mutate the input and tolerates missing fields', () => {
    stripSocials(pol);
    expect(pol.urls).toHaveLength(3);
    expect(stripSocials(null)).toEqual({ identifiers: undefined, urls: undefined, contacts: undefined });
  });

  it('does not treat lookalike domains as social', () => {
    expect(isSocialUrl('https://box.com')).toBe(false);
    expect(isSocialUrl('https://youtu.be/abc')).toBe(true);
  });
});
