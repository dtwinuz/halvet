import { expect, test } from '@playwright/test';

const SECTIONS = ['halvet', 'makonlar', 'ritual', 'muhandislik', 'boshqaruv', 'hunar', 'mozaika', 'naqsh', 'ilhom', 'nega', 'jarayon', 'savollar', 'aloqa'];

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/WebGL|GL_|GPU/.test(m.text())) errors.push(m.text()); });
});
test.afterEach(() => expect(errors).toEqual([]));

for (const [lang, file, title] of [['uz', '', 'hammom'], ['ru', 'index.ru.html', 'хаммам'], ['en', 'index.en.html', 'hammam']]) {
  test(`${lang}: every section renders, demo pill shown`, async ({ page }) => {
    await page.goto(file);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('h1')).toContainText(new RegExp(title, 'i'));
    await expect(page.locator('[data-demo-pill]')).toContainText(/Demo|Демо/);
    for (const id of SECTIONS) {
      const s = page.locator(`#${id}`);
      await s.scrollIntoViewIfNeeded();
      await expect(s).toBeVisible();
      expect((await s.innerText()).trim().length, `#${id} matni`).toBeGreaterThan(40);
    }
  });
}

test('language links stay inside the demo', async ({ page }) => {
  await page.goto('');
  await page.locator('.hv-lang__a', { hasText: 'RU' }).first().click();
  await expect(page).toHaveURL(/\/demo\/halvet\/index\.ru\.html$/);
  await page.locator('.hv-lang__a', { hasText: 'EN' }).first().click();
  await expect(page).toHaveURL(/\/demo\/halvet\/index\.en\.html$/);
});

test('systems, blueprints, gallery, FAQ', async ({ page }) => {
  await page.goto('');
  for (const t of ['sauna', 'hammam', 'pool']) {
    await page.locator(`[data-system-tab="${t}"]`).click();
    await expect(page.locator(`[data-system-tab="${t}"]`)).toHaveAttribute('aria-selected', 'true');
  }
  for (const t of ['isitish', 'elektr', 'santexnika', 'bug', 'kimyo', 'avto', 'filtr']) {
    await page.locator(`[data-tab="${t}"]`).click();
    await expect(page.locator(`[data-tab="${t}"]`)).toHaveAttribute('aria-selected', 'true');
  }
  const cards = page.locator('.hv-gal__btn');
  expect(await cards.count()).toBeGreaterThanOrEqual(12);
  await page.locator('.hv-gal__tabs button').nth(1).click();
  await page.locator('.hv-gal__tabs button').first().click();
  await cards.first().click();
  await expect(page.locator('dialog[open], [role=dialog]').first()).toBeVisible();
  await page.keyboard.press('Escape');
  const faq = page.locator('#savollar details');
  expect(await faq.count()).toBeGreaterThanOrEqual(5);
  await faq.first().locator('summary').click();
  await expect(faq.first()).toHaveAttribute('open', '');
});

test('consultation form shows the letter instead of opening mail', async ({ page }) => {
  await page.goto('');
  await page.locator('#aloqa').scrollIntoViewIfNeeded();
  await page.fill('[data-form] [name=ism]', 'Aziza Karimova');
  await page.fill('[data-form] [name=tel]', '+998 90 000 00 00');
  await page.locator('[data-form] input[name=makon]').first().check({ force: true });
  await page.locator('[data-form] button[type=submit], [data-form] button:not([type])').first().click();
  await expect(page.locator('.hv-demo-mail')).toContainText('Aziza Karimova');
  await page.keyboard.press('Escape');
  await expect(page.locator('.hv-demo-mail')).toHaveCount(0);
});
