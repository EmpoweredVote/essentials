// Tests for the cross-app address bridge (G-114-011)
// saveUserAddress / loadUserAddress / clearUserAddress in compass.js
//
// Uses a Map-backed localStorage stub — no DOM environment required.
// Run: npm test
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── localStorage mock ───────────────────────────────────────────────────────
const store = new Map();
const localStorageMock = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, value),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

vi.stubGlobal('localStorage', localStorageMock);

// Import after stubbing so the module picks up the mock
const { saveUserAddress, loadUserAddress, clearUserAddress, USER_ADDRESS_KEY } =
  await import('./compass.js');

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  store.clear();
});

describe('USER_ADDRESS_KEY', () => {
  it('is the literal string "evUserAddress" (cross-app contract)', () => {
    expect(USER_ADDRESS_KEY).toBe('evUserAddress');
  });
});

describe('saveUserAddress / loadUserAddress round-trip (Test 1)', () => {
  it('saves and loads addr + state correctly', () => {
    saveUserAddress('200 W Kirkwood Ave, Bloomington, IN, 47404', 'IN');
    const result = loadUserAddress();
    expect(result).not.toBeNull();
    expect(result.addr).toBe('200 W Kirkwood Ave, Bloomington, IN, 47404');
    expect(result.state).toBe('IN');
  });
});

describe('loadUserAddress — TTL (Test 2)', () => {
  it('returns null when TTL is exceeded', () => {
    // Write an entry with a timestamp 31 days in the past
    const THIRTY_ONE_DAYS_AGO = Date.now() - 31 * 24 * 60 * 60 * 1000;
    store.set(
      USER_ADDRESS_KEY,
      JSON.stringify({ addr: '200 W Kirkwood Ave, Bloomington, IN, 47404', state: 'IN', ts: THIRTY_ONE_DAYS_AGO })
    );
    const result = loadUserAddress(); // default 30-day TTL
    expect(result).toBeNull();
  });
});

describe('loadUserAddress — missing key (Test 3)', () => {
  it('returns null when no key is stored', () => {
    const result = loadUserAddress();
    expect(result).toBeNull();
  });
});

describe('loadUserAddress — malformed JSON (Test 4)', () => {
  it('returns null without throwing on invalid JSON', () => {
    store.set(USER_ADDRESS_KEY, '{not valid json}');
    expect(() => loadUserAddress()).not.toThrow();
    expect(loadUserAddress()).toBeNull();
  });
});

describe('clearUserAddress (Test 5)', () => {
  it('removes the key so loadUserAddress returns null', () => {
    saveUserAddress('200 W Kirkwood Ave, Bloomington, IN, 47404', 'IN');
    clearUserAddress();
    expect(loadUserAddress()).toBeNull();
    expect(store.has(USER_ADDRESS_KEY)).toBe(false);
  });
});

describe('saveUserAddress — guards', () => {
  it('does not save when state is missing', () => {
    saveUserAddress('200 W Kirkwood Ave, Bloomington, IN, 47404', '');
    expect(loadUserAddress()).toBeNull();
  });

  it('does not save when state is not a string', () => {
    saveUserAddress('some address', null);
    expect(loadUserAddress()).toBeNull();
  });
});
