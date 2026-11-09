/* Hero bug'i: haqiqiy bug' sprite'lari (img/steam.webp) — ko'tariladi, aylanadi, sichqoncha/barmoq itaradi va girdob qiladi.
   WebGL tuman (fog.js) ustida/ostida ishlaydi; 2D canvas, IntersectionObserver + visibilitychange bilan to'xtaydi. */
(function () {
  'use strict';
  window.HVPuffs = function (canvas, host, opts) {
    opts = opts || {};
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return false;
    var mob = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
    var N = mob ? 8 : 15, dpr = Math.min(window.devicePixelRatio || 1, mob ? 1 : 1.25);
    var fps = mob ? 30 : 60, step = 1000 / fps;
    var W = 0, H = 0, P = [], img = new Image(), ready = false;
    var mx = -1e5, my = -1e5, mvx = 0, mvy = 0, lastMove = 0, thick = 0;
    var raf = 0, last = 0, acc = 0, visible = true, still = !!opts.still;

    var size = function () {
      var r = host.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    };
    var spawn = function (p, init) {
      p.x = W * (0.08 + Math.random() * 0.84);
      p.y = init ? H * (0.2 + Math.random() * 0.85) : H * (0.85 + Math.random() * 0.3);
      p.s = (mob ? 1.05 : 0.8) * H / 512 * (0.55 + Math.random() * 0.75);
      p.r = Math.random() * 6.283; p.vr0 = (Math.random() - 0.5) * 0.09; p.vr = p.vr0;
      p.bvx = (Math.random() - 0.5) * 7; p.bvy = -(7 + Math.random() * 13);
      p.vx = p.bvx; p.vy = p.bvy;
      p.life = 16 + Math.random() * 14; p.age = init ? Math.random() * p.life : 0;
      p.fx = Math.random() < 0.5 ? -1 : 1; p.a = 0.24 + Math.random() * 0.3;
      p.w = 0.6 + Math.random() * 0.8; p.ph = Math.random() * 6.283;
      return p;
    };

    var update = function (dt, t) {
      var R = Math.max(W, H) * (mob ? 0.32 : 0.24), act = Math.max(0, 1 - (t - lastMove) / 900);
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        p.age += dt;
        if (p.age > p.life || p.y < -H * 0.5) { spawn(p, false); continue; }
        // sekin chayqalish (shamolsiz bug' ham "nafas oladi")
        var sway = Math.sin(t * 0.00035 * p.w + p.ph) * 6;
        if (act > 0) {
          var dx = p.x - mx, dy = p.y - my, d = Math.sqrt(dx * dx + dy * dy) + 1;
          if (d < R) {
            var f = (1 - d / R) * act;
            p.vx += (dx / d * 140 + mvx * 0.9) * f * dt;
            p.vy += (dy / d * 140 + mvy * 0.9) * f * dt;
            p.vr += (dx * mvy - dy * mvx > 0 ? 1 : -1) * f * 1.6 * dt; // girdob
          }
        }
        // asta-sekin o'z tabiiy oqimiga qaytadi
        var k = Math.min(1, dt * 0.55);
        p.vx += (p.bvx + sway - p.vx) * k; p.vy += (p.bvy - p.vy) * k; p.vr += (p.vr0 - p.vr) * k;
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      }
      mvx *= 0.9; mvy *= 0.9;
    };

    var draw = function () {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var iw = img.naturalWidth, ih = img.naturalHeight, boost = 1 + thick * 0.8;
      for (var i = 0; i < P.length; i++) {
        var p = P[i], env = Math.sin(Math.PI * Math.min(1, p.age / p.life));
        var a = p.a * env * env * boost;
        if (a < 0.005) continue;
        ctx.globalAlpha = Math.min(0.85, a);
        var c = Math.cos(p.r) * p.s * dpr, s = Math.sin(p.r) * p.s * dpr;
        ctx.setTransform(c * p.fx, s * p.fx, -s, c, p.x * dpr, p.y * dpr);
        ctx.drawImage(img, -iw / 2, -ih / 2);
      }
      ctx.globalAlpha = 1;
    };

    var loop = function (t) {
      raf = 0;
      if (!visible) return;
      raf = requestAnimationFrame(loop);
      if (!last) last = t;
      var el = t - last; last = t;
      if (el > 250) el = step; // tab qaytganda sakramasin
      acc += el;
      if (acc < step - 1) return;
      var dt = Math.min(0.05, acc / 1000); acc = 0;
      update(dt, t); draw();
    };
    var start = function () { if (!raf && !still && ready && visible) { last = 0; raf = requestAnimationFrame(loop); } };
    var stop = function () { if (raf) cancelAnimationFrame(raf); raf = 0; };

    host.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect(), nx = e.clientX - r.left, ny = e.clientY - r.top, now = performance.now();
      if (mx > -1e4) { var dtm = Math.max(16, now - lastMove) / 1000; mvx = mvx * 0.5 + (nx - mx) / dtm * 0.5; mvy = mvy * 0.5 + (ny - my) / dtm * 0.5; }
      mx = nx; my = ny; lastMove = now;
    }, { passive: true });
    host.addEventListener('pointerleave', function () { mx = my = -1e5; });

    var ro = function () { size(); if (still && ready) draw(); };
    window.addEventListener('resize', ro, { passive: true });
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting && !document.hidden; visible ? start() : stop(); }).observe(host);
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; visible ? start() : stop(); });

    size();
    for (var i = 0; i < N; i++) P.push(spawn({}, true));
    img.decoding = 'async';
    img.onload = function () { ready = true; canvas.classList.add('is-on'); if (still) { update(0, 0); draw(); } else start(); };
    img.src = opts.src || 'img/steam.webp';

    return { setScroll: function (k) { thick = k; } };
  };
})();
