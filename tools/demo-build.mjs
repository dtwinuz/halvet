// Halvet demo: v1/ saytining statik nusxasi (uz/ru/en) -> dist-demo/, istalgan pastki yo'lda ishlaydi (masalan /demo/halvet/).
//   node tools/demo-build.mjs
// Farqi prod'dan: til havolalari nisbiy (index.ru.html), "Demo" belgisi, ariza formasi mailto o'rniga yuboriladigan xatni ko'rsatadi.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const V1 = join(ROOT, 'v1');
const OUT = join(ROOT, 'dist-demo');

execFileSync(process.execPath, [join(ROOT, 'tools/i18n.mjs'), 'build'], { stdio: 'inherit' });

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const copy = (dir, test) => {
  mkdirSync(join(OUT, dir), { recursive: true });
  for (const f of readdirSync(join(V1, dir))) if (test(f)) cpSync(join(V1, dir, f), join(OUT, dir, f));
};
copy('img', (f) => f.endsWith('.webp'));
copy('fonts', (f) => f.endsWith('.woff2'));
copy('media', (f) => /\.(mp4|webp)$/.test(f));
copy('vendor', (f) => f.endsWith('.js'));
for (const f of ['styles.css', 'icon.svg']) cpSync(join(V1, f), join(OUT, f));
cpSync(join(ROOT, 'tools/demo/demo.js'), join(OUT, 'demo.js'));
cpSync(join(ROOT, 'tools/demo/demo.css'), join(OUT, 'demo.css'));

// JS: ariza formasi pochta ilovasini ochmasin — demo xat ko'rinishini chiqaradi.
for (const f of readdirSync(V1).filter((f) => f.endsWith('.js'))) {
  let src = readFileSync(join(V1, f), 'utf8');
  src = src.replace(/window\.location\.href = ('mailto:[^\n]*);/, 'window.__hvDemoMail($1);');
  writeFileSync(join(OUT, f), src);
}

const PILL = {
  uz: 'Demo · namuna ma’lumotlar, qayta yuklanganda tiklanadi',
  ru: 'Демо · примерные данные, сбрасываются при перезагрузке',
  en: 'Demo · sample content, resets on reload',
};
for (const [lang, file] of [['uz', 'index.html'], ['ru', 'index.ru.html'], ['en', 'index.en.html']]) {
  if (!existsSync(join(V1, file))) throw new Error(`${file} yo'q: avval node tools/i18n.mjs build`);
  let html = readFileSync(join(V1, file), 'utf8');
  html = html
    .replace(/(class="hv-lang__a" href=)"\/"/g, '$1"index.html"')
    .replace(/(class="hv-lang__a" href=)"\/ru"/g, '$1"index.ru.html"')
    .replace(/(class="hv-lang__a" href=)"\/en"/g, '$1"index.en.html"')
    .replace('</head>', '<link rel="stylesheet" href="demo.css">\n<meta name="robots" content="noindex">\n</head>')
    .replace('</body>', `<div class="hv-demo-pill" role="note" data-demo-pill>${PILL[lang]}</div>\n<script src="demo.js" defer></script>\n</body>`);
  writeFileSync(join(OUT, file), html);
}
console.log(`demo: ${OUT}`);
