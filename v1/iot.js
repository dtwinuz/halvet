/* Aqlli boshqaruv — KONSEPSIYA (jonli namuna, real qurilmaga ulanmagan).
   Qiymatlar brauzerda simulyatsiya qilinadi; tugmalar holatni o'zgartiradi va telefon mini-app'i bilan sinxron. */
(function () {
  'use strict';
  window.HVIot = function (root, opts) {
    opts = opts || {};
    var $ = function (s, c) { return (c || root).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || root).querySelectorAll(s)); };
    var fmt = function (v, d) { return v.toFixed(d).replace('.', ','); };
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var hhmm = function () { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); };

    var S = { temp: 27.4, ph: 7.34, cl: 1.8, lvl: 98, pump: 72, kwh: 12.4 };
    var D = { pump: true, filter: true, heat: true, dosePh: true, doseCl: true, light: true };
    var H = { temp: [], ph: [], cl: [], lvl: [], pump: [], kwh: [] };
    var CH = { temp: [], ph: [], cl: [] };
    for (var i = 0; i < 48; i++) { // 24 soatlik tarix (har 30 daqiqa)
      var t = i / 47;
      CH.temp.push(26.6 + Math.sin(t * 5.2) * .35 + t * .7);
      CH.ph.push(7.3 + Math.sin(t * 7.1 + 1) * .08);
      CH.cl.push(1.8 + Math.sin(t * 4.3 + 2) * .35);
    }
    Object.keys(H).forEach(function (k) { for (var j = 0; j < 24; j++) H[k].push(S[k] + (Math.random() - .5) * (k === 'ph' ? .04 : k === 'cl' ? .1 : k === 'temp' ? .1 : 1)); });

    var RG = { temp: [25.5, 28.5], ph: [7.0, 7.7], cl: [0.4, 3.4], lvl: [93, 100], pump: [0, 100] };
    var spark = function (path, arr, k) {
      if (!path) return;
      var g = RG[k], mn = g ? g[0] : Math.min.apply(null, arr), mx = g ? g[1] : Math.max.apply(null, arr), r = (mx - mn) || 1, d = '';
      arr.forEach(function (v, i) { d += (i ? 'L' : 'M') + (i * 120 / (arr.length - 1)).toFixed(1) + ' ' + (26 - (v - mn) / r * 22).toFixed(1); });
      path.setAttribute('d', d);
    };
    var line = function (path, arr, lo, hi, W, Hh) {
      if (!path) return;
      var d = '';
      arr.forEach(function (v, i) { d += (i ? 'L' : 'M') + (i * W / (arr.length - 1)).toFixed(1) + ' ' + (Hh - 8 - (v - lo) / (hi - lo) * (Hh - 16)).toFixed(1); });
      path.setAttribute('d', d);
    };

    var feed = $('[data-feed]'), alertEl = $('[data-alert]'), alertTxt = $('[data-alert-t]'), alertSub = $('[data-alert-s]');
    var log = function (txt) {
      if (!feed) return;
      var li = document.createElement('li'), b = document.createElement('span'), tm = document.createElement('time');
      b.textContent = txt; tm.textContent = hhmm(); li.appendChild(b); li.appendChild(tm); li.className = 'is-new';
      feed.insertBefore(li, feed.firstChild);
      while (feed.children.length > 4) feed.removeChild(feed.lastChild);
      setTimeout(function () { li.classList.remove('is-new'); }, 900);
    };

    var render = function () {
      var vals = { temp: fmt(S.temp, 1), ph: fmt(S.ph, 2), cl: fmt(S.cl, 1), lvl: Math.round(S.lvl), pump: Math.round(S.pump), kwh: fmt(S.kwh, 1) };
      $$('[data-k]').forEach(function (el) {
        var k = el.getAttribute('data-k'), v = $('[data-v]', el);
        if (v) v.textContent = vals[k];
        spark($('[data-spark]', el), H[k], k);
        var bad = (k === 'ph' && (S.ph < 7.2 || S.ph > 7.6)) || (k === 'cl' && (S.cl < 1 || S.cl > 3)) || (k === 'temp' && (S.temp < 26 || S.temp > 28.5));
        el.classList.toggle('is-bad', bad);
      });
      $$('[data-pk]').forEach(function (el) { var k = el.getAttribute('data-pk'), v = $('[data-v]', el); if (v) v.textContent = vals[k]; el.classList.toggle('is-bad', (k === 'ph' && (S.ph < 7.2 || S.ph > 7.6)) || (k === 'cl' && (S.cl < 1 || S.cl > 3))); });
      line($('.c-t'), CH.temp, 25.5, 28.5, 400, 140); line($('.c-ph'), CH.ph, 6.9, 7.7, 400, 140); line($('.c-cl'), CH.cl, .5, 3.5, 400, 140);
      line($('[data-pchart]'), CH.temp, 25.5, 28.5, 300, 90);
      var pst = $('[data-dev="pump"]') && $('[data-st]', $('[data-dev="pump"]').closest('li'));
      if (pst) pst.textContent = D.pump ? 'Ishlamoqda · ' + Math.round(S.pump) + '%' : 'To‘xtatilgan';
      var hst = $('[data-dev="heat"]') && $('[data-st]', $('[data-dev="heat"]').closest('li'));
      if (hst) hst.textContent = D.heat ? 'Maqsad 27,0 °C' : 'O‘chiq';
      root.classList.toggle('is-dark', !D.light);
      // ogohlantirish
      var a = null;
      if (S.ph < 7.2) a = ['pH me’yordan past', fmt(S.ph, 2) + ' (me’yor 7,2–7,6)'];
      else if (S.ph > 7.6) a = ['pH me’yordan yuqori', fmt(S.ph, 2) + ' (me’yor 7,2–7,6)'];
      else if (S.cl < 1) a = ['Erkin xlor kam', fmt(S.cl, 1) + ' mg/l (me’yor 1–3)'];
      else if (!D.pump) a = ['Nasos to‘xtatilgan', 'Filtratsiya ishlamayapti'];
      else if (!D.heat && S.temp < 26.6) a = ['Suv sovumoqda', fmt(S.temp, 1) + ' °C'];
      if (alertEl) { alertEl.classList.toggle('is-ok', !a); if (alertTxt) alertTxt.textContent = a ? a[0] : 'Hammasi me’yorda'; if (alertSub) alertSub.textContent = a ? a[1] : 'pH, xlor va harorat nazoratda'; }
      $$('[data-iot-clock]').forEach(function (c) { c.textContent = hhmm(); });
    };

    var step = function () {
      var tgt = D.heat ? 27.5 : 25.8;
      S.temp += (tgt - S.temp) * .05 + (Math.random() - .5) * .04;
      S.ph += (Math.random() - .5) * .05 + (D.dosePh ? (7.34 - S.ph) * .25 : .025);
      S.cl += (Math.random() - .5) * .06 + (D.doseCl ? (1.8 - S.cl) * .2 : -.07);
      S.cl = clamp(S.cl, .2, 3.4); S.ph = clamp(S.ph, 6.9, 7.9);
      S.pump = D.pump ? clamp(S.pump + (Math.random() - .5) * 3 + (72 - S.pump) * .2, 60, 85) : Math.max(0, S.pump * .5);
      S.lvl = clamp(S.lvl + (Math.random() - .5) * .3, 96, 99);
      S.kwh += (D.pump ? .02 : 0) + (D.heat ? .05 : 0);
      Object.keys(H).forEach(function (k) { H[k].push(S[k]); H[k].shift(); });
      CH.temp.push(S.temp); CH.temp.shift(); CH.ph.push(S.ph); CH.ph.shift(); CH.cl.push(S.cl); CH.cl.shift();
      // avtomatika hodisalari
      if (D.dosePh && Math.random() < .08) log('pH avtomatik sozlandi (' + fmt(S.ph, 2) + ')');
      else if (D.doseCl && Math.random() < .06) log('Xlor dozasi berildi (+0,1 mg/l)');
      render();
    };

    var names = { pump: 'Nasos', filter: 'Filtr', heat: 'Isitish', dosePh: 'pH dozalash', doseCl: 'Xlor dozalash', light: 'Yoritish' };
    $$('[data-dev]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-dev'); D[k] = !D[k];
        b.classList.toggle('is-on', D[k]); b.setAttribute('aria-checked', D[k] ? 'true' : 'false');
        $$('[data-dev="' + k + '"]').forEach(function (o) { if (o !== b) { o.classList.toggle('is-on', D[k]); o.setAttribute('aria-checked', D[k] ? 'true' : 'false'); } });
        log(names[k] + (D[k] ? ' yoqildi' : ' o‘chirildi'));
        render();
      });
    });

    var timer = 0, vis = false;
    var run = function () { if (timer || opts.still) return; timer = setInterval(step, 1800); };
    var stop = function () { clearInterval(timer); timer = 0; };
    new IntersectionObserver(function (e) { vis = e[0].isIntersecting; vis && !document.hidden ? run() : stop(); }, { rootMargin: '100px 0px' }).observe(root);
    document.addEventListener('visibilitychange', function () { vis && !document.hidden ? run() : stop(); });
    render();
    return { step: step };
  };
})();
