import { Buffer } from 'node:buffer';
import { test, expect, expectShownInTime, brokenImages, API_PINNED_ADDRESS } from './support.js';

// Each test title is the sentence a reader of the CI log sees when it breaks.
// Assert what a user sees (roles, names, text), never component internals.

const COUNCIL = /City Council/;

async function searchPinnedAddress(page) {
  await page.goto('/');
  await page.getByRole('combobox', { name: /Enter your street address/ }).fill(API_PINNED_ADDRESS);
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/\/results\?q=/);
}

function councilCard(page) {
  return page.getByRole('main').getByRole('link', { name: COUNCIL }).first();
}

test('Typing an address shows its officials, including a council member @phone', async ({ page }) => {
  await searchPinnedAddress(page);
  expect(new URL(page.url()).searchParams.get('q')).toBe(API_PINNED_ADDRESS);
  await expectShownInTime(councilCard(page), 'The results list');
  // More than one official, not just the council seat.
  expect(await page.getByRole('main').getByRole('link', { name: /, / }).count()).toBeGreaterThan(5);
});

test("An official's profile shows name, office and photo @phone", async ({ page }) => {
  await searchPinnedAddress(page);
  const card = councilCard(page);
  await expectShownInTime(card, 'The results list');
  const name = (await card.getByRole('heading', { level: 3 }).innerText()).trim();
  await card.click();

  await expect(page).toHaveURL(/\/politician\/[0-9a-f-]{36}$/);
  const main = page.getByRole('main');
  await expectShownInTime(main.getByRole('heading', { level: 1, name }), 'The profile');
  await expect(main.getByText(COUNCIL).first()).toBeVisible();

  // A loaded photo, or ev-ui's placeholder (initials, or a "No portrait is
  // shown" notice). A photo element that failed to load is a break.
  const photo = main.getByRole('img', { name: `${name} portrait`, exact: true });
  if (await photo.count()) {
    await expect.poll(() => photo.first().evaluate((img) => img.complete && img.naturalWidth > 0),
      { message: `${name}'s photo did not load` }).toBe(true);
  }

  // Whatever its label, no picture on the profile is a broken link.
  await expect.poll(() => brokenImages(main), { message: 'Pictures on the profile that failed to load' }).toEqual([]);

  // No section shows a heading over nothing.
  await expect(main.getByRole('heading', { level: 2 }).first()).toBeVisible();
  await expect.poll(() => main.evaluate((el) =>
    [...el.querySelectorAll('h2')]
      .filter((h) => h.offsetParent !== null)
      .filter((h) => {
        const box = h.closest('section') ?? h.parentElement;
        return box.innerText.trim().length <= h.innerText.trim().length;
      })
      .map((h) => h.innerText.trim())), { message: 'Profile sections with a heading and no content' }).toEqual([]);
});

test('Back from a profile returns to the same results', async ({ page }) => {
  await searchPinnedAddress(page);
  const resultsUrl = page.url();
  await expectShownInTime(councilCard(page), 'The results list');
  await councilCard(page).click();
  await expect(page).toHaveURL(/\/politician\//);
  await expectShownInTime(page.getByRole('main').getByRole('heading', { level: 1 }), 'The profile');

  await page.goBack();
  await expect(page).toHaveURL(resultsUrl);
  await expectShownInTime(councilCard(page), 'The results list after going back');
});

test('Browsing by place lists officials', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^California CA\b/ }).click();
  await page.getByRole('region', { name: 'California covered areas' })
    .getByRole('button', { name: 'Los Angeles', exact: true }).click();

  await expect(page).toHaveURL(/\/results\?.*browse_/);
  await expectShownInTime(councilCard(page), 'The officials for Los Angeles');
});

test('A profile opened from Compass shows the comparison', async ({ page, request }) => {
  // Find the pinned address's council member and the topics they answered,
  // then build the link Compass builds (CompassV2 serializeCompassFragment):
  // #compass=base64({ a: { short_title: value }, s: [topic ids], i: {} }).
  const search = await (await request.post('/api/essentials/candidates/search', {
    data: { query: API_PINNED_ADDRESS },
  })).json();
  const member = search.politicians.find((p) => /council/i.test(`${p.office_title} ${p.chamber_name}`));
  expect(member, 'The pinned address has a council member').toBeTruthy();

  const topics = await (await request.get('/api/compass/topics')).json();
  const theirs = await (await request.get(`/api/compass/politicians/${member.id}/answers`)).json();
  const byId = new Map(topics.map((t) => [t.id, t]));
  const shared = theirs.filter((a) => byId.has(a.topic_id)).slice(0, 6);
  expect(shared.length, `${member.full_name} has compass answers`).toBeGreaterThan(2);

  const payload = {
    a: Object.fromEntries(shared.map((x) => [byId.get(x.topic_id).short_title, 3])),
    s: shared.map((x) => x.topic_id),
    i: {},
  };
  const fragment = `#compass=${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
  await page.goto(`/politician/${member.id}${fragment}`);

  await expectShownInTime(page.getByRole('main').getByRole('heading', { level: 1 }), 'The profile');
  const compass = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Compass & Issues' }) });
  // The legend names both sides, and the chart draws the shared topics.
  await expectShownInTime(compass.getByText('You', { exact: true }).first(), 'The compass comparison');
  const firstTopic = byId.get(shared[0].topic_id).short_title;
  await expect(compass.getByRole('img').filter({ hasText: firstTopic })).toBeVisible();
  await expect(compass.getByText(member.full_name, { exact: true })).toBeVisible();
  await expect(compass.getByRole('link', { name: 'Calibrate your compass' })).toHaveCount(0);
});
