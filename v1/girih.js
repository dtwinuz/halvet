/* Girih: sakkiz qirrali yulduz va xoch (khatam) naqshi.
   Scroll bo'yicha 3 bosqich: 1) kompas aylanalari va to'r, 2) yulduz tasmalari markazdan tarqalib chiziladi,
   3) yulduzlar oniks, xochlar mozaika bilan to'ladi. Faqat bitta CSS o'zgaruvchi (--gp) har kadr yangilanadi. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var mk = function (tag, attrs, parent) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  var starD = function (R, r, rot) {
    var d = '';
    for (var i = 0; i < 16; i++) {
      var a = (i * 22.5 + rot) * Math.PI / 180, q = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (Math.cos(a) * q).toFixed(2) + ' ' + (Math.sin(a) * q).toFixed(2);
    }
    return d + 'Z';
  };

  window.HVGirih = function (field, opts) {
    opts = opts || {};
    var svg = null, lastW = 0;

    var build = function () {
      var W = field.clientWidth, H = field.clientHeight;
      if (!W || !H) return;
      lastW = W;
      if (svg) svg.remove();
      var s = Math.max(104, Math.min(176, W / 8.5)), R = s / 2, h = s / (2 * Math.SQRT2), r = h / Math.cos(Math.PI / 8);
      var fx = W * (W > 900 ? 0.64 : 0.5), fy = H * (W > 900 ? 0.5 : 0.62); // naqsh markazi (matndan uzoqroq)
      var maxD = Math.sqrt(Math.max(fx, W - fx) * Math.max(fx, W - fx) + Math.max(fy, H - fy) * Math.max(fy, H - fy));

      svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid slice', 'class': 'g-svg', focusable: 'false' });
      var defs = mk('defs', {}, svg);
      mk('path', { id: 'gStar', d: starD(R, r, 0), pathLength: 1 }, defs);
      mk('path', { id: 'gIn', d: starD(R * 0.46, r * 0.46 * 0.93, 22.5), pathLength: 1 }, defs);
      // oniks: 4 ta oynali nusxa — chok ko'rinmaydi
      var TW = 520, TH = 273, on = mk('pattern', { id: 'gOnyx', patternUnits: 'userSpaceOnUse', width: TW * 2, height: TH * 2 }, defs);
      [[1, 1, 0, 0], [-1, 1, TW * 2, 0], [1, -1, 0, TH * 2], [-1, -1, TW * 2, TH * 2]].forEach(function (m) {
        mk('image', { href: opts.onyx || 'img/oniks.webp', width: TW, height: TH, preserveAspectRatio: 'none', transform: 'matrix(' + m[0] + ' 0 0 ' + m[1] + ' ' + m[2] + ' ' + m[3] + ')' }, on);
      });
      var mo = mk('pattern', { id: 'gMos', patternUnits: 'userSpaceOnUse', width: 9, height: 9 }, defs);
      mk('rect', { width: 9, height: 9, fill: '#0a2a31' }, mo);
      mk('rect', { x: 1, y: 1, width: 7, height: 7, fill: '#1b6f80' }, mo);
      mk('rect', { x: 1, y: 1, width: 3.5, height: 3.5, fill: '#2a8ea0', opacity: '.55' }, mo);
      var gl = mk('radialGradient', { id: 'gShade', cx: fx / W, cy: fy / H, r: .75 }, defs);
      mk('stop', { offset: 0, 'stop-color': '#0d1113', 'stop-opacity': 0 }, gl);
      mk('stop', { offset: 1, 'stop-color': '#0d1113', 'stop-opacity': .78 }, gl);

      var cam = mk('g', { 'class': 'g-cam' }, svg);
      cam.style.setProperty('transform-origin', fx + 'px ' + fy + 'px');
      var mos = mk('rect', { x: -s, y: -s, width: W + 2 * s, height: H + 2 * s, fill: 'url(#gMos)', 'class': 'g-mos' }, cam);
      void mos;
      var msk = mk('mask', { id: 'gMask', maskUnits: 'userSpaceOnUse', x: -s, y: -s, width: W + 2 * s, height: H + 2 * s }, defs);
      mk('rect', { x: -s, y: -s, width: W + 2 * s, height: H + 2 * s, fill: 'url(#gOnyx)', mask: 'url(#gMask)', 'class': 'g-onyx' }, cam);
      var guides = mk('g', { 'class': 'g-guides' }, cam);
      var stars = mk('g', { 'class': 'g-stars' }, cam);

      var nd = function (x, y) { var dx = x - fx, dy = y - fy; return Math.min(1, Math.sqrt(dx * dx + dy * dy) / maxD); };
      // to'r markazga moslanadi: bitta yulduz aynan fx,fy da turadi
      var x0 = fx - Math.ceil(fx / s + 1) * s, y0 = fy - Math.ceil(fy / s + 1) * s;
      // 1) to'r chiziqlari va diagonallar
      for (var x = x0; x <= W + s; x += s) {
        var l = mk('line', { x1: x, y1: -s, x2: x, y2: H + s, pathLength: 1, 'class': 'g-ln' }, guides);
        l.style.setProperty('--d', nd(x, fy).toFixed(3));
      }
      for (var y = y0; y <= H + s; y += s) {
        var l2 = mk('line', { x1: -s, y1: y, x2: W + s, y2: y, pathLength: 1, 'class': 'g-ln' }, guides);
        l2.style.setProperty('--d', nd(fx, y).toFixed(3));
      }
      var span = W + H + 2 * s;
      for (var k = -span; k <= span; k += s * 2) {
        var a1 = mk('line', { x1: fx + k - span, y1: fy - span, x2: fx + k + span, y2: fy + span, pathLength: 1, 'class': 'g-ln g-ln--d' }, guides);
        a1.style.setProperty('--d', Math.min(1, Math.abs(k) / maxD).toFixed(3));
        var a2 = mk('line', { x1: fx + k + span, y1: fy - span, x2: fx + k - span, y2: fy + span, pathLength: 1, 'class': 'g-ln g-ln--d' }, guides);
        a2.style.setProperty('--d', Math.min(1, Math.abs(k) / maxD).toFixed(3));
      }
      // 2) har tugunda kompas aylanasi + yulduz (to'ldirish, tasma, markaziy chiziq, ichki rozetka)
      for (var yy = y0; yy <= H + s; yy += s) {
        for (var xx = x0; xx <= W + s; xx += s) {
          var d = nd(xx, yy).toFixed(3);
          var c = mk('circle', { cx: xx, cy: yy, r: R, pathLength: 1, 'class': 'g-cc' }, guides);
          c.style.setProperty('--d', d);
          var g = mk('g', { transform: 'translate(' + xx.toFixed(1) + ' ' + yy.toFixed(1) + ')', 'class': 'g-st' }, stars);
          g.style.setProperty('--d', d);
          var mu = mk('use', { href: '#gStar', transform: 'translate(' + xx.toFixed(1) + ' ' + yy.toFixed(1) + ')', fill: '#fff', 'class': 'g-mf' }, msk);
          mu.style.setProperty('--d', d);
          mk('use', { href: '#gStar', 'class': 'g-strap' }, g);
          mk('use', { href: '#gStar', 'class': 'g-core' }, g);
          mk('use', { href: '#gIn', 'class': 'g-in' }, g);
          // xoch markazidagi kichik romb
          var cx = xx + s / 2, cy = yy + s / 2, q = s * 0.12;
          var dm = mk('path', { d: 'M' + cx + ' ' + (cy - q) + 'L' + (cx + q) + ' ' + cy + 'L' + cx + ' ' + (cy + q) + 'L' + (cx - q) + ' ' + cy + 'Z', pathLength: 1, 'class': 'g-dm' }, stars);
          dm.style.setProperty('--d', nd(cx, cy).toFixed(3));
        }
      }
      mk('rect', { width: W, height: H, fill: 'url(#gShade)', 'class': 'g-shade' }, svg);
      field.appendChild(svg);
    };

    build();
    var t = 0;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () { if (Math.abs(field.clientWidth - lastW) > 40) build(); }, 220);
    }, { passive: true });
    return { rebuild: build };
  };
})();
