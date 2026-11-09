(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var nav = $('[data-nav]'), burger = $('[data-burger]'), bar = $('.hv-bar'), hero = $('.hv-hero'), contact = $('#aloqa');
  var onScroll = function () {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 40);
    if (bar) {
      var c = contact.getBoundingClientRect();
      bar.classList.toggle('is-on', y > hero.offsetHeight * 0.8 && c.top > window.innerHeight * 0.6);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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

  /* steam */
  var cv = $('[data-steam]');
  if (cv && !reduce) {
    var ctx = cv.getContext('2d'), W, H, dpr = Math.min(window.devicePixelRatio || 1, 1.5), puffs = [], run = true;
    var sprite = document.createElement('canvas'); sprite.width = sprite.height = 128;
    var sg = sprite.getContext('2d'), g = sg.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,248,238,.22)'); g.addColorStop(.5, 'rgba(255,248,238,.08)'); g.addColorStop(1, 'rgba(255,248,238,0)');
    sg.fillStyle = g; sg.fillRect(0, 0, 128, 128);
    var size = function () { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    var spawn = function (p, init) {
      p.x = Math.random() * W; p.y = init ? Math.random() * H : H + 120;
      p.r = 120 + Math.random() * 220; p.vy = .15 + Math.random() * .35; p.vx = (Math.random() - .5) * .25;
      p.a = 0; p.life = 0; p.max = 900 + Math.random() * 900; p.ph = Math.random() * 6.28;
      return p;
    };
    size();
    for (var i = 0; i < 26; i++) puffs.push(spawn({}, true));
    window.addEventListener('resize', size);
    new IntersectionObserver(function (e) { run = e[0].isIntersecting; if (run) requestAnimationFrame(tick); }).observe(hero);
    var tick = function () {
      if (!run) return;
      ctx.clearRect(0, 0, W, H);
      puffs.forEach(function (p) {
        p.life++; p.y -= p.vy; p.x += p.vx + Math.sin(p.life / 160 + p.ph) * .25;
        var k = p.life / p.max, a = Math.min(1, k * 4) * (1 - k);
        ctx.globalAlpha = a; ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        if (p.life > p.max || p.y < -p.r) spawn(p, false);
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* parallax band */
  var par = $('[data-parallax]');
  if (par && !reduce) {
    var pt = function () {
      var r = par.parentElement.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom > 0 && r.top < vh) par.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * -0.12).toFixed(1) + 'px,0)';
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(pt); }, { passive: true });
    pt();
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
    var show = function (key) {
      var d = window.HV_BP[key];
      tabs.forEach(function (t) { var on = t.dataset.tab === key; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', String(on)); });
      code.textContent = d.code; name.textContent = d.name;
      draw.innerHTML = d.svg;
      draw.classList.remove('is-swap'); void draw.offsetWidth; draw.classList.add('is-swap');
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
    tabs.forEach(function (t) { t.addEventListener('click', function () { stop(); show(t.dataset.tab); }); });
    show('filtr');
    if (!reduce) {
      new IntersectionObserver(function (e, o) {
        if (!e[0].isIntersecting) return;
        o.disconnect();
        var total = function () { return $$('li', notes).length; };
        auto = setInterval(function () { hot(cur >= total() ? 1 : cur + 1); }, 2600);
        hot(1);
      }, { threshold: .4 }).observe(draw);
    }
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
})();
