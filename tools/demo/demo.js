/* Faqat demo (tools/demo-build.mjs): ariza formasi pochta ilovasini ochmaydi, yuboriladigan xatni ko'rsatadi. */
(function () {
  var T = {
    uz: { h: 'Ariza tayyor', p: 'Haqiqiy saytda bu xat pochta ilovasida ochiladi. Demo hech narsa yubormaydi.', to: 'Kimga', sub: 'Mavzu', ok: 'Yopish' },
    ru: { h: 'Заявка готова', p: 'На настоящем сайте это письмо откроется в почтовом приложении. Демо ничего не отправляет.', to: 'Кому', sub: 'Тема', ok: 'Закрыть' },
    en: { h: 'Request ready', p: 'On the live site this letter opens in your mail app. The demo sends nothing.', to: 'To', sub: 'Subject', ok: 'Close' },
  };
  var t = T[document.documentElement.lang] || T.uz;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  window.__hvDemoMail = function (href) {
    var m = /^mailto:([^?]+)\?subject=([^&]*)&body=(.*)$/.exec(href) || [];
    var box = document.createElement('div');
    box.className = 'hv-demo-mail';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<div class="hv-demo-mail__card"><h3>' + t.h + '</h3><p>' + t.p + '</p><dl><dt>' + t.to + '</dt><dd>' + esc(m[1] || '') +
      '</dd><dt>' + t.sub + '</dt><dd>' + esc(decodeURIComponent(m[2] || '')) + '</dd></dl><pre>' + esc(decodeURIComponent(m[3] || '')) +
      '</pre><button type="button">' + t.ok + '</button></div>';
    var close = function () { box.remove(); document.removeEventListener('keydown', onKey); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    box.addEventListener('click', function (e) { if (e.target === box || e.target.tagName === 'BUTTON') close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(box);
    box.querySelector('button').focus();
  };
})();
