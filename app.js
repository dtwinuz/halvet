(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function whenVisible(el, onChange) {
    const io = new IntersectionObserver(([e]) => onChange(e.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
  }

  /* Nav */
  const nav = $('[data-nav]');
  const darkSecs = $$('.gz-hero, .gz-eng, .gz-form, .gz-foot');
  function navTone() {
    const y = 34;
    const onDark = darkSecs.some(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    const top = scrollY < 40;
    nav.classList.toggle('is-solid', !onDark && !top);
    nav.classList.toggle('is-dark', onDark && !top);
  }
  addEventListener('scroll', navTone, { passive: true });
  navTone();
  const burger = $('[data-burger]');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('.gz-nav__links a').forEach(a => a.addEventListener('click', () => {
    burger.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); document.body.style.overflow = '';
  }));
  const links = $$('.gz-nav__links a');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  /* Hero: gumbaz ostidan ko'rinish */
  const cv = $('[data-dome]');
  if (cv) {
    const ctx = cv.getContext('2d');
    let W, H, dpr, holes = [], steam = [], run = false, t0 = performance.now();
    let mx = 0, my = 0, tx = 0, ty = 0;

    const sprite = (r, stops) => {
      const c = document.createElement('canvas'); c.width = c.height = r * 2;
      const g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
      stops.forEach(([o, col]) => gr.addColorStop(o, col));
      g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c;
    };
    const glow = sprite(64, [[0, 'rgba(255,236,200,1)'], [.18, 'rgba(255,214,160,.65)'], [.5, 'rgba(240,170,110,.14)'], [1, 'rgba(240,170,110,0)']]);
    const puff = sprite(128, [[0, 'rgba(235,240,238,.10)'], [.6, 'rgba(235,240,238,.04)'], [1, 'rgba(235,240,238,0)']]);

    function layout() {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const R = Math.max(W, H) * (W < 640 ? 0.95 : 0.62);
      holes = [];
      const rings = 6;
      for (let i = 1; i <= rings; i++) {
        const f = i / (rings + 1.4);
        const n = Math.round(6 + i * 5);
        for (let k = 0; k < n; k++) {
          holes.push({ f, a: (k / n) * Math.PI * 2 + (i % 2) * (Math.PI / n), s: 1 - f * .45, ph: Math.random() * 6.28, sp: .4 + Math.random() * .8 });
        }
      }
      holes.push({ f: 0, a: 0, s: 1.6, ph: 0, sp: .3 });
      steam = Array.from({ length: W < 640 ? 18 : 34 }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: 120 + Math.random() * 260,
        vx: (Math.random() - .5) * .12, vy: -.08 - Math.random() * .22, ph: Math.random() * 6.28
      }));
      cv._R = R;
    }

    function project(f, a, cx, cy, R) {
      const phi = f * Math.PI * .5;
      const r = Math.sin(phi) * R;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * .62 + (1 - Math.cos(phi)) * R * .28];
    }

    function frame(now) {
      const t = (now - t0) / 1000;
      tx += (mx - tx) * .04; ty += (my - ty) * .04;
      const R = cv._R;
      const cx = W * (W < 640 ? .55 : .7) + tx * 24, cy = H * (W < 640 ? .14 : .16) + ty * 16;
      ctx.clearRect(0, 0, W, H);

      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.1);
      bg.addColorStop(0, '#2a3a36'); bg.addColorStop(.45, '#16211f'); bg.addColorStop(1, '#0a1315');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      ctx.lineWidth = 1;
      for (let i = 1; i <= 9; i++) {
        const f = i / 9, phi = f * Math.PI * .5, r = Math.sin(phi) * R;
        ctx.strokeStyle = `rgba(214,190,150,${.10 + (1 - f) * .08})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy + (1 - Math.cos(phi)) * R * .28, r, r * .62, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(214,190,150,.09)';
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2;
        ctx.beginPath();
        for (let s = 0; s <= 20; s++) { const [x, y] = project(s / 20, a, cx, cy, R); s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'lighter';
      for (let b = 0; b < 3; b++) {
        const h = holes[(b * 23 + 5) % holes.length];
        const [x, y] = project(h.f, h.a, cx, cy, R);
        const pulse = .5 + .5 * Math.sin(t * .35 + b * 2.1);
        const len = H * 1.25, spread = 70 + b * 30;
        const g = ctx.createLinearGradient(x, y, x - len * .32, y + len);
        g.addColorStop(0, `rgba(255,220,170,${.12 + pulse * .1})`);
        g.addColorStop(1, 'rgba(255,220,170,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y);
        ctx.lineTo(x - len * .32 + spread, y + len); ctx.lineTo(x - len * .32 - spread, y + len); ctx.closePath(); ctx.fill();
      }
      for (const h of holes) {
        const [x, y] = project(h.f, h.a, cx, cy, R);
        const tw = .72 + .28 * Math.sin(t * h.sp + h.ph);
        const s = (W < 640 ? 34 : 46) * h.s * tw;
        ctx.globalAlpha = .9 * tw;
        ctx.drawImage(glow, x - s, y - s * .8, s * 2, s * 1.6);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,243,222,.92)';
      for (const h of holes) {
        const [x, y] = project(h.f, h.a, cx, cy, R);
        const s = 2.6 * h.s;
        ctx.beginPath();
        for (let p = 0; p < 16; p++) {
          const rr = p % 2 ? s * .45 : s, a = p / 16 * Math.PI * 2;
          const px = x + Math.cos(a) * rr * 1.2, py = y + Math.sin(a) * rr * .8;
          p ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.fill();
      }

      for (const p of steam) {
        p.x += p.vx + Math.sin(t * .2 + p.ph) * .15; p.y += p.vy;
        if (p.y < -p.r) { p.y = H + p.r; p.x = Math.random() * W; }
        ctx.drawImage(puff, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      if (run) requestAnimationFrame(frame);
    }

    layout();
    addEventListener('resize', () => { layout(); if (!run) frame(performance.now()); });
    if (!reduce) {
      addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
      whenVisible(cv, v => { if (v && !run) { run = true; requestAnimationFrame(frame); } else if (!v) run = false; });
    } else frame(performance.now());
  }

  /* Zonalar: harorat o'lchagich */
  const zones = $('#zonalar');
  if (zones) {
    const ticks = $('[data-ticks]');
    for (let i = 0; i <= 30; i++) {
      const a = (i / 30) * 270 * Math.PI / 180;
      const r1 = 112, r2 = i % 5 ? 106 : 98;
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', 160 + Math.cos(a) * r1); l.setAttribute('y1', 160 + Math.sin(a) * r1);
      l.setAttribute('x2', 160 + Math.cos(a) * r2); l.setAttribute('y2', 160 + Math.sin(a) * r2);
      ticks.appendChild(l);
    }
    const fill = $('[data-gauge-fill]'), temp = $('[data-temp]'), hum = $('[data-hum]'), humLine = $('[data-hum-line]');
    let cur = 45, raf;
    function setZone(btn) {
      $$('[data-zone-btn]').forEach(b => { const on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
      zones.dataset.zone = btn.dataset.zoneBtn;
      fill.style.strokeDasharray = `${(+btn.dataset.p * 75).toFixed(1)} 100`;
      const to = +btn.dataset.t, from = cur, st = performance.now();
      cancelAnimationFrame(raf);
      const step = now => {
        const k = reduce ? 1 : Math.min(1, (now - st) / 900), e = 1 - Math.pow(1 - k, 3);
        cur = Math.round(from + (to - from) * e); temp.textContent = cur;
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      if (btn.dataset.h) { hum.textContent = btn.dataset.h; humLine.innerHTML = `namlik <b>${btn.dataset.h}</b>%`; }
      else humLine.textContent = 'suv harorati';
    }
    $$('[data-zone-btn]').forEach(b => {
      b.addEventListener('click', () => setZone(b));
      b.addEventListener('mouseenter', () => matchMedia('(hover: hover)').matches && setZone(b));
    });
  }

  /* Muhandislik sxemasi */
  const PARTS = {
    skimmer: ['Basseyn', 'Skimmer', 'Suv yuzasidagi barg, chang va yog‘ni yig‘ib oladi. Suvning 70% ga yaqini aynan shu yerdan nasosga ketadi.', 'Qiladi: santexnika jamoasi'],
    drain: ['Basseyn', 'Donniy trap', 'Kosaning eng chuqur joyidan suvni tortadi, pastki qatlam ham aylanadi va basseynni to‘liq bo‘shatish mumkin bo‘ladi.', 'Qiladi: qurilish va santexnika'],
    pump: ['Basseyn', 'Sirkulyatsiya nasosi', 'Suvni filtrdan o‘tkazib qaytaradi. Quvvati basseyn hajmiga qarab tanlanadi — kichik nasos suvni tozalay olmaydi, kattasi pulni yeydi.', 'Qiladi: santexnika va elektr'],
    filter: ['Basseyn', 'Qum filtri', 'Kvars qumi qatlami mayda iflosliklarni ushlaydi. Haftada bir marta teskari yuvish bilan tozalanadi — buni topshirishda o‘rgatamiz.', 'Qiladi: santexnika jamoasi'],
    heater: ['Basseyn', 'Issiqlik almashtirgich', 'Suvni 26–28 °C da ushlab turadi. Uy qozoniga yoki issiqlik nasosiga ulanadi.', 'Qiladi: santexnika jamoasi'],
    dosing: ['Basseyn', 'Kimyo dozatori', 'pH va xlorni avtomatik me’yorda tutadi: ko‘z achishmaydi, suv ko‘karmaydi.', 'Qiladi: santexnika va elektr'],
    led: ['Basseyn', 'Suv osti yoritish', '12 V xavfsiz kuchlanishdagi LED chiroqlar. Rangini telefon yoki pult bilan o‘zgartirish mumkin.', 'Qiladi: elektr jamoasi'],
    panel: ['Basseyn', 'Elektr shiti', 'Nasos, isitish va yoritish uchun avtomatlar, taymer va himoya (UZO). Suv bor joyda elektr xavfsizligi birinchi o‘rinda.', 'Qiladi: elektr jamoasi'],
    nozzle: ['Basseyn', 'Qaytish forsunkalari', 'Tozalangan va isitilgan suvni kosaga bir tekis qaytaradi, “o‘lik” burchaklar qolmaydi.', 'Qiladi: santexnika jamoasi'],
    dome: ['Hammom', 'Gumbaz va yorug‘lik teshiklari', 'Gumbaz bug‘ni bir tekis taqsimlaydi, tomchi boshga emas, devor bo‘ylab oqadi. Shisha teshiklar kunduzgi yorug‘likni nur qilib tushiradi.', 'Qiladi: qurilish jamoasi'],
    gobek: ['Hammom', 'Marmar supa (göbek taşı)', 'Hammomning markazi: ostidan isitiladigan marmar supa. Ustida yotib tana qiziydi, keyin kese va ko‘pik massaji qilinadi.', 'Qiladi: qurilish, santexnika, mozaika'],
    floor: ['Hammom', 'Issiq pol', 'Pol ostidagi quvurlardan issiq suv aylanadi, butun xona bir tekis isiydi. Yalangoyoq yurganda pol sovuq bo‘lmaydi.', 'Qiladi: santexnika jamoasi'],
    kurna: ['Hammom', 'Kurna (marmar tos)', 'Issiq va sovuq suv aralashadigan marmar tos. Har biriga alohida quvur va aralashtirgich ulanadi.', 'Qiladi: santexnika va mozaika'],
    steam: ['Hammom', 'Bug‘ generatori', 'Xonani to‘yingan bug‘ bilan to‘ldiradi. Hajmi xona kubaturasiga qarab tanlanadi va alohida elektr liniyasiga ulanadi.', 'Qiladi: elektr va santexnika'],
    vent: ['Hammom', 'Ventilyatsiya', 'Bug‘ va namlikni chiqaradi, devorda mog‘or paydo bo‘lishiga yo‘l qo‘ymaydi. Hammomning uzoq yashashi shunga bog‘liq.', 'Qiladi: qurilish va elektr'],
    drainh: ['Hammom', 'Drenaj', 'Pol nishabi va trap suvni tez chiqaradi. Nishab noto‘g‘ri bo‘lsa, suv turib qoladi — buni qurilishda bir marta to‘g‘ri qilish kerak.', 'Qiladi: qurilish va santexnika'],
    boiler: ['Hammom', 'Qozon va boshqaruv', 'Supani, polni va kurna suvini isitadi. Termostat haroratni o‘zi ushlab turadi.', 'Qiladi: santexnika va elektr']
  };
  const card = $('.gz-eng__card');
  if (card) {
    const tag = $('[data-part-tag]'), title = $('[data-part-title]'), text = $('[data-part-text]'), who = $('[data-part-who]');
    const pick = g => {
      const d = PARTS[g.dataset.part]; if (!d) return;
      $$('.gz-part').forEach(p => p.classList.toggle('is-on', p === g));
      card.classList.remove('is-swap'); void card.offsetWidth; card.classList.add('is-swap');
      [tag.textContent, title.textContent, text.textContent, who.textContent] = d;
    };
    $$('.gz-part').forEach(g => {
      g.addEventListener('click', () => pick(g));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(g); } });
    });
    $$('[data-scheme-btn]').forEach(b => b.addEventListener('click', () => {
      $$('[data-scheme-btn]').forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on); });
      $$('[data-scheme]').forEach(s => s.hidden = s.dataset.scheme !== b.dataset.schemeBtn);
      const first = $(`[data-scheme="${b.dataset.schemeBtn}"] .gz-part`);
      if (first) pick(first);
    }));
  }

  /* Mozaika konstruktori */
  const PAL = {
    firuza: ['#0f7f86', '#1fa7a8', '#4cc6c0', '#e9f4ef'],
    moviy: ['#123f7a', '#1d5fa8', '#3d86c9', '#dfeaf5'],
    marmar: ['#b9b2a3', '#d9d4c7', '#ece8de', '#9d8a6a'],
    granit: ['#1b2124', '#2a3134', '#3b4448', '#b9a274'],
    oltin: ['#9c7432', '#c99a4a', '#e2bf7a', '#fff3d6']
  };
  const PAT_NAMES = { aralash: 'Aralash', gradient: 'Gradient', tolqin: 'To‘lqin', girih: 'Girih' };
  const PAL_NAMES = { firuza: 'Firuza', moviy: 'Moviy', marmar: 'Oq marmar', granit: 'Qora granit', oltin: 'Oltin' };
  const mc = $('[data-mosaic]');
  if (mc) {
    const ctx = mc.getContext('2d');
    const base = document.createElement('canvas'), bctx = base.getContext('2d');
    const caus = document.createElement('canvas'), cctx = caus.getContext('2d');
    const CW = 96, CH = 68; caus.width = CW; caus.height = CH;
    const img = cctx.createImageData(CW, CH);
    let state = { pal: 'firuza', pat: 'aralash' }, W, H, run = false, pool;

    const rnd = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
    function shadeIndex(i, j, cols, rows) {
      const r = rnd(i, j);
      switch (state.pat) {
        case 'gradient': { const v = j / rows * 2.4 + (r - .5) * .9; return Math.max(0, Math.min(2, Math.floor(2.6 - v))); }
        case 'tolqin': { const v = Math.sin(i * .32 + Math.sin(j * .22) * 2.2) + (r - .5) * .5; return v > .45 ? 2 : v > -.35 ? 1 : 0; }
        case 'girih': {
          const n = 12, x = ((i % n) + n) % n - n / 2 + .5, y = ((j % n) + n) % n - n / 2 + .5;
          const d1 = Math.abs(x) + Math.abs(y), d2 = Math.max(Math.abs(x), Math.abs(y));
          if (Math.abs(d1 - 5) < .6 || Math.abs(d2 - 3.5) < .6) return 3;
          if (d1 < 4.4 && d2 < 3) return 2;
          return r > .7 ? 1 : 0;
        }
        default: return r < .45 ? 1 : r < .8 ? 0 : 2;
      }
    }
    function drawBase() {
      const c = PAL[state.pal];
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.fillStyle = '#d7cfc0'; bctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 46) for (let x = (y / 46) % 2 ? -46 : 0; x < W; x += 92) {
        bctx.fillStyle = rnd(x, y) > .5 ? '#d2c9b9' : '#dcd4c6'; bctx.fillRect(x + 1, y + 1, 90, 44);
      }
      const px = W * .08, py = H * .11, pw = W * .84, ph = H * .78;
      pool = { px, py, pw, ph };
      bctx.fillStyle = '#efeae0'; roundRect(bctx, px - 14, py - 14, pw + 28, ph + 28, 18); bctx.fill();
      bctx.save(); roundRect(bctx, px, py, pw, ph, 10); bctx.clip();
      const t = Math.max(8, Math.round(W / 64));
      const cols = Math.ceil(pw / t), rows = Math.ceil(ph / t);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        bctx.fillStyle = c[shadeIndex(i, j, cols, rows)];
        bctx.fillRect(px + i * t + .6, py + j * t + .6, t - 1.2, t - 1.2);
      }
      bctx.fillStyle = 'rgba(255,255,255,.1)';
      for (let j = 0; j <= rows; j++) bctx.fillRect(px, py + j * t, pw, .6);
      for (let i = 0; i <= cols; i++) bctx.fillRect(px + i * t, py, .6, ph);
      const depth = bctx.createLinearGradient(0, py, 0, py + ph);
      depth.addColorStop(0, 'rgba(0,30,40,0)'); depth.addColorStop(1, 'rgba(0,30,40,.32)');
      bctx.fillStyle = depth; bctx.fillRect(px, py, pw, ph);
      bctx.restore();
      bctx.strokeStyle = 'rgba(0,0,0,.18)'; bctx.lineWidth = 2; roundRect(bctx, px, py, pw, ph, 10); bctx.stroke();
    }
    function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function caustics(t) {
      const d = img.data;
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
        const u = x / CW * 9, v = y / CH * 6.5;
        const a = Math.sin(u + t * .9 + Math.sin(v * 1.3 + t * .7) * 1.4);
        const b = Math.sin(v * 1.6 - t * .8 + Math.sin(u * .9 - t * .5) * 1.6);
        const c = Math.sin((u + v) * .8 + t * .6);
        let k = 1 - Math.abs(a + b + c) / 1.6; k = k < 0 ? 0 : k * k * k;
        const o = (y * CW + x) * 4;
        d[o] = 210; d[o + 1] = 255; d[o + 2] = 250; d[o + 3] = k * 150;
      }
      cctx.putImageData(img, 0, 0);
    }
    function frame(now) {
      const t = now / 1000;
      ctx.drawImage(base, 0, 0, W, H);
      caustics(t);
      ctx.save(); roundRect(ctx, pool.px, pool.py, pool.pw, pool.ph, 10); ctx.clip();
      ctx.globalCompositeOperation = 'screen'; ctx.imageSmoothingEnabled = true;
      ctx.drawImage(caus, pool.px, pool.py, pool.pw, pool.ph);
      ctx.globalCompositeOperation = 'source-over';
      const sh = ctx.createLinearGradient(pool.px, pool.py, pool.px + pool.pw, pool.py + pool.ph);
      const s = (Math.sin(t * .4) + 1) / 2;
      sh.addColorStop(Math.max(0, s - .15), 'rgba(255,255,255,0)');
      sh.addColorStop(s, 'rgba(255,255,255,.10)');
      sh.addColorStop(Math.min(1, s + .15), 'rgba(255,255,255,0)');
      ctx.fillStyle = sh; ctx.fillRect(pool.px, pool.py, pool.pw, pool.ph);
      ctx.restore();
      if (run) requestAnimationFrame(frame);
    }
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = mc.clientWidth; H = mc.clientHeight;
      mc.width = W * dpr; mc.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      base.width = W; base.height = H; drawBase();
      if (!run) frame(performance.now());
    }
    const choose = (sel, key) => $$(sel + ' button').forEach(b => b.addEventListener('click', () => {
      $$(sel + ' button').forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
      state[key] = b.dataset[key]; drawBase(); if (!run) frame(performance.now());
    }));
    choose('[data-swatches]', 'pal'); choose('[data-patterns]', 'pat');
    size(); addEventListener('resize', size);
    if (!reduce) whenVisible(mc, v => { if (v && !run) { run = true; requestAnimationFrame(frame); } else if (!v) run = false; });

    $('[data-mosaic-send]').addEventListener('click', () => {
      const note = $('[data-note]');
      note.value = `Basseyn mozaikasi: ${PAL_NAMES[state.pal]}, naqsh: ${PAT_NAMES[state.pat]}.` + (note.value ? '\n' + note.value : '');
      const pool = $('input[name="tur"][value="Basseyn"]'); if (pool) pool.checked = true;
    });
  }

  /* Ariza */
  const form = $('[data-form]');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('[data-form-msg]');
      let ok = true;
      ['ism', 'tel'].forEach(n => {
        const el = form.elements[n], bad = !el.value.trim() || (n === 'tel' && el.value.replace(/\D/g, '').length < 9);
        el.classList.toggle('is-bad', bad); if (bad) ok = false;
      });
      if (!ok) { msg.style.color = '#ff9b80'; msg.textContent = 'Ism va telefon raqamini to‘liq yozing.'; return; }
      const f = new FormData(form);
      const body = [
        `Ism: ${f.get('ism')}`, `Telefon: ${f.get('tel')}`, `Kerak: ${f.getAll('tur').join(', ') || '-'}`,
        `Joy: ${f.get('joy') || '-'}`, `Maydon: ${f.get('maydon') || '-'} m2`, `Izoh: ${f.get('izoh') || '-'}`
      ].join('\n');
      location.href = `mailto:ariza@gumbazsoz.example?subject=${encodeURIComponent('Smeta so‘rovi')}&body=${encodeURIComponent(body)}`;
      msg.style.color = ''; msg.textContent = 'Rahmat. Ariza tayyorlandi — tez orada bog‘lanamiz.';
    });
  }

  const y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
