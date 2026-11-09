(function () {
  var VER = (function () { var s = document.currentScript && document.currentScript.src || ''; var i = s.indexOf('?v='); return i < 0 ? '' : s.slice(i + 3); })();
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoverDev = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  var nav = $('[data-nav]'), burger = $('[data-burger]'), bar = $('.hv-bar'), hero = $('.hv-hero'), contact = $('#aloqa');

  /* scroll-bog'liq effektlar bitta rAF'da */
  var scrollFx = [];
  var ticking = false;
  var runScroll = function () {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    nav.classList.toggle('is-solid', y > 40);
    if (bar) {
      var c = contact.getBoundingClientRect();
      bar.classList.toggle('is-on', y > hero.offsetHeight * 0.8 && c.top > vh * 0.6);
    }
    for (var i = 0; i < scrollFx.length; i++) scrollFx[i](vh);
  };
  var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(runScroll); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  var closeMenu = function () { nav.classList.remove('is-menu'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
  burger.addEventListener('click', function () {
    var open = !nav.classList.contains('is-menu');
    nav.classList.toggle('is-menu', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('.hv-nav__links a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('[data-reveal]').forEach(function (el) { io.observe(el); });

  /* tuman/bug': rasm ustida suzib yuradi va ko'tariladi. Past aniqlikda chiziladi (yumshoq va arzon),
     30 fps, ekrandan chiqsa yoki tab yashirilsa to'xtaydi */
  var cv = $('[data-steam]'), startSteam = null;
  if (cv && !reduce) {
    startSteam = function () {
      var ctx = cv.getContext('2d'), W, H, Q = 0.35, puffs = [], visible = true, looping = false, last = 0;
      // bulutsimon sprite: bir nechta siljigan dog'lar
      var sprite = document.createElement('canvas'); sprite.width = sprite.height = 128;
      var sg = sprite.getContext('2d');
      [[64, 64, 60, .30], [44, 70, 38, .22], [86, 58, 40, .22], [62, 44, 34, .18], [70, 86, 36, .16]].forEach(function (b) {
        var g = sg.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2]);
        g.addColorStop(0, 'rgba(250,240,226,' + b[3] + ')'); g.addColorStop(.6, 'rgba(250,240,226,' + (b[3] * .35) + ')'); g.addColorStop(1, 'rgba(250,240,226,0)');
        sg.fillStyle = g; sg.fillRect(0, 0, 128, 128);
      });
      var size = function () { W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.ceil(W * Q); cv.height = Math.ceil(H * Q); ctx.setTransform(Q, 0, 0, Q, 0, 0); };
      var dir = Math.random() < .5 ? -1 : 1;
      var spawn = function (p, init) {
        p.r = (W < 700 ? 140 : 200) + Math.random() * 240;
        // yangi bulut chetdan kiradi yoki joyida sekin paydo bo'ladi
        p.x = init || Math.random() < .5 ? Math.random() * W : (dir > 0 ? -p.r : W + p.r);
        p.y = H * (.3 + Math.random() * .75);
        p.vx = dir * (.25 + Math.random() * .55); p.vy = .08 + Math.random() * .22;
        p.life = init ? Math.random() * 300 : 0; p.max = 700 + Math.random() * 600; p.ph = Math.random() * 6.28; p.rot = Math.random() * 6.28;
        return p;
      };
      size();
      var n = W < 700 ? 9 : 18, dens = W < 700 ? .6 : .9;
      for (var i = 0; i < n; i++) puffs.push(spawn({}, true));
      window.addEventListener('resize', size);
      cv.classList.add('is-on');
      var tick = function (t) {
        if (!visible || document.hidden) { looping = false; return; }
        requestAnimationFrame(tick);
        if (t - last < 33) return;
        last = t;
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < puffs.length; i++) {
          var p = puffs[i];
          p.life++; p.y -= p.vy; p.x += p.vx + Math.sin(p.life / 90 + p.ph) * .35;
          var k = p.life / p.max, s = p.r * (1 + k * .35);
          ctx.globalAlpha = Math.min(1, k * 3) * (1 - k) * dens;
          ctx.drawImage(sprite, p.x - s, p.y - s * .7, s * 2, s * 1.4);
          if (p.life > p.max || p.x < -2 * p.r || p.x > W + 2 * p.r) spawn(p, false);
        }
      };
      var go = function () { if (!looping && visible && !document.hidden) { looping = true; requestAnimationFrame(tick); } };
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; go(); }).observe(hero);
      document.addEventListener('visibilitychange', go);
    };
  }
  /* hero tumani: avval WebGL shader (jonli, sichqonchaga javob beradi), bo'lmasa 2D bug' */
  var fogCanvas = $('[data-fog]'), fog = null;
  var startFog = function () {
    if (fogCanvas && window.HVFog) {
      try { fog = window.HVFog(fogCanvas, hero, { still: reduce, onLost: function () { hero.classList.remove('is-gl'); if (startSteam && !reduce) startSteam(); } }); } catch (e) { fog = null; }
    }
    if (fog) hero.classList.add('is-gl');
    else if (typeof startSteam === 'function' && !reduce) startSteam();
    onScroll();
  };
  /* haqiqiy bug' sprite'lari: tuman ostida ko'tariladi, sichqoncha/barmoq bilan itariladi */
  var puffCanvas = $('[data-puffs]'), puffs = null;
  var startPuffs = function () {
    if (!puffCanvas || !window.HVPuffs || saveData) return;
    try { puffs = window.HVPuffs(puffCanvas, hero, { still: reduce, src: 'img/steam.webp' }) || null; } catch (e) { puffs = null; }
  };
  var laterFog = function () { setTimeout(function () { startFog(); startPuffs(); }, 250); };
  if (document.readyState === 'complete') laterFog(); else window.addEventListener('load', laterFog);

  /* hero: 3D chuqurlik — rasm, tuman va matn sichqonchaga turli masofada javob beradi; scroll = hammom ichiga kirish */
  if (!reduce) {
    if (hoverDev) hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3));
      hero.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    }, { passive: true });
    scrollFx.push(function (vh) {
      var hs = clamp(window.scrollY / (hero.offsetHeight || vh), 0, 1);
      hero.style.setProperty('--hs', hs.toFixed(3));
      if (fog) fog.setScroll(hs);
      if (puffs) puffs.setScroll(hs);
    });
  }

  /* hero: sichqoncha ortidan yorug'lik (faqat sichqonchali qurilmada) */
  var glow = $('[data-glow]');
  if (glow && hoverDev && !reduce) {
    var gq = false, gx = 0, gy = 0;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(); gx = e.clientX - r.left; gy = e.clientY - r.top;
      if (!gq) { gq = true; requestAnimationFrame(function () { gq = false; glow.style.setProperty('--gx', gx + 'px'); glow.style.setProperty('--gy', gy + 'px'); }); }
    });
  }

  /* manifest: so'zlar o'qilgan sari yonadi */
  var st = $('[data-words]');
  if (st && !reduce) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    walk(st);
    var words = $$('.w', st);
    scrollFx.push(function (vh) {
      var r = st.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3), 0, 1);
      var on = Math.round(p * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < on);
    });
  }

  /* gumbaz: 3D sahna (three.js, faqat yaqinlashganda yuklanadi); WebGL bo'lmasa surat scroll bilan aylanadi */
  var domeFig = $('[data-dome]'), dome = domeFig && $('img', domeFig), dome3d = null;
  if (dome) {
    scrollFx.push(function (vh) {
      var r = domeFig.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var k = (r.top + r.height / 2) / vh - .5;
      if (dome3d) dome3d.setScroll(-k);
      else if (!reduce) dome.style.setProperty('--rot', (k * -50).toFixed(2) + 'deg');
    });
    var glOk = (function () { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
    var saveData = navigator.connection && navigator.connection.saveData;
    if (glOk && !saveData) {
      new IntersectionObserver(function (e, o) {
        if (!e[0].isIntersecting) return;
        o.disconnect();
        var go3d = function () {
          import('./dome.js' + (VER ? '?v=' + VER : '')).then(function (m) { return m.mountDome(domeFig, dome, { reduce: reduce }); })
            .then(function (h) { dome3d = h; dome.style.removeProperty('--rot'); onScroll(); })
            .catch(function () { domeFig.classList.remove('is-3d'); });
        };
        if (dome.complete) go3d(); else dome.addEventListener('load', go3d, { once: true });
      }, { rootMargin: '600px 0px' }).observe(domeFig);
    }
  }

  /* villa: kichik ramkadan butun ekranga ochiladi */
  var band = $('.hv-band');
  if (band && !reduce) {
    scrollFx.push(function (vh) {
      var r = band.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = clamp((vh - r.top) / (vh * .85), 0, 1), k = 1 - p;
      band.style.setProperty('--bi', (k * 9).toFixed(2) + '%');
      band.style.setProperty('--bj', (k * 12).toFixed(2) + '%');
      band.style.setProperty('--br', (k * 28).toFixed(1) + 'px');
      band.style.setProperty('--bs', (1.18 - p * .18).toFixed(3));
    });
  }

  /* 3D egilish + yaltirash: makon kartalari va chizma varag'i */
  var tilt = function (el, max) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', ((x - .5) * max).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((.5 - y) * max).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    }, { passive: true });
    el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  };
  if (hoverDev && !reduce) {
    $$('[data-space]').forEach(function (s) { tilt(s, 7); });
    var sheet = $('.hv-bp__sheet'); if (sheet) tilt(sheet, 4);
  }

  /* maxsus kursor + magnit tugmalar (faqat sichqoncha) */
  if (hoverDev && !reduce) {
    var curEl = $('.hv-cursor');
    if (curEl) {
      var cx = -100, cy = -100, px = -100, py = -100, cRun = false;
      var cLoop = function () {
        px += (cx - px) * .2; py += (cy - py) * .2;
        curEl.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0)';
        if (Math.abs(cx - px) + Math.abs(cy - py) > .3) requestAnimationFrame(cLoop); else cRun = false;
      };
      document.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        cx = e.clientX; cy = e.clientY; curEl.classList.add('is-on');
        var t = e.target.closest && e.target.closest('a,button,[data-space],.bp-c,label,input,textarea');
        curEl.classList.toggle('is-big', !!t);
        curEl.classList.toggle('is-text', !!(e.target.closest && e.target.closest('input,textarea')));
        if (!cRun) { cRun = true; requestAnimationFrame(cLoop); }
      }, { passive: true });
      document.addEventListener('pointerleave', function () { curEl.classList.remove('is-on'); });
      document.documentElement.classList.add('has-cursor');
    }
    $$('.hv-btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * .22).toFixed(1) + 'px');
        b.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * .35).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });
  }

  /* silliq inersiyali scroll (Lenis); anchor'lar ham silliq */
  if (window.Lenis && !reduce && hoverDev) {
    var lenis = new window.Lenis({ lerp: .09, smoothWheel: true });
    var lraf = function (t) { lenis.raf(t); requestAnimationFrame(lraf); };
    requestAnimationFrame(lraf);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'), el = id === '#top' ? 0 : $(id);
        if (el === null) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: id === '#top' ? 0 : -60, duration: 1.6 });
      });
    });
  }

  /* parallax band */
  var par = $('[data-parallax]');
  if (par && !reduce) {
    scrollFx.push(function (vh) {
      var r = par.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) par.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * -0.12).toFixed(1) + 'px,0)';
    });
  }

  /* jarayon: mis chiziq bosqichlarni ketma-ket yoqadi */
  var steps = $('[data-steps]'), rail = $('[data-rail]');
  if (steps && rail && !reduce) {
    var items = $$('li', steps);
    steps.classList.add('is-track');
    scrollFx.push(function (vh) {
      var r = steps.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 1.5) return;
      var p = clamp((vh * 0.8 - r.top) / (r.height * 0.9), 0, 1);
      rail.style.setProperty('--p', p.toFixed(3));
      var lit = Math.ceil(p * items.length - 0.15);
      items.forEach(function (li, i) { li.classList.toggle('is-lit', i < lit); });
    });
  }

  /* pin qilingan 3D sahna: sticky stage + scroll progress + lazy modul */
  var pinned3d = function (track, stage, mod, fn, onP, onFail) {
    var h3 = null;
    scrollFx.push(function (vh) {
      var r = track.getBoundingClientRect(), prev = stage.previousElementSibling;
      var off = prev ? prev.getBoundingClientRect().bottom - r.top : 0;
      if (r.bottom < -vh || r.top > vh * 1.5) return;
      var p = clamp(-(r.top + off) / Math.max(1, r.height - off - vh), 0, 1);
      if (h3) h3.setProgress(p);
      onP(p);
    });
    new IntersectionObserver(function (e, o) {
      if (!e[0].isIntersecting) return;
      o.disconnect();
      import('./' + mod + (VER ? '?v=' + VER : '')).then(function (m) { return m[fn](stage, { reduce: reduce, onLost: onFail }); })
        .then(function (h) { h3 = h; onScroll(); }).catch(onFail);
    }, { rootMargin: '900px 0px' }).observe(track);
  };
  var glOk2 = (function () { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  var use3d = glOk2 && !reduce && !(navigator.connection && navigator.connection.saveData);

  /* makonlar: 3D kamera parvozi */
  var fly = $('[data-fly]'), flyStage = $('[data-fly-stage]'), spSec = $('#makonlar');
  if (fly && use3d) {
    fly.hidden = false; spSec.classList.add('is-fly');
    var chs = $$('[data-ch]', fly), bar3 = $('[data-fly-bar]', fly), CH = [[.06, .33], [.42, .68], [.76, 1.01]];
    pinned3d(fly, flyStage, 'spaces3d.js', 'mountSpaces', function (p) {
      chs.forEach(function (c, i) { c.classList.toggle('is-on', p >= CH[i][0] && p < CH[i][1]); });
      bar3.style.setProperty('--p', p.toFixed(3));
      flyStage.classList.toggle('is-start', p < .04);
    }, function () { fly.hidden = true; spSec.classList.remove('is-fly'); });
  }

  /* texnik xona 3D: suv yo'li */
  var eq = $('[data-eq]'), eqStage = $('[data-eq-stage]');
  if (eq) {
    var sts = $$('[data-st]', eq);
    if (use3d) {
      eq.classList.add('is-3d');
      pinned3d(eq, eqStage, 'equip3d.js', 'mountEquip', function (p) {
        var cur = Math.round(p * (sts.length - 1));
        sts.forEach(function (li, i) { li.classList.toggle('is-on', i === cur); li.classList.toggle('is-done', i < cur); });
      }, function () { eq.classList.remove('is-3d'); });
    }
  }

  /* me'yor datchiklari: strelka me'yor oralig'ida tebranadi */
  var gauges = $$('.hv-gauge');
  if (gauges.length) {
    var gOn = false, gRun = false;
    gauges.forEach(function (g) {
      var mn = +g.dataset.min, mxv = +g.dataset.max, lo = +g.dataset.lo, hi = +g.dataset.hi;
      var a = (lo - mn) / (mxv - mn) * 100, b = (hi - mn) / (mxv - mn) * 100, band = $('.g-band', g);
      band.setAttribute('pathLength', '100'); $('.g-bg', g).setAttribute('pathLength', '100');
      band.setAttribute('stroke-dasharray', '0 ' + a.toFixed(1) + ' ' + (b - a).toFixed(1) + ' 200');
    });
    var gTick = function (now) {
      if (!gOn) { gRun = false; return; }
      gauges.forEach(function (g, i) {
        var mn = +g.dataset.min, mxv = +g.dataset.max, lo = +g.dataset.lo, hi = +g.dataset.hi;
        var v = (lo + hi) / 2 + (hi - lo) / 2 * .75 * Math.sin(now / 1000 * (.35 + i * .07) + i * 1.3);
        var ang = ((v - mn) / (mxv - mn) - .5) * 180;
        $('.g-nd', g).setAttribute('transform', 'rotate(' + ang.toFixed(1) + ' 60 62)');
        $('[data-val]', g).textContent = v.toFixed(+g.dataset.dec).replace('.', ',');
      });
      requestAnimationFrame(gTick);
    };
    new IntersectionObserver(function (e) { gOn = e[0].isIntersecting && !reduce; if (gOn && !gRun) { gRun = true; requestAnimationFrame(gTick); } }).observe($('[data-gauges]'));
    if (reduce) gTick(0);
  }

  /* kosa qatlamlari: scroll bilan ajraladi, ro'yxat qatlamni yoritadi */
  var lay = $('[data-layers]');
  /* girih: scroll bilan chiziladigan naqsh (to'r -> yulduz -> tosh), sichqoncha ortidan yorug'lik */
  var gh = $('[data-girih]');
  if (gh && window.HVGirih) {
    var ghField = $('[data-girih-field]', gh), ghSteps = $$('[data-gs]', gh), ghApi = null;
    var ghMake = function () { if (!ghApi) { try { ghApi = window.HVGirih(ghField, { onyx: 'img/oniks.webp' }); } catch (e) { ghApi = null; } } };
    if (reduce) { gh.classList.add('is-still'); gh.style.setProperty('--gp', '1'); ghSteps.forEach(function (li) { li.classList.add('is-on'); }); }
    new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { o.disconnect(); ghMake(); onScroll(); } }, { rootMargin: '600px 0px' }).observe(gh);
    if (!reduce) scrollFx.push(function (vh) {
      var r = gh.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 1.5) return;
      var p = clamp((vh * .35 - r.top) / Math.max(1, r.height - vh * .65), 0, 1);
      gh.style.setProperty('--gp', p.toFixed(4));
      ghSteps.forEach(function (li, i) { var a = [0, .24, .6][i]; li.classList.toggle('is-on', p >= a); li.classList.toggle('is-now', p >= a && p < ([.24, .6, 2][i])); });
    });
    if (hoverDev && !reduce) gh.addEventListener('pointermove', function (e) {
      var r = gh.querySelector('.hv-girih__stage').getBoundingClientRect();
      gh.style.setProperty('--sx', (e.clientX - r.left).toFixed(0) + 'px');
      gh.style.setProperty('--sy', (e.clientY - r.top).toFixed(0) + 'px');
      gh.classList.add('is-spot');
    }, { passive: true });
    gh.addEventListener('pointerleave', function () { gh.classList.remove('is-spot'); });
  }

  if (lay) {
    var stack = $('.hv-layers__stack', lay), lis = $$('.hv-layers__list li', lay), ls = $$('i', stack);
    if (!reduce) scrollFx.push(function (vh) {
      var r = stack.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      stack.style.setProperty('--ex', clamp((vh * .9 - r.top) / (vh * .7), 0, 1).toFixed(3));
    });
    lis.forEach(function (li, n) {
      var i = ls.length - 1 - n;
      var on = function (v) { ls[i].classList.toggle('is-hot', v); li.classList.toggle('is-hot', v); stack.classList.toggle('has-hot', v); };
      li.addEventListener('mouseenter', function () { on(true); });
      li.addEventListener('mouseleave', function () { on(false); });
    });
  }

  /* spaces */
  var spaces = $$('[data-space]');
  var openSpace = function (s) { spaces.forEach(function (x) { x.classList.toggle('is-open', x === s); }); };
  spaces.forEach(function (s) {
    s.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) openSpace(s); });
    s.addEventListener('click', function () { openSpace(s); });
    s.addEventListener('focus', function () { openSpace(s); });
  });

  /* blueprints */
  var bp = $('[data-bp]');
  if (bp && window.HV_BP) {
    var draw = $('[data-bp-draw]', bp), notes = $('[data-bp-notes]', bp), code = $('[data-bp-code]', bp), name = $('[data-bp-name]', bp);
    var tabs = $$('[data-tab]', bp), auto = null, cur = 0;
    var hot = function (n) {
      cur = n;
      $$('.bp-c', draw).forEach(function (c) { c.classList.toggle('is-hot', +c.dataset.n === n); });
      $$('li', notes).forEach(function (li, i) { li.classList.toggle('is-hot', i + 1 === n); });
    };
    var drawIn = function () {
      if (reduce) return;
      draw.classList.remove('is-draw'); void draw.offsetWidth; draw.classList.add('is-draw');
    };
    var show = function (key, animate) {
      var d = window.HV_BP[key];
      tabs.forEach(function (t) { var on = t.dataset.tab === key; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', String(on)); });
      code.textContent = d.code; name.textContent = d.name;
      draw.innerHTML = d.svg;
      $$('.bp-l, .bp-thin', draw).forEach(function (el) { el.setAttribute('pathLength', '1'); });
      if (animate) drawIn();
      notes.innerHTML = d.notes.map(function (n, i) {
        return '<li data-n="' + (i + 1) + '"><span class="n">' + (i + 1) + '</span><div><b>' + n.t + '</b><small>' + n.d + '</small></div></li>';
      }).join('');
      hot(0);
      $$('.bp-c', draw).forEach(function (c) {
        c.addEventListener('mouseenter', function () { stop(); hot(+c.dataset.n); });
        c.addEventListener('click', function () { stop(); hot(+c.dataset.n); });
      });
      $$('li', notes).forEach(function (li) {
        li.addEventListener('mouseenter', function () { stop(); hot(+li.dataset.n); });
      });
    };
    var stop = function () { if (auto) { clearInterval(auto); auto = null; } };
    tabs.forEach(function (t) { t.addEventListener('click', function () { stop(); show(t.dataset.tab, true); }); });
    show('filtr', false);
    new IntersectionObserver(function (e) { bp.classList.toggle('is-live', e[0].isIntersecting); }).observe(bp);
    new IntersectionObserver(function (e, o) {
      if (!e[0].isIntersecting) return;
      o.disconnect();
      drawIn();
      if (reduce) return;
      var total = function () { return $$('li', notes).length; };
      setTimeout(function () {
        hot(1);
        auto = setInterval(function () { hot(cur >= total() ? 1 : cur + 1); }, 2600);
      }, 1500);
    }, { threshold: .35 }).observe(draw);
  }

  /* form */
  var form = $('[data-form]'), msg = $('[data-form-msg]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['ism', 'tel'].forEach(function (n) {
        var f = form.elements[n], bad = !f.value.trim() || (n === 'tel' && f.value.replace(/\D/g, '').length < 9);
        f.classList.toggle('is-bad', bad); if (bad) ok = false;
      });
      if (!ok) { msg.textContent = 'Ism va telefon raqamini to‘liq kiriting.'; return; }
      var makon = $$('input[name=makon]:checked', form).map(function (c) { return c.value; }).join(', ');
      var body = 'Ism: ' + form.elements.ism.value + '\nTelefon: ' + form.elements.tel.value + '\nMakon: ' + (makon || '-') +
        '\nJoy: ' + (form.elements.joy.value || '-') + '\nMaydon: ' + (form.elements.maydon.value || '-') + '\nIzoh: ' + (form.elements.izoh.value || '-');
      window.location.href = 'mailto:ariza@halvet.example?subject=' + encodeURIComponent('Konsultatsiya') + '&body=' + encodeURIComponent(body);
      msg.textContent = 'Rahmat! Arizangiz tayyor — pochta ilovasida yuboring, biz qo‘ng‘iroq qilamiz.';
    });
    $$('input', form).forEach(function (f) { f.addEventListener('input', function () { f.classList.remove('is-bad'); }); });
  }

  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();
  runScroll();
})();
