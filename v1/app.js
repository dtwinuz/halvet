(function () {
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
  var cv = $('[data-steam]');
  if (cv && !reduce) {
    var startSteam = function () {
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
    // LCP va birinchi bo'yashdan keyin
    var later = function () { setTimeout(startSteam, 400); };
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
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

  /* gumbaz: aylanib turgan yorug'lik teshiklari — scroll bilan */
  var dome = $('[data-dome] img');
  if (dome && !reduce) {
    scrollFx.push(function (vh) {
      var r = dome.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      dome.style.setProperty('--rot', (((r.top + r.height / 2) / vh - .5) * -50).toFixed(2) + 'deg');
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
