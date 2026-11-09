/* Hero bug'i: GPU'da haqiqiy suyuqlik simulyatsiyasi (stable fluids: advection, girdob saqlash, bosim proyeksiyasi).
   Bug' kurnalar va göbek taşı ustidan ko'tariladi (issiqlik ko'tarish kuchi), sichqoncha/barmoq havoni suradi va
   girdob qiladi, bosganda nafas puflanadi. Rasmning o'zi ham shu kanvasda chiziladi: bug' qalin joyda issiq havo
   rasmni sindiradi (heat haze), bug' esa sahnadagi yorug'likni (gumbaz nurlari) o'zida tarqatadi.
   Kanvas .hv-hero__media ichida <img> ustida turadi — CSS zoom/scroll masshtabi ikkalasiga bir xil ta'sir qiladi.
   Half-float render target bo'lmasa false qaytaradi (app.js eski fog.js'ga o'tadi). */
(function () {
  'use strict';

  // rasm koordinatalari (0..1, yuqoridan): kurnalar va markaziy supa — bug' manbalari
  var SOURCES = [
    { x: .098, y: .640, r: .030, k: .85 }, { x: .262, y: .608, r: .026, k: .8 }, { x: .500, y: .600, r: .030, k: 1 },
    { x: .739, y: .608, r: .026, k: .8 }, { x: .903, y: .640, r: .030, k: .85 },
    { x: .30, y: .745, r: .05, k: .55, w: 1 }, { x: .42, y: .735, r: .05, k: .6, w: 1 }, { x: .58, y: .735, r: .05, k: .6, w: 1 }, { x: .70, y: .745, r: .05, k: .55, w: 1 }
  ];

  var VS = 'precision highp float;attribute vec2 aP;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform vec2 uTx;' +
    'void main(){vUv=aP*.5+.5;vL=vUv-vec2(uTx.x,0.);vR=vUv+vec2(uTx.x,0.);vT=vUv+vec2(0.,uTx.y);vB=vUv-vec2(0.,uTx.y);gl_Position=vec4(aP,0.,1.);}';
  var HEAD = 'precision highp float;precision highp sampler2D;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;';
  var NOISE = 'float h1(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}' +
    'float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}' +
    'float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.8,.6,-.6,.8);for(int i=0;i<5;i++){v+=a*n2(p);p=r*p*2.03+vec2(1.7,9.2);a*=.5;}return v;}';
  var FS = {
    splat: HEAD + 'uniform sampler2D uT;uniform float uAsp;uniform vec3 uC;uniform vec2 uPt;uniform float uR;' +
      'void main(){vec2 p=vUv-uPt;p.x*=uAsp;vec3 s=exp(-dot(p,p)/uR)*uC;gl_FragColor=vec4(texture2D(uT,vUv).xyz+s,1.);}',
    advect: HEAD + 'uniform sampler2D uV;uniform sampler2D uS;uniform vec2 uTx;uniform float uDt;uniform float uDis;' +
      'void main(){vec2 c=vUv-uDt*texture2D(uV,vUv).xy*uTx;gl_FragColor=texture2D(uS,c)/(1.+uDis*uDt);}',
    // issiq bug' ko'tariladi + yengil "nafas" shamoli
    force: HEAD + NOISE + 'uniform sampler2D uV;uniform sampler2D uD;uniform float uDt;uniform float uT;uniform float uLift;' +
      'void main(){vec2 v=texture2D(uV,vUv).xy;float d=texture2D(uD,vUv).x;' +
      'float w=n2(vec2(vUv.y*3.,uT*.07))-.5;v+=uDt*vec2(w*2.5,d*uLift);gl_FragColor=vec4(v,0.,1.);}',
    curl: HEAD + 'uniform sampler2D uV;void main(){float L=texture2D(uV,vL).y,R=texture2D(uV,vR).y,T=texture2D(uV,vT).x,B=texture2D(uV,vB).x;gl_FragColor=vec4(.5*(R-L-T+B),0.,0.,1.);}',
    vort: HEAD + 'uniform sampler2D uV;uniform sampler2D uC;uniform float uCurl;uniform float uDt;' +
      'void main(){float L=texture2D(uC,vL).x,R=texture2D(uC,vR).x,T=texture2D(uC,vT).x,B=texture2D(uC,vB).x,C=texture2D(uC,vUv).x;' +
      'vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));f/=length(f)+1e-4;f*=uCurl*C;f.y*=-1.;' +
      'vec2 v=texture2D(uV,vUv).xy+f*uDt;gl_FragColor=vec4(clamp(v,-1000.,1000.),0.,1.);}',
    div: HEAD + 'uniform sampler2D uV;void main(){float L=texture2D(uV,vL).x,R=texture2D(uV,vR).x,T=texture2D(uV,vT).y,B=texture2D(uV,vB).y;vec2 C=texture2D(uV,vUv).xy;' +
      'if(vL.x<0.)L=-C.x;if(vR.x>1.)R=-C.x;if(vT.y>1.)T=-C.y;if(vB.y<0.)B=-C.y;gl_FragColor=vec4(.5*(R-L+T-B),0.,0.,1.);}',
    clear: HEAD + 'uniform sampler2D uT;uniform float uK;void main(){gl_FragColor=uK*texture2D(uT,vUv);}',
    press: HEAD + 'uniform sampler2D uP;uniform sampler2D uDv;void main(){float L=texture2D(uP,vL).x,R=texture2D(uP,vR).x,T=texture2D(uP,vT).x,B=texture2D(uP,vB).x;' +
      'gl_FragColor=vec4((L+R+B+T-texture2D(uDv,vUv).x)*.25,0.,0.,1.);}',
    grad: HEAD + 'uniform sampler2D uP;uniform sampler2D uV;void main(){float L=texture2D(uP,vL).x,R=texture2D(uP,vR).x,T=texture2D(uP,vT).x,B=texture2D(uP,vB).x;' +
      'gl_FragColor=vec4(texture2D(uV,vUv).xy-vec2(R-L,T-B),0.,1.);}',
    // yakuniy kadr: rasm (cover) + issiq havo sinishi + yoritilgan bug'
    show: HEAD + NOISE + 'uniform sampler2D uImg;uniform sampler2D uLit;uniform sampler2D uD;uniform vec2 uCov;uniform vec2 uOff;uniform float uT;uniform float uAsp;uniform float uHaze;uniform vec2 uDx;' +
      'vec2 cov(vec2 u){return (u-.5)*uCov+.5+uOff;}' +
      'void main(){vec2 u=vUv;float d=texture2D(uD,u).x;' +
      'float dx=texture2D(uD,u+vec2(uDx.x,0.)).x-texture2D(uD,u-vec2(uDx.x,0.)).x;float dy=texture2D(uD,u+vec2(0.,uDx.y)).x-texture2D(uD,u-vec2(0.,uDx.y)).x;' +
      'vec2 q=vec2(u.x*uAsp,u.y);' +
      'float sh=n2(q*38.+vec2(0.,-uT*2.6))-.5;' + // issiq havo titrashi
      'vec2 iu=cov(u)+vec2(dx,dy)*.004+vec2(sh,sh*.6)*.0018*smoothstep(.02,.4,d);' +
      'vec3 img=texture2D(uImg,vec2(iu.x,1.-iu.y)).rgb;' +
      'vec2 lu=cov(u);vec3 lit=texture2D(uLit,vec2(lu.x,1.-lu.y)).rgb;float L=dot(lit,vec3(.3,.55,.15));' +
      // tolali tuzilish: simulyatsiya zichligi mayda shovqin bilan bo'linadi (silliq dog' emas, bug' iplari)
      'float f1=fbm(q*4.2+vec2(0.,-uT*.05)+vec2(dx,dy)*6.);float f2=fbm(q*11.+vec2(uT*.02,-uT*.11));' +
      'float dd=d*(.45+.85*f1)*(.75+.5*f2);' +
      'float hz=fbm(q*1.6+vec2(uT*.012,-uT*.006))*uHaze*(.35+.65*smoothstep(.15,.9,u.y));' + // xona havosidagi umumiy tuman
      'float a=1.-exp(-(dd*1.35+hz));a=min(a,.9);' +
      'vec3 sc=vec3(.97,.94,.89)*(.56+1.1*pow(L,1.25))*(1.-.18*smoothstep(.6,2.2,dd));' +
      'sc+=vec3(1.,.93,.8)*pow(L,3.)*.35;' + // nur ichida bug' porlaydi
      'vec3 col=mix(img,sc,a);gl_FragColor=vec4(col,1.);}'
  };

  window.HVVapor = function (canvas, host, img, opts) {
    opts = opts || {};
    var attrs = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' };
    var gl2 = canvas.getContext('webgl2', attrs);
    var gl = gl2 || canvas.getContext('webgl', attrs);
    if (!gl) return false;
    var HF, iRG, iR, fmtRG, fmtR;
    if (gl2) {
      if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return false;
      HF = gl.HALF_FLOAT; iRG = gl.RG16F; iR = gl.R16F; fmtRG = gl.RG; fmtR = gl.RED;
    } else {
      var ext = gl.getExtension('OES_texture_half_float');
      if (!ext || !gl.getExtension('OES_texture_half_float_linear')) return false;
      HF = ext.HALF_FLOAT_OES; iRG = iR = fmtRG = fmtR = gl.RGBA;
    }

    // shaderlar fonda kompilyatsiya qilinadi (KHR_parallel_shader_compile): holat keyingi kadrlarda so'raladi,
    // aks holda LINK_STATUS so'rovi asosiy oqimni yuzlab ms to'xtatadi
    var pext = gl.getExtension('KHR_parallel_shader_compile');
    var mk = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    var vs = mk(gl.VERTEX_SHADER, VS), P = {}, progs = [];
    for (var k in FS) {
      var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FS[k]));
      gl.bindAttribLocation(pr, 0, 'aP'); gl.linkProgram(pr); progs.push([k, pr]);
    }
    var linked = function () {
      if (!pext) return true;
      for (var i = 0; i < progs.length; i++) if (!gl.getProgramParameter(progs[i][1], pext.COMPLETION_STATUS_KHR)) return false;
      return true;
    };
    var finish = function () {
      for (var a = 0; a < progs.length; a++) {
        var pr = progs[a][1];
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false;
        var u = {}, n = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS);
        for (var i = 0; i < n; i++) { var nm = gl.getActiveUniform(pr, i).name; u[nm] = gl.getUniformLocation(pr, nm); }
        P[progs[a][0]] = { p: pr, u: u };
      }
      return true;
    };
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);

    var fbo = function (w, h, ifmt, fmt) {
      var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, HF, null);
      var f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      return { t: t, f: f, w: w, h: h, ok: gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE };
    };
    var dbl = function (w, h, ifmt, fmt) {
      var a = fbo(w, h, ifmt, fmt), b = fbo(w, h, ifmt, fmt);
      return { r: a, w: b, ok: a.ok && b.ok, swap: function () { var x = this.r; this.r = this.w; this.w = x; } };
    };

    var small = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
    var SIM = small ? 96 : 128, DYE = small ? 320 : 560, ITER = small ? 12 : 20, DPR = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
    var vel, dye, prs, dv, cu, W = 0, H = 0, asp = 1;
    var drop = function (x) { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); };
    var free = function () { [vel, dye, prs].forEach(function (d) { if (d) { drop(d.r); drop(d.w); } }); [dv, cu].forEach(function (x) { if (x) drop(x); }); vel = dye = prs = dv = cu = null; };
    var res = function (base) { return asp >= 1 ? [Math.round(base * asp), base] : [base, Math.round(base / asp)]; };
    var alloc = function () {
      free();
      var s = res(SIM), d = res(DYE);
      vel = dbl(s[0], s[1], iRG, fmtRG); prs = dbl(s[0], s[1], iR, fmtR);
      dv = fbo(s[0], s[1], iR, fmtR); cu = fbo(s[0], s[1], iR, fmtR);
      dye = dbl(d[0], d[1], iR, fmtR);
      return vel.ok && prs.ok && dv.ok && cu.ok && dye.ok;
    };

    // rasm teksturasi (allaqachon yuklangan <img> dan) + yorug'lik xaritasi (kichik, xira nusxa)
    var imgTex = gl.createTexture(), litTex = gl.createTexture(), iw = 4, ih = 3;
    var upload = function (t, src) {
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    };
    var setImage = function () {
      iw = img.naturalWidth; ih = img.naturalHeight;
      upload(imgTex, img);
      var c = document.createElement('canvas'); c.width = 48; c.height = 36;
      var x = c.getContext('2d'); x.filter = 'blur(2px)'; x.drawImage(img, 0, 0, 48, 36);
      upload(litTex, c);
    };

    var cov = [1, 1];
    var size = function () {
      var w = Math.max(2, Math.round(canvas.clientWidth * DPR)), h = Math.max(2, Math.round(canvas.clientHeight * DPR));
      if (w === W && h === H) return true;
      W = canvas.width = w; H = canvas.height = h; asp = w / h;
      var ia = iw / ih;
      cov = asp > ia ? [1, ia / asp] : [asp / ia, 1];
      return alloc();
    };
    // rasm (yuqoridan) koordinatasi -> simulyatsiya uv (pastdan)
    var srcUv = function (s) { return [(s.x - .5) / cov[0] + .5, ((1 - s.y) - .5) / cov[1] + .5]; };

    var quad = function (target) {
      if (target) { gl.bindFramebuffer(gl.FRAMEBUFFER, target.f); gl.viewport(0, 0, target.w, target.h); }
      else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    var use = function (p, tx) { gl.useProgram(p.p); if (p.u.uTx) gl.uniform2f(p.u.uTx, tx[0], tx[1]); return p.u; };
    var bind = function (u, name, unit, t) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u[name], unit); };

    var splat = function (x, y, dx, dy, dens, r) {
      var u = use(P.splat, [1 / vel.r.w, 1 / vel.r.h]);
      gl.uniform1f(u.uAsp, asp); gl.uniform2f(u.uPt, x, y); gl.uniform1f(u.uR, r / 100);
      if (dx || dy) { bind(u, 'uT', 0, vel.r.t); gl.uniform3f(u.uC, dx, dy, 0); quad(vel.w); vel.swap(); }
      if (dens) { bind(u, 'uT', 0, dye.r.t); gl.uniform3f(u.uC, dens, 0, 0); quad(dye.w); dye.swap(); }
    };

    var thick = 0, T = 0;
    var step = function (dt) {
      var tx = [1 / vel.r.w, 1 / vel.r.h], u;
      // manbalar: bug' uzluksiz chiqadi, kuchi "nafas" kabi o'zgarib turadi
      for (var i = 0; i < SOURCES.length; i++) {
        var s = SOURCES[i], p = srcUv(s), br = .55 + .45 * Math.sin(T * (.7 + i * .13) + i * 1.7);
        var jx = (Math.random() - .5) * s.r * (s.w ? 2.4 : .8);
        var amt = s.k * br * dt * (s.w ? 4.2 : 8.5) * (1 + thick * 1.6);
        splat(p[0] + jx, p[1], (Math.random() - .5) * 14, (s.w ? 8 : 18) * br, amt, s.r * s.r * (s.w ? 90 : 70));
      }
      u = use(P.curl, tx); bind(u, 'uV', 0, vel.r.t); quad(cu);
      u = use(P.vort, tx); bind(u, 'uV', 0, vel.r.t); bind(u, 'uC', 1, cu.t); gl.uniform1f(u.uCurl, 22); gl.uniform1f(u.uDt, dt); quad(vel.w); vel.swap();
      u = use(P.force, tx); bind(u, 'uV', 0, vel.r.t); bind(u, 'uD', 1, dye.r.t); gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uT, T); gl.uniform1f(u.uLift, 26); quad(vel.w); vel.swap();
      u = use(P.div, tx); bind(u, 'uV', 0, vel.r.t); quad(dv);
      u = use(P.clear, tx); bind(u, 'uT', 0, prs.r.t); gl.uniform1f(u.uK, .8); quad(prs.w); prs.swap();
      u = use(P.press, tx); bind(u, 'uDv', 1, dv.t);
      for (var j = 0; j < ITER; j++) { bind(u, 'uP', 0, prs.r.t); quad(prs.w); prs.swap(); }
      u = use(P.grad, tx); bind(u, 'uP', 0, prs.r.t); bind(u, 'uV', 1, vel.r.t); quad(vel.w); vel.swap();
      u = use(P.advect, tx); bind(u, 'uV', 0, vel.r.t); bind(u, 'uS', 1, vel.r.t); gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uDis, .2); quad(vel.w); vel.swap();
      u = use(P.advect, tx); bind(u, 'uV', 0, vel.r.t); bind(u, 'uS', 1, dye.r.t); gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uDis, .26 - thick * .1); quad(dye.w); dye.swap();
    };
    var show = function () {
      var u = use(P.show, [1 / dye.r.w, 1 / dye.r.h]);
      bind(u, 'uImg', 0, imgTex); bind(u, 'uLit', 1, litTex); bind(u, 'uD', 2, dye.r.t);
      gl.uniform2f(u.uCov, cov[0], cov[1]); gl.uniform2f(u.uOff, 0, 0); gl.uniform1f(u.uT, T); gl.uniform1f(u.uAsp, asp);
      gl.uniform1f(u.uHaze, .32 + thick * .5); gl.uniform2f(u.uDx, 1.5 / dye.r.w, 1.5 / dye.r.h);
      quad(null);
    };

    // sichqoncha / barmoq: havoni suradi; bosish = puflash
    var lastP = null, still = !!opts.still, queue = [];
    var toUv = function (e) { var r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]; };
    host.addEventListener('pointermove', function (e) {
      var p = toUv(e);
      if (lastP) { var dx = p[0] - lastP[0], dy = p[1] - lastP[1]; if (dx * dx + dy * dy > 1e-7 && queue.length < 40) queue.push([p[0], p[1], dx * 5200, dy * 5200, 0, e.pointerType === 'mouse' ? .9 : 1.6]); }
      lastP = p;
    }, { passive: true });
    host.addEventListener('pointerleave', function () { lastP = null; });
    host.addEventListener('pointerdown', function (e) {
      var p = toUv(e);
      for (var a = 0; a < 6; a++) { var an = a / 6 * 6.283; queue.push([p[0], p[1], Math.cos(an) * 320, Math.sin(an) * 320 + 120, .5, 1.4]); }
    }, { passive: true });

    var visible = true, looping = false, last = 0, minDt = small ? 30 : 15, dead = false;
    var frame = function (now) {
      var dt = Math.min(1 / 30, last ? (now - last) / 1000 : 1 / 60); last = now; T += dt;
      while (queue.length) { var q = queue.shift(); splat(q[0], q[1], q[2], q[3], q[4], q[5] * .02); }
      step(dt); show();
    };
    var tick = function (now) {
      if (!visible || document.hidden || dead) { looping = false; last = 0; return; }
      requestAnimationFrame(tick);
      if (last && now - last < minDt) return;
      frame(now);
    };
    var go = function () { if (still || !ready) return; if (!looping && visible && !document.hidden && !dead) { looping = true; requestAnimationFrame(tick); } };

    if (!img.complete || !img.naturalWidth) return false;
    var ready = false;
    var fail = function () { if (dead) return; dead = true; free(); canvas.classList.remove('is-on'); if (opts.onLost) opts.onLost(); };
    var later = window.requestIdleCallback ? function (f) { requestIdleCallback(f, { timeout: 400 }); } : function (f) { setTimeout(f, 24); };
    // ishga tushirish bosqichlarga bo'lingan (har biri ~6 ms): sahifa kiritishga javob berib turadi
    var warm = still ? 260 : (small ? 70 : 110), waits = 0;
    var boot = function () {
      if (dead) return;
      if (!P.show) {
        if (!linked() && ++waits < 200) { later(boot); return; }
        if (!finish()) { fail(); return; }
        later(boot); return;
      }
      if (!W) { setImage(); if (!size()) { fail(); return; } later(boot); return; }
      // oldindan isitish: kanvas paydo bo'lganda xona allaqachon bug'ga to'la
      var t0 = performance.now();
      while (warm > 0 && performance.now() - t0 < 6) { T += 1 / 40; step(1 / 40); warm--; }
      gl.flush();
      if (warm > 0) { later(boot); return; }
      show();
      if (gl.getError() !== gl.NO_ERROR) { fail(); return; }
      ready = true; canvas.classList.add('is-on'); go();
      if (opts.onReady) opts.onReady();
    };
    later(boot);

    window.addEventListener('resize', function () {
      if (dead || !ready) return;
      var w0 = W, h0 = H;
      if (!size()) { dead = true; canvas.classList.remove('is-on'); if (opts.onLost) opts.onLost(); return; }
      if (W !== w0 || H !== h0) { for (var r = 0; r < 60; r++) step(1 / 40); show(); }
    }, { passive: true });
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; go(); }).observe(host);
    document.addEventListener('visibilitychange', go);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); dead = true; canvas.classList.remove('is-on'); if (opts.onLost) opts.onLost(); });
    return { setScroll: function (s) { thick = s; } };
  };
})();
