// Halvet i18n: o'zbekcha manba (v1/index.html + JS) -> v1/index.<lang>.html + v1/<nom>.<lang>.js
//   node tools/i18n.mjs extract   -> i18n/strings.json (tarjima qilinadigan bo'laklar ro'yxati)
//   node tools/i18n.mjs build     -> i18n/<lang>.json lug'ati bo'yicha sahifa va JS nusxalari
// Lug'atda yo'q bo'lak build'ni to'xtatadi (yarim tarjima prodga chiqmasin).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const V1 = join(ROOT, 'v1');
const DIR = join(ROOT, 'i18n');
const LANGS = { ru: { locale: 'ru_RU' }, en: { locale: 'en_US' } };
const JS = ['app.js', 'blueprints.js', 'systems.js', 'iot.js', 'equip3d.js', 'spaces3d.js', 'dome.js', 'girih.js', 'vapor.js'];
const MODS = /^(\.\/)?(equip3d|spaces3d|dome|vapor)\.js$/;
const INLINE = new Set(['em', 'strong', 'b', 'i', 'br', 'span', 'small', 'a', 'abbr', 'sup', 'sub', 'code', 'u', 'mark', 'time', 'bdi', 'wbr']);
const ATTRS = ['alt', 'aria-label', 'title', 'placeholder', 'content', 'data-label', 'data-title', 'data-cap', 'data-credit'];
const WORD = /[A-Za-zЀ-ӿ]{2,}/;

const read = (f) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const tokens = (html) => html.match(/<!--[\s\S]*?-->|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>|[^<]+/g) || [];
const tagName = (t) => (/^<\/?([a-zA-Z0-9-]+)/.exec(t) || [])[1]?.toLowerCase();

