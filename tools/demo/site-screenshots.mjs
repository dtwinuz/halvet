// npm run site:screenshots: dist-demo'ni beradi va har bo'limni docs/screenshots/*.jpg ga suratga oladi (1440x900, telefon 390x844).
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '../../docs/screenshots');
const port = Number(process.env.DEMO_PORT) || 4592;
const url = `http://127.0.0.1:${port}/demo/halvet/`;
mkdirSync(out, { recursive: true });

const server = spawn(process.execPath, [join(here, 'serve.mjs')], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const shot = async (page, name, wait = 1200) => {
  await page.waitForTimeout(wait);
  await page.screenshot({ path: join(out, `${name}.jpg`), type: 'jpeg', quality: 78 });
  console.log('  ', name);
};
// Bo'limlar scroll bilan ochiladi (reveal, 3D sahnalar): sahifani bir marta pastgacha aylanib chiqamiz.
const warm = async (page) => {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
};
const to = async (page, sel, offset = 0) => {
  await page.evaluate(([s, o]) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + o); }, [sel, offset]);
};
const open = async (path = '', viewport = { width: 1440, height: 900 }) => {
  const page = await browser.newPage({ viewport });
  await page.goto(url + path, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  return page;
};

try {
  const page = await open();
  await shot(page, 'hero', 1500);
  await warm(page);
  const sections = [
    ['#halvet', 'manifest'], ['#makonlar', 'spaces', 1400], ['.hv-reel', 'reel'], ['#ritual', 'ritual'], ['#muhandislik', 'engineering'], ['#muhandislik', 'engineering-3d', 780],
    ['#boshqaruv', 'control', 420], ['#hunar', 'craft'], ['#mozaika', 'mosaic'], ['#naqsh', 'girih', 900], ['#ilhom', 'gallery'], ['#nega', 'compare'],
    ['#jarayon', 'process'],
  ];
  for (const [sel, name, offset = 0] of sections) { await to(page, sel, offset); await shot(page, name, 2200); }

  // Interaktiv kesim: hammom tizimi, keyin chizmalar orasida elektrika.
  await to(page, '#muhandislik', 780);
  await page.locator('[data-system-tab="hammam"]').click();
  await page.locator('.hv-sys__stage').scrollIntoViewIfNeeded();
  await to(page, '#muhandislik', 780);
  await shot(page, 'engineering-hammam', 2200);
  await page.locator('[data-tab="elektr"]').scrollIntoViewIfNeeded();
  await page.locator('[data-tab="elektr"]').click();
  await page.evaluate(() => window.scrollBy(0, -140));
  await shot(page, 'blueprint-electric', 1800);

  await to(page, '#ilhom');
  await page.locator('.hv-gal__tabs button').nth(1).click();
  await shot(page, 'gallery-filter');
  await page.locator('.hv-gal__tabs button').first().click();
  await page.locator('.hv-gal__btn').first().click();
  await shot(page, 'gallery-lightbox', 1500);
  await page.keyboard.press('Escape');

  await to(page, '#savollar');
  await page.locator('#savollar details').first().locator('summary').click();
  await page.locator('#savollar details').nth(2).locator('summary').click();
  await shot(page, 'faq');

  await to(page, '#aloqa');
  await page.fill('[data-form] [name=ism]', 'Aziza Karimova');
  await page.fill('[data-form] [name=tel]', '+998 90 000 00 00');
  await page.locator('[data-form] input[name=makon]').first().check({ force: true });
  await page.locator('[data-form] input[name=makon]').nth(1).check({ force: true });
  await page.fill('[data-form] [name=joy]', 'Toshkent viloyati, Zangiota');
  await page.fill('[data-form] [name=maydon]', '220');
  await page.fill('[data-form] [name=izoh]', 'Hovlida hammom va kichik basseyn, kuzgacha.');
  await shot(page, 'contact');
  await page.locator('[data-form] button[type=submit], [data-form] button:not([type])').first().click();
  await shot(page, 'contact-sent', 700);
  await page.close();

  for (const lang of ['ru', 'en']) {
    const p = await open(`index.${lang}.html`);
    await shot(p, `hero-${lang}`, 1200);
    await warm(p);
    await to(p, '#jarayon');
    await p.waitForTimeout(1500); await to(p, "#jarayon"); await shot(p, `process-${lang}`, 3000);
    await p.close();
  }

  const phone = await open('', { width: 390, height: 844 });
  await shot(phone, 'phone', 1500);
  await phone.close();
} finally {
  await browser.close();
  server.kill();
}
