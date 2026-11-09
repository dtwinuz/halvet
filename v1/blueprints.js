(function () {
  var T = function (x, y, t, cls, a) {
    return '<text class="' + (cls || 'bp-t') + '" x="' + x + '" y="' + y + '"' + (a ? ' text-anchor="' + a + '"' : '') + '>' + t + '</text>';
  };
  var B = function (x, y, w, h, t, s) {
    var cx = x + w / 2, cy = y + h / 2;
    return '<rect class="bp-fill" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3"/>' +
      T(cx, s ? cy - 2 : cy + 4, t, 'bp-t', 'middle') + (s ? T(cx, cy + 12, s, 'bp-ts', 'middle') : '');
  };
  var L = function (d, cls) { return '<path class="' + (cls || 'bp-l') + '" d="' + d + '"/>'; };
  var F = function (d, c) { return L(d, 'bp-thin') + '<path class="bp-flow bp-' + c + '" d="' + d + '"/>'; };
  var C = function (n, x, y) {
    return '<g class="bp-c" data-n="' + n + '" transform="translate(' + x + ' ' + y + ')"><circle r="11"/><text>' + n + '</text></g>';
  };
  var LG = function (items) {
    var x = 790, out = '';
    for (var i = items.length - 1; i >= 0; i--) {
      var w = items[i][1].length * 7.6 + 40;
      x -= w;
      out += '<path class="bp-flow bp-' + items[i][0] + '" d="M' + x + ' 466 h22"/>' + T(x + 28, 470, items[i][1], 'bp-ts');
    }
    return out;
  };
  var svg = function (name, body) {
    return '<svg viewBox="0 0 800 480" role="img" aria-label="' + name + '">' + body + '</svg>';
  };

  var filtr = svg('Nasos va filtratsiya sxemasi',
    L('M14 120 H30 V335 H330 V120 H350', 'bp-l') +
    '<rect class="bp-water" x="31" y="142" width="298" height="192"/>' +
    L('M31 142 q12 -5 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t10 0', 'bp-thin') +
    T(180, 250, 'BASSEYN', 'bp-ts', 'middle') +
    '<rect class="bp-fill" x="318" y="140" width="20" height="22"/>' +
    '<rect class="bp-fill" x="165" y="330" width="30" height="8"/>' +
    '<rect class="bp-fill" x="24" y="222" width="10" height="16"/>' +
    '<circle class="bp-fill" cx="36" cy="290" r="7"/>' + L('M46 284 l12 -6 M47 290 h14 M46 296 l12 6', 'bp-thin') +
    F('M338 150 H372 V395 H400', 'cold') +
    F('M180 338 V395 H372', 'cold') +
    B(400, 370, 62, 50, 'Nasos', 'prefiltr') +
    F('M462 395 H486 V268 H506', 'cold') +
    '<path class="bp-fill" d="M506 420 V270 a32 26 0 0 1 64 0 V420 Z"/>' + L('M512 360 H564', 'bp-thin bp-dash') +
    T(538, 330, 'Qum', 'bp-t', 'middle') + T(538, 344, 'filtri', 'bp-t', 'middle') +
    F('M570 400 H612', 'cold') +
    B(612, 372, 96, 46, 'Issiqlik', 'almashtirgich') +
    F('M650 330 V372', 'hot') + F('M676 372 V330', 'cold') + T(663, 322, 'qozondan', 'bp-ts', 'middle') +
    B(612, 232, 96, 46, 'Dozalash', 'pH · xlor') +
    F('M708 255 H760', 'el') +
    F('M708 395 H760 V80 H18 V230 H26', 'hot') +
    F('M538 420 V452 H420', 'waste') + T(414, 456, 'yuvish suvi kanalizatsiyaga', 'bp-ts', 'end') +
    C(1, 352, 175) + C(2, 212, 352) + C(3, 431, 352) + C(4, 538, 238) + C(5, 660, 440) + C(6, 660, 212) + C(7, 52, 214) + C(8, 72, 312) +
    LG([['cold', 'filtrga'], ['hot', 'qaytish'], ['el', 'dozalash'], ['waste', 'drenaj']])
  );

  var isitish = svg('Isitish tizimi sxemasi',
    B(40, 180, 100, 120, 'Qozon yoki', 'issiqlik nasosi') +
    L('M220 110 H520', 'bp-l') + L('M220 136 H470', 'bp-l') + T(226, 102, 'KOLLEKTOR', 'bp-ts') +
    F('M140 205 H180 V110 H220', 'hot') +
    F('M220 136 H196 V275 H140', 'cold') +
    '<rect class="bp-fill" x="240" y="300" width="220" height="32" rx="2"/>' + T(350, 320, 'Göbek taşı — marmar supa', 'bp-t', 'middle') +
    F('M260 110 V352 H300 V402 H340 V352 H380 V402 H420 V352 H446 V136', 'hot') +
    T(350, 422, 'issiq pol konturlari', 'bp-ts', 'middle') +
    F('M500 110 V180', 'hot') +
    B(472, 180, 96, 60, 'Issiqlik', 'almashtirgich') +
    F('M520 240 V262 H470 V136', 'cold') +
    F('M568 198 H606', 'cold') + F('M606 222 H568', 'hot') + T(612, 214, 'basseyn konturi', 'bp-ts') +
    F('M520 110 H690 V148', 'hot') +
    '<rect class="bp-fill" x="650" y="148" width="80" height="150" rx="34"/>' +
    L('M668 180 q22 10 44 0 M668 200 q22 10 44 0 M668 220 q22 10 44 0 M668 240 q22 10 44 0', 'bp-thin') +
    T(690, 272, 'Boyler', 'bp-t', 'middle') +
    F('M670 298 V444 H170 V275 H140', 'cold') +
    F('M730 166 H786', 'hot') + T(786, 158, 'kurnaga', 'bp-ts', 'end') +
    '<circle class="bp-fill" cx="90" cy="400" r="16"/>' + T(90, 404, 't°', 'bp-t', 'middle') + L('M90 384 V300', 'bp-thin bp-dash') +
    C(1, 90, 160) + C(2, 360, 88) + C(3, 236, 380) + C(4, 350, 284) + C(5, 520, 160) + C(6, 690, 124) + C(7, 124, 410) +
    LG([['hot', 'issiq oqim'], ['cold', 'qaytish']])
  );

  var loads = [
    [200, 'Nasos', 'filtratsiya'], [300, 'Sauna pechi', '3 faza'], [400, 'Bug‘ generatori', 'hammom'],
    [500, 'LED yoritish', '12 V'], [600, 'Ventilyatsiya', 'so‘rish'], [700, 'Boshqaruv', 'datchiklar']
  ];
  var el = '';
  loads.forEach(function (l, i) {
    var x = l[0] + 40;
    el += F('M' + x + ' 170 V196', 'el') +
      L('M' + (x - 6) + ' 196 L' + (x + 6) + ' 212', 'bp-l') + L('M' + x + ' 212 V232', 'bp-l') +
      '<rect class="bp-fill" x="' + (x - 26) + '" y="232" width="52" height="26" rx="2"/>' + T(x, 249, 'RCD', 'bp-ts', 'middle') +
      F('M' + x + ' 258 V' + (i === 3 ? 278 : 300), 'el') +
      (i === 3 ? '<circle class="bp-fill" cx="' + (x - 6) + '" cy="289" r="10"/><circle class="bp-fill" cx="' + (x + 6) + '" cy="289" r="10"/>' + L('M' + x + ' 300 V300') : '') +
      B(l[0] - 5, 300, 90, 56, l[1], l[2]) +
      L('M' + x + ' 356 V420', 'bp-thin bp-dash');
  });
  var elektr = svg('Elektr ta‘minoti bir chiziqli sxemasi',
    '<rect class="bp-thin bp-dash" x="182" y="34" width="604" height="244" rx="4"/>' + T(778, 52, 'ELEKTR SHITI', 'bp-ts', 'end') +
    F('M14 85 H60', 'el') + T(14, 74, '380 V', 'bp-ts') +
    B(60, 60, 80, 50, 'Hisoblagich') +
    F('M140 85 H200', 'el') +
    B(200, 60, 100, 50, 'Asosiy avtomat') +
    F('M250 110 V170', 'el') +
    '<path d="M220 170 H760" stroke="rgba(241,211,107,.9)" stroke-width="4" fill="none"/>' + T(764, 174, 'shina', 'bp-ts') +
    el +
    L('M220 420 H760', 'bp-l') + L('M196 420 H220 M200 430 h16 M204 438 h8', 'bp-l') + T(490, 440, 'potensiallarni tenglash shinasi', 'bp-ts', 'middle') +
    C(1, 100, 42) + C(2, 314, 66) + C(3, 198, 245) + C(4, 198, 300) + C(5, 314, 380) + C(6, 414, 380) + C(7, 576, 284) + C(8, 614, 380) + C(9, 760, 400) +
    LG([['el', 'kuch liniyasi']])
  );

  var santexnika = svg('Santexnika va drenaj sxemasi',
    F('M14 100 H60', 'cold') + T(14, 88, 'KIRISH', 'bp-ts') +
    B(60, 80, 64, 40, 'Filtr') +
    F('M124 100 H142', 'cold') +
    B(142, 80, 84, 40, 'Hisoblagich') +
    F('M226 100 H770', 'cold') +
    F('M272 100 V150', 'cold') +
    '<rect class="bp-fill" x="238" y="150" width="70" height="110" rx="30"/>' + T(273, 202, 'Suv', 'bp-t', 'middle') + T(273, 216, 'isitgich', 'bp-t', 'middle') +
    F('M308 168 H340 V70 H770', 'hot') +
    [420, 560].map(function (x) {
      return F('M' + (x - 8) + ' 70 V184', 'hot') + F('M' + (x + 8) + ' 100 V184', 'cold') +
        '<rect class="bp-fill" x="' + (x - 14) + '" y="184" width="28" height="14" rx="3"/>' +
        L('M' + (x + 12) + ' 198 v6', 'bp-l') +
        '<path class="bp-fill" d="M' + (x - 34) + ' 212 h68 v6 a34 30 0 0 1 -68 0 Z"/>' + T(x, 268, 'Kurna', 'bp-ts', 'middle');
    }).join('') +
    F('M692 70 V150', 'hot') + F('M708 100 V150', 'cold') +
    '<rect class="bp-fill" x="686" y="150" width="28" height="14" rx="3"/>' + L('M700 164 V180 H730', 'bp-l') +
    '<path class="bp-fill" d="M722 176 h22 l-4 8 h-14 Z"/>' + L('M726 190 l-4 16 M733 190 v18 M740 190 l4 16', 'bp-thin bp-dash') + T(733, 226, 'Dush', 'bp-ts', 'middle') +
    L('M350 296 L726 316', 'bp-l') + L('M350 304 L726 324', 'bp-thin') + T(540, 296, 'pol qiyaligi 1,5–2 %', 'bp-ts', 'middle') +
    '<rect class="bp-fill" x="726" y="312" width="28" height="16" rx="2"/>' + L('M730 316 h20 M730 320 h20 M730 324 h20', 'bp-thin') +
    F('M740 328 V420 H20', 'waste') +
    B(398, 404, 70, 32, 'Teskari', 'klapan') +
    T(20, 412, 'KANALIZATSIYA', 'bp-ts') +
    C(1, 92, 62) + C(2, 184, 62) + C(3, 324, 248) + C(4, 610, 52) + C(5, 452, 188) + C(6, 762, 176) + C(7, 600, 330) + C(8, 772, 320) + C(9, 433, 456) +
    LG([['cold', 'sovuq'], ['hot', 'issiq'], ['waste', 'oqova']])
  );

  var bug = svg('Bug‘ va ventilyatsiya sxemasi',
    L('M160 400 V222 M560 400 V222 M140 400 H580', 'bp-l') +
    L('M160 222 A200 132 0 0 1 560 222', 'bp-l') + L('M174 222 A186 120 0 0 1 546 222', 'bp-thin') +
    [[300, 150], [360, 128], [420, 150], [330, 180], [390, 180]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="rgba(241,211,107,.8)"/>'; }).join('') +
    '<rect class="bp-fill" x="280" y="368" width="160" height="32" rx="2"/>' + T(360, 389, 'Göbek taşı', 'bp-t', 'middle') +
    L('M220 330 q20 -16 40 0 t40 0 M300 290 q20 -16 40 0 t40 0 t40 0 M250 250 q20 -16 40 0 t40 0 t40 0 t40 0', 'bp-thin bp-dash') +
    T(360, 230, 'HAMMOM', 'bp-ts', 'middle') +
    B(40, 300, 90, 70, 'Bug‘', 'generatori') +
    F('M130 335 H160 V360 H182', 'air') +
    '<path class="bp-fill" d="M182 352 h12 l6 8 l-6 8 h-12 Z"/>' +
    F('M85 370 V440 H20', 'waste') + T(26, 456, 'kondensat', 'bp-ts') +
    F('M360 400 V440 H140', 'waste') +
    F('M360 92 V50 H574', 'air') +
    '<circle class="bp-fill" cx="590" cy="50" r="16"/>' + L('M580 44 L600 56 M580 56 L600 44', 'bp-thin') +
    F('M606 50 H680', 'air') +
    '<rect class="bp-fill" x="680" y="20" width="70" height="70" rx="3"/>' + L('M680 20 L750 90 M750 20 L680 90', 'bp-thin') +
    F('M750 40 H792', 'air') + T(792, 14, 'chiqish', 'bp-ts', 'end') +
    F('M792 76 H750', 'cold') + T(790, 100, 'toza havo', 'bp-ts', 'end') +
    F('M715 90 V370 H560', 'cold') +
    '<rect class="bp-fill" x="556" y="362" width="8" height="18"/>' +
    B(600, 400, 180, 44, 'Basseyn zali', 'namlik quritgich') +
    C(1, 85, 284) + C(2, 210, 340) + C(3, 60, 424) + C(4, 586, 352) + C(5, 380, 72) + C(6, 590, 82) + C(7, 770, 120) + C(8, 690, 386) +
    LG([['air', 'bug‘ / chiqish'], ['cold', 'toza havo'], ['waste', 'drenaj']])
  );

  var kimyo = svg('Suv kimyosi va dozalash sxemasi',
    F('M14 330 H786', 'cold') + T(14, 318, 'FILTRDAN', 'bp-ts') + T(786, 318, 'BASSEYNGA', 'bp-ts', 'end') +
    B(150, 306, 110, 48, 'Issiqlik', 'almashtirgich') +
    '<rect class="bp-fill" x="320" y="318" width="150" height="24" rx="12"/>' + L('M334 330 H456', 'bp-thin bp-dash') + T(395, 300, 'UV lampa', 'bp-t', 'middle') +
    F('M90 330 V170 H140', 'cold') + T(96, 250, 'namuna', 'bp-ts') +
    B(140, 130, 150, 80, 'O‘lchov kamerasi', 'pH · Rx · T') +
    F('M290 170 H360', 'el') +
    B(360, 130, 130, 80, 'Dozalash', 'kontrolleri') +
    F('M490 150 H560', 'el') + F('M490 190 H560 V230 H660', 'el') +
    B(540, 60, 80, 70, 'pH−', 'kanistra') + B(660, 60, 80, 70, 'Xlor', 'kanistra') +
    B(560, 140, 60, 40, 'Nasos 1') + B(660, 210, 60, 40, 'Nasos 2') +
    L('M580 130 V140 M700 130 V210', 'bp-thin') +
    F('M590 180 V330', 'hot') + F('M690 250 V330', 'hot') +
    '<circle class="bp-fill" cx="590" cy="330" r="7"/><circle class="bp-fill" cx="690" cy="330" r="7"/>' + T(640, 360, 'in‘eksiya nuqtalari', 'bp-ts', 'middle') +
    C(1, 214, 120) + C(2, 425, 120) + C(3, 580, 50) + C(4, 700, 50) + C(5, 610, 200) + C(6, 395, 360) + C(7, 205, 370) + C(8, 590, 395) +
    LG([['cold', 'suv'], ['el', 'signal'], ['hot', 'dozalash']])
  );

  var sensorsL = [['pH datchigi', 70], ['Xlor (Rx)', 130], ['Suv harorati', 190], ['Suv sathi', 250], ['Hammom namligi', 310], ['Filtr bosimi', 370]];
  var actsR = [['Nasos (VFD)', 70], ['Dozalash', 130], ['Isitish klapani', 190], ['Bug‘ generatori', 250], ['Ventilyator', 310], ['Yoritish', 370]];
  var avto = svg('Avtomatika sxemasi',
    sensorsL.map(function (s, i) { return B(24, s[1] - 20, 130, 40, s[0]) + F('M154 ' + s[1] + ' H230 V' + (190 + i * 14) + ' H330', 'cold'); }).join('') +
    B(330, 170, 140, 120, 'Kontroller', 'PLC · taymerlar') +
    actsR.map(function (s, i) { return F('M470 ' + (190 + i * 14) + ' H560 V' + s[1] + ' H640', 'el') + B(640, s[1] - 20, 140, 40, s[0]); }).join('') +
    B(330, 40, 140, 54, 'Sensorli panel', 'masofadan kuzatish') + F('M400 94 V170', 'air') +
    B(330, 370, 140, 50, 'Avariya', 'signal · SMS') + F('M400 290 V370', 'hot') +
    C(1, 18, 50) + C(2, 18, 170) + C(3, 18, 350) + C(4, 400, 160) + C(5, 786, 50) + C(6, 786, 170) + C(7, 786, 290) + C(8, 476, 40) + C(9, 476, 370) +
    LG([['cold', 'datchik'], ['el', 'boshqaruv'], ['air', 'aloqa']])
  );

  window.HV_BP = {
    filtr: {
      code: 'HV-01', name: 'Nasos va filtratsiya', svg: filtr,
      notes: [
        { t: 'Skimmer', d: 'Sirtdagi barg, chang va yog‘ni yig‘adi.' },
        { t: 'Tub drenaji', d: 'Pastdagi suvni so‘radi, kosa bo‘ylab aylanma oqim beradi.' },
        { t: 'Nasos va prefiltr', d: 'Suvni tizim bo‘ylab haydaydi; prefiltr yirik chiqindini ushlaydi.' },
        { t: 'Qum filtri', d: 'Mayda zarrachalarni tutadi; vaqti-vaqti bilan teskari yuviladi.' },
        { t: 'Issiqlik almashtirgich', d: 'Qozon issig‘ini suvga beradi, suvni yil bo‘yi 26–28 °C da ushlaydi.' },
        { t: 'Dozalash', d: 'pH va xlor darajasini datchik bo‘yicha avtomatik tutadi.' },
        { t: 'Qaytish forsunkalari', d: 'Toza, iliq suvni kosaga bir tekis qaytaradi.' },
        { t: 'Suv osti yoritish', d: 'LED chiroqlar xavfsiz past kuchlanishda ishlaydi.' }
      ]
    },
    isitish: {
      code: 'HV-02', name: 'Isitish tizimi', svg: isitish,
      notes: [
        { t: 'Qozon yoki issiqlik nasosi', d: 'Butun majmua uchun yagona issiqlik manbai.' },
        { t: 'Kollektor', d: 'Issiqlikni konturlar bo‘yicha taqsimlaydi, har biri alohida sozlanadi.' },
        { t: 'Issiq pol', d: 'Hammom va dush zonasida pol yalang oyoqqa iliq.' },
        { t: 'Göbek taşı isitish', d: 'Markaziy marmar supa ostida alohida kontur.' },
        { t: 'Basseyn almashtirgichi', d: 'Basseyn suvi qozon suvi bilan aralashmaydi.' },
        { t: 'Boyler', d: 'Kurna va dushlar uchun issiq suv zaxirasi.' },
        { t: 'Termostat va datchiklar', d: 'Har bir zona harorati alohida nazorat qilinadi.' }
      ]
    },
    elektr: {
      code: 'HV-03', name: 'Elektrika', svg: elektr,
      notes: [
        { t: 'Kirish va hisoblagich', d: 'Uch fazali kirish, alohida hisob.' },
        { t: 'Asosiy avtomat va shit', d: 'Barcha liniyalar bitta shitda, quruq texnik xonada.' },
        { t: 'RCD 30 mA', d: 'Har bir nam zona liniyasida differensial himoya.' },
        { t: 'Nasos liniyasi', d: 'Alohida avtomat, taymer orqali boshqariladi.' },
        { t: 'Sauna pechi', d: 'Uch fazali alohida liniya, issiqqa chidamli kabel.' },
        { t: 'Bug‘ generatori', d: 'Hammom uchun alohida himoyalangan liniya.' },
        { t: 'LED 12 V', d: 'Transformator orqali xavfsiz past kuchlanish: suv ostida va nam zonada.' },
        { t: 'Ventilyatsiya va boshqaruv', d: 'Ventilyator, taymer va datchiklar bitta paneldan.' },
        { t: 'Potensiallarni tenglash', d: 'Kosa armaturasi, quvurlar va metall qismlar bitta yerga ulanadi.' }
      ]
    },
    santexnika: {
      code: 'HV-04', name: 'Santexnika va drenaj', svg: santexnika,
      notes: [
        { t: 'Kirish filtri', d: 'Shahar suvi yoki quduqdan kelgan suv tozalanadi.' },
        { t: 'Hisoblagich', d: 'Majmua suv sarfi alohida hisoblanadi.' },
        { t: 'Suv isitgich', d: 'Kurna va dushlar uchun issiq suv.' },
        { t: 'Sovuq va issiq liniyalar', d: 'Yashirin, izolyatsiyalangan quvurlar; har bir nuqtaga alohida.' },
        { t: 'Aralashtirgich va kurnalar', d: 'Mis yoki latun jo‘mrak, marmar kurna.' },
        { t: 'Dush', d: 'Hammomdan keyingi sovuq-iliq yuvinish nuqtasi.' },
        { t: 'Pol qiyaligi', d: 'Suv to‘xtab qolmaydi: pol trapga 1,5–2 % qiya.' },
        { t: 'Trap', d: 'Suv va hid to‘sig‘i bilan pol drenaji.' },
        { t: 'Teskari klapan', d: 'Kanalizatsiya suvi orqaga qaytmaydi.' }
      ]
    },
    bug: {
      code: 'HV-05', name: 'Bug‘ va ventilyatsiya', svg: bug,
      notes: [
        { t: 'Bug‘ generatori', d: 'Hammom tashqarisida, texnik xonada; ovozi eshitilmaydi.' },
        { t: 'Bug‘ forsunkasi', d: 'Pastda, odam o‘tirmaydigan joyda, bug‘ bir tekis tarqaladi.' },
        { t: 'Kondensat drenaji', d: 'Generator va pol suvi kanalizatsiyaga ketadi.' },
        { t: 'Toza havo — pastdan', d: 'Yangi havo pol sathidan kiradi.' },
        { t: 'Chiqish — yuqoridan', d: 'Nam havo gumbaz tepasidan so‘riladi; devorda mog‘or bo‘lmaydi.' },
        { t: 'Ventilyator', d: 'Namlikka chidamli, taymer va datchik bilan.' },
        { t: 'Rekuperator', d: 'Chiqayotgan havo issig‘i kirayotgan havoga beriladi.' },
        { t: 'Basseyn zali quritgichi', d: 'Zal havosidagi namlikni tortib oladi, oyna terlamaydi.' }
      ]
    },
    kimyo: {
      code: 'HV-06', name: 'Suv kimyosi', svg: kimyo,
      notes: [
        { t: 'O‘lchov kamerasi', d: 'pH va Rx (ORP) datchiklari suvni uzluksiz o‘lchaydi.' },
        { t: 'Dozalash kontrolleri', d: 'Me‘yordan chiqsa o‘zi to‘g‘rilaydi, qo‘lda quyish yo‘q.' },
        { t: 'pH− kanistrasi', d: 'pH 7,2–7,6 oralig‘ida: ko‘z achishmaydi, xlor samarali ishlaydi.' },
        { t: 'Xlor kanistrasi', d: 'Erkin xlor odatda 1–3 mg/l diapazonda; aniq qiymat loyiha va mahalliy me’yorga bog‘liq.' },
        { t: 'Peristaltik nasos 1', d: 'Mikro dozalar, aniq va jim.' },
        { t: 'UV lampa', d: 'Mikroblarni zararsizlantiradi, xlor sarfini kamaytiradi.' },
        { t: 'Issiqlik almashtirgich', d: 'Kimyo isitgichdan keyin qo‘shiladi — metall himoyalanadi.' },
        { t: 'In‘eksiya nuqtalari', d: 'Qaytish liniyasida, basseynga kirishdan oldin.' }
      ]
    },
    avto: {
      code: 'HV-07', name: 'Avtomatika', svg: avto,
      notes: [
        { t: 'pH va xlor datchiklari', d: 'Suv sifati uzluksiz nazoratda.' },
        { t: 'Harorat va sath', d: 'Suv sovisa isitish, kamaysa to‘ldirish yoqiladi.' },
        { t: 'Namlik va bosim', d: 'Hammom namligi va filtr ifloslanishi kuzatiladi.' },
        { t: 'Kontroller', d: 'Barcha signallar bitta joyda; taymer va ssenariylar.' },
        { t: 'Nasos chastotasi', d: 'Kechasi sekin, kunduzi to‘liq — elektr tejaladi.' },
        { t: 'Isitish va bug‘', d: 'Kelishingizdan oldin hammom tayyor bo‘ladi.' },
        { t: 'Ventilyator va yoritish', d: 'Ssenariy bo‘yicha: “hammom”, “basseyn”, “tun”.' },
        { t: 'Sensorli panel', d: 'Uydan yoki telefondan holatni ko‘rish imkoniyati.' },
        { t: 'Avariya signali', d: 'Suv sathi, bosim yoki harorat xato bo‘lsa xabar beradi.' }
      ]
    }
  };
})();