// HTML: blok ichidagi matn + inline teglar ketma-ketligi = bitta bo'lak (tarjimon teglarni saqlaydi).
// Qaytaradi: [{s, a, b}] — a..b tokenlar oralig'i (almashtirish token darajasida, regex'siz).
function htmlRuns(toks) {
  const out = [];
  let run = [];
  const flush = () => {
    let a = 0, b = run.length - 1;
    while (a <= b && (toks[run[a]].startsWith('<') || !toks[run[a]].trim())) a++;
    while (b >= a && (toks[run[b]].startsWith('<') || !toks[run[b]].trim())) b--;
    if (a <= b) {
      const raw = run.slice(a, b + 1).map((i) => toks[i]).join('');
      if (WORD.test(raw.replace(/<[^>]+>/g, ''))) out.push({ s: raw.trim(), a: run[a], b: run[b] });
    }
    run = [];
  };
  toks.forEach((t, i) => {
    if (t.startsWith('<')) {
      const n = tagName(t);
      if (n && INLINE.has(n) && !t.startsWith('<!')) { run.push(i); return; }
      flush();
    } else run.push(i);
  });
  flush();
  return out;
}
const ATTR_RE = new RegExp('(\\s(' + ATTRS.join('|') + ')=")([^"]*)(")', 'g');
function attrOk(tag, name, v) {
  if (!WORD.test(v) || /^(https?:|\/|#|mailto:|tel:)/.test(v)) return false;
  if (name === 'content' && !/name="description"|property="og:(title|description|image:alt)"/.test(tag)) return false;
  return true;
}
function attrValues(toks) {
  const out = [];
  for (const t of toks) {
    if (!t.startsWith('<') || t.startsWith('<!') || t.startsWith('<script') || t.startsWith('<style')) continue;
    for (const m of t.matchAll(ATTR_RE)) if (attrOk(t, m[2], m[3])) out.push(m[3]);
  }
  return out;
}
// JS: bir tirnoqli satrlar; kod/shader/CSS satrlari tashlab ketiladi
const CODE = /[;{}=<>|]|\bvec\d|\bfloat\b|\bgl_|uniform|precision|varying|\bvoid\b|rgba?\(|^[.#[(]|\.(js|webp|jpg|png|mp4|svg|css)\b|^[a-z]+(-[a-z]+)+$|^[a-z]+[A-Z]\w*$|^[A-Za-z0-9]+(_[A-Za-z0-9]+)+$|\dpx\b|^Arrow|^use strict$|^Enter$|^Escape$|^bp-/;
// chizma yorliqlari (blueprints.js T/B argumentlari): ikkinchi qator ko'pincha bitta kichik harfli so'z — alohida olinadi
const EXTRA = new Set();
{
  const bp = join(V1, 'blueprints.js');
  if (existsSync(bp)) for (const m of read(bp).matchAll(/\b([BT])\(([^()]*)\)/g)) {
    const strs = [...m[2].matchAll(/'([^']*)'/g)].map((x) => x[1]).slice(0, m[1] === 'T' ? 1 : 2);
    for (const x of strs) if (/[a-z]{2,}/.test(x) && !/^bp-/.test(x)) EXTRA.add(x);
  }
}
function jsOk(s) {
  if (EXTRA.has(s)) return true;
  // o'zbekcha gap ichida ";" bo'lishi mumkin — apostrofli, bo'shliqli, kod belgisiz satr matn hisoblanadi
  if (/[‘’ʻ]/.test(s) && / [a-z]/.test(s) && !/[{}=<>]|\bvar\b|function|\bgl_/.test(s)) return true;
  if (!WORD.test(s) || CODE.test(s) || MODS.test(s)) return false;
  return /\s|[‘’ʻ]/.test(s) || /^[A-Z]/.test(s);
}
// JS skaneri: izohlar (// va /* */) ichidagi apostroflarni satr deb olmaydi; faqat '...' satrlarini beradi
function jsScan(src, onStr) {
  let out = '', i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { const j = src.indexOf('\n', i); const e = j < 0 ? n : j; out += src.slice(i, e); i = e; continue; }
    if (c === '/' && d === '*') { const j = src.indexOf('*/', i + 2); const e = j < 0 ? n : j + 2; out += src.slice(i, e); i = e; continue; }
    if (c === '"' || c === '`' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      const body = src.slice(i + 1, j);
      out += c === "'" ? onStr(body, src.slice(i, j + 1)) : src.slice(i, j + 1);
      i = j + 1; continue;
    }
    out += c; i++;
  }
  return out;
}
const jsStrings = (src) => { const a = []; jsScan(src, (s, raw) => { if (jsOk(s)) a.push(s); return raw; }); return a; };

function collect() {
  const toks = tokens(read(join(V1, 'index.html')));
  const set = new Set([...htmlRuns(toks).map((r) => r.s), ...attrValues(toks)]);
  for (const f of JS) if (existsSync(join(V1, f))) for (const s of jsStrings(read(join(V1, f)))) set.add(s);
  return [...set];
}

function extract() {
  mkdirSync(DIR, { recursive: true });
  const list = collect();
  writeFileSync(join(DIR, 'strings.json'), JSON.stringify(list, null, 1) + '\n');
  for (const lang of Object.keys(LANGS)) {
    const f = join(DIR, lang + '.json');
    const dict = existsSync(f) ? JSON.parse(read(f)) : {};
    const missing = list.filter((s) => !(s in dict));
    console.log(`${lang}: ${list.length} bo'lak, ${missing.length} tarjimasiz`);
    writeFileSync(join(DIR, lang + '.missing.json'), JSON.stringify(missing, null, 1) + '\n');
  }
}

function build() {
  const list = collect();
  let bad = 0;
  for (const [lang, meta] of Object.entries(LANGS)) {
    const dict = JSON.parse(read(join(DIR, lang + '.json')));
    const missing = list.filter((s) => !(s in dict));
    if (missing.length) { console.error(`${lang}: ${missing.length} tarjimasiz bo'lak (node tools/i18n.mjs extract), masalan: ${missing.slice(0, 3).join(' | ')}`); bad++; continue; }
    const tr = (s) => dict[s] ?? s;

    const toks = tokens(read(join(V1, 'index.html')));
    for (const r of htmlRuns(toks).reverse()) {
      const t = tr(r.s);
      if (t === r.s) continue;
      // butun oraliq tarjima bilan almashadi; birinchi/oxirgi matn tokenidagi tashqi bo'shliq saqlanadi
      const lead = toks[r.a].startsWith('<') ? '' : /^\s*/.exec(toks[r.a])[0];
      const trail = toks[r.b].startsWith('<') ? '' : /\s*$/.exec(toks[r.b])[0];
      toks[r.a] = lead + t + trail;
      for (let i = r.a + 1; i <= r.b; i++) toks[i] = '';
    }
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (!t.startsWith('<') || t.startsWith('<!') || t.startsWith('<script') || t.startsWith('<style')) continue;
      toks[i] = t.replace(ATTR_RE, (m, a, n, v, b) => (attrOk(t, n, v) ? a + tr(v) + b : m));
    }
    let html = toks.join('');
    html = html
      .replace('<html lang="uz">', `<html lang="${lang}">`)
      .replace('<link rel="canonical" href="https://halvet.dtwin.uz/">', `<link rel="canonical" href="https://halvet.dtwin.uz/${lang}">`)
      .replace('<meta property="og:url" content="https://halvet.dtwin.uz/">', `<meta property="og:url" content="https://halvet.dtwin.uz/${lang}">`)
      .replace('content="uz_UZ"', `content="${meta.locale}"`)
      .replace(/(<a class="hv-lang__a"[^>]*?) aria-current="true"/g, '$1')
      .replace(new RegExp(`(<a class="hv-lang__a" href="/${lang}"[^>]*?)>`), '$1 aria-current="true">');
    for (const f of JS) html = html.split(`src="${f}"`).join(`src="${f.replace('.js', '.' + lang + '.js')}"`);
    writeFileSync(join(V1, `index.${lang}.html`), html);

    for (const f of JS) {
      if (!existsSync(join(V1, f))) continue;
      let src = jsScan(read(join(V1, f)), (s, m) => {
        if (MODS.test(s)) return `'${s.replace('.js', '.' + lang + '.js')}'`;
        if (!jsOk(s)) return m;
        const t = tr(s);
        return t === s ? m : `'${t.replace(/\\?'/g, "\\'")}'`;
      });
      src = src.replace(/(['"])\.\/(equip3d|spaces3d|dome|vapor)\.js/g, `$1./$2.${lang}.js`);
      writeFileSync(join(V1, f.replace('.js', '.' + lang + '.js')), `/* avtomatik: tools/i18n.mjs build (${lang}); manba ${f} */\n` + src);
    }
    // nazorat: o'zbekcha bo'lak qolmadimi (tarjimasi farq qiladiganlar orasidan)
    const left = htmlRuns(tokens(html)).map((r) => r.s).filter((s) => list.includes(s) && tr(s) !== s);
    console.log(`${lang}: index.${lang}.html tayyor${left.length ? `, ${left.length} bo'lak almashmadi: ${left.slice(0, 3).join(' | ')}` : ''}`);
    if (left.length) bad++;
  }
  if (bad) process.exit(1);
}

const cmd = process.argv[2];
if (cmd === 'extract') extract();
else if (cmd === 'build') build();
else { console.log('node tools/i18n.mjs extract|build'); process.exit(2); }
