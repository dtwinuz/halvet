/* Shisha mozaika: basseyn tubi (WebGL shader). Har plitka o'z rangi, qirrasi va yaltirashi bilan;
   sakkiz qirrali yulduz motivi oltin/oq plitkalardan; ustida jonli suv — to'lqin sinishi (refraction) va kaustika.
   Sichqoncha yurganda iz to'lqinlari, bosganda/tegganda tomchi; harakatsiz turganda o'zi ham tomchilaydi.
   WebGL yo'q bo'lsa false qaytaradi (CSS fon rasm qoladi). */
(function () {
  var N = 12; // to'lqin manbalari
  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime;uniform float uTile;uniform vec2 uMouse;uniform float uLight;',
    'uniform vec4 uDrop[' + N + '];', // xy = joy (px, canvas), z = boshlanish vaqti, w = kuch
    'float h1(vec2 p){p=fract(p*vec2(233.34,851.73));p+=dot(p,p+23.45);return fract(p.x*p.y);}',
    'float star(vec2 q,float r){q=abs(q);float a=max(q.x,q.y);float b=(q.x+q.y)*.70710678;return min(a,b)-r;}',
    // suv balandligi: sekin to'lqinlar + tomchilardan halqalar
    'float wave(vec2 p){float t=uTime;',
    ' float h=sin(p.x*.011+t*.9)*.35+sin(p.y*.013-t*.7)*.35+sin((p.x+p.y)*.008+t*.55)*.4;',
    ' for(int i=0;i<' + N + ';i++){vec4 d=uDrop[i];float age=t-d.z;if(age<0.||age>6.)continue;',
    '  float r=length(p-d.xy);float k=r-age*170.;',
    '  h+=d.w*sin(k*.07)*exp(-k*k*.00012)*exp(-age*.75)*2.2;}',
    ' return h;}',
    'vec3 tileCol(vec2 cell,float big){',
    ' float r=h1(cell);',
    ' vec3 c=mix(vec3(.04,.33,.45),vec3(.10,.55,.66),r);',
    ' c=mix(c,vec3(.02,.22,.36),step(.82,h1(cell+7.1)));',
    ' c=mix(c,vec3(.32,.78,.84),step(.92,h1(cell+3.3))*.8);',
    // yulduz motivi (girih bilan bir xil geometriya)
    ' vec2 m=mod(cell+.5,big)-big*.5;float s=star(m,big*.2);',
    ' c=mix(c,mix(vec3(.72,.55,.32),vec3(.86,.70,.45),r),step(s,0.)*step(-1.1,s)*.9);', // oltin chegara
    ' c=mix(c,mix(vec3(.62,.84,.86),vec3(.80,.92,.92),r),step(s,-1.1)*.85);', // oq ichki
    ' c=mix(c,vec3(.03,.18,.30),step(abs(star(m,big*.11)),.55));', // markaz halqa
    ' return c;}',
    'void main(){',
    ' vec2 p=gl_FragCoord.xy;',
    ' float e=2.;float w0=wave(p);',
    ' vec2 g=vec2(wave(p+vec2(e,0.))-w0,wave(p+vec2(0.,e))-w0)/e;', // gradient
    ' vec2 q=p+g*uTile*3.2;', // sinish
    ' vec2 cp=q/uTile;vec2 cell=floor(cp);vec2 f=fract(cp);',
    ' vec3 col=tileCol(cell,20.);',
    // plitka qirrasi (bevel) va choki
    ' vec2 ed=min(f,1.-f);float edge=min(ed.x,ed.y);',
    ' float grout=smoothstep(.03,.03+max(.06,1.4/uTile),edge);',
    ' float bevel=smoothstep(.08,.24,edge);',
    ' vec3 nT=normalize(vec3((h1(cell+1.7)-.5)*.25+(f.x<.2?-.5:(f.x>.8?.5:0.))*(1.-bevel),(h1(cell+5.9)-.5)*.25+(f.y<.2?-.5:(f.y>.8?.5:0.))*(1.-bevel),1.));',
    ' vec3 L=normalize(vec3(uMouse-p,uRes.y*.55));',
    ' float spec=pow(max(dot(reflect(-L,nT),vec3(0.,0.,1.)),0.),40.)*(.25+uLight*.9);',
    ' col*=.78+.22*bevel;col=mix(vec3(.55,.58,.55)*.55,col,grout);',
    ' col+=spec*vec3(1.,.93,.82);',
    // kaustika: gradient yig'ilgan joylar yorug'
    ' float ca=0.;vec2 cq=q*.012;',
    ' for(int i=0;i<3;i++){float fi=float(i);cq+=vec2(sin(cq.y*1.7+uTime*.8+fi),cos(cq.x*1.5-uTime*.7+fi*1.7))*.5;ca+=abs(sin(cq.x*2.)+sin(cq.y*2.));}',
    ' ca=pow(1.-clamp(ca/3.*.5,0.,1.),6.);',
    ' float lens=clamp(dot(g,g)*8.,0.,1.);',
    ' col+=vec3(.75,.98,1.)*(ca*.55+lens*.35);',
    // suv rangi, chuqurlik va sichqoncha yorug'i
    ' col=mix(col,vec3(.02,.20,.27),.18);',
    ' float md=length(p-uMouse)/uRes.y;col+=vec3(1.,.85,.62)*exp(-md*md*9.)*.16*uLight;',
    ' vec2 uv=p/uRes;float vg=smoothstep(1.25,.35,length((uv-.5)*vec2(1.25,1.)));col*=.55+.45*vg;',
    ' gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  window.HVMosaic = function (canvas, host, opts) {
    opts = opts || {};
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) return false;
    var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false;
    gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uRes', 'uTime', 'uTile', 'uMouse', 'uLight', 'uDrop'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });

    var small = window.innerWidth < 760 || matchMedia('(pointer: coarse)').matches;
    var Q = small ? .62 : .8, minDt = small ? 32 : 16;
    var drops = new Float32Array(N * 4), head = 0, t0 = performance.now();
    for (var i = 0; i < N; i++) drops[i * 4 + 2] = -100;
    var mx = 0, my = 0, tmx = 0, tmy = 0, light = 0, tLight = 0, lastDrop = 0, lastPx = null, lastAct = -1e9;
    var visible = false, looping = false, last = 0, fixed = !!opts.still;
    var now = function () { return (performance.now() - t0) / 1000; };

    var size = function () {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.max(2, Math.round(w * Q)); canvas.height = Math.max(2, Math.round(h * Q));
      gl.viewport(0, 0, canvas.width, canvas.height);
      mx = tmx = canvas.width * .6; my = tmy = canvas.height * .55;
    };
    size(); window.addEventListener('resize', size, { passive: true });

    var drop = function (x, y, k) { head = (head + 1) % N; drops[head * 4] = x; drops[head * 4 + 1] = y; drops[head * 4 + 2] = now(); drops[head * 4 + 3] = k; };
    var toPx = function (e) { var r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * canvas.width, (1 - (e.clientY - r.top) / r.height) * canvas.height]; };
    host.addEventListener('pointermove', function (e) {
      var p = toPx(e), t = now(); tmx = p[0]; tmy = p[1]; tLight = 1; lastAct = t;
      if (lastPx) { var dx = p[0] - lastPx[0], dy = p[1] - lastPx[1]; if (dx * dx + dy * dy > 900 * Q * Q && t - lastDrop > .09) { drop(p[0], p[1], .45); lastDrop = t; lastPx = p; } }
      else lastPx = p;
    }, { passive: true });
    host.addEventListener('pointerdown', function (e) { var p = toPx(e); drop(p[0], p[1], 1.2); lastAct = now(); tLight = 1; tmx = p[0]; tmy = p[1]; });
    host.addEventListener('pointerleave', function () { tLight = 0; lastPx = null; });

    var frame = function () {
      var t = now();
      // harakatsiz: o'zi tomchilaydi (mobilda ham jonli)
      if (t - lastAct > 2.2 && t - lastDrop > 1.6) { drop(canvas.width * (.15 + Math.random() * .7), canvas.height * (.15 + Math.random() * .7), .7); lastDrop = t; }
      mx += (tmx - mx) * .1; my += (tmy - my) * .1; light += (tLight - light) * .05;
      if (t - lastAct > 3) tLight = small ? .55 : .35;
      gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform1f(U.uTime, t);
      gl.uniform1f(U.uTile, (small ? 17 : 22) * Q); gl.uniform2f(U.uMouse, mx, my); gl.uniform1f(U.uLight, light);
      gl.uniform4fv(U.uDrop, drops);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    var tick = function (ts) {
      if (!visible || document.hidden) { looping = false; return; }
      requestAnimationFrame(tick);
      if (ts - last < minDt) return;
      last = ts; frame();
    };
    var go = function () { if (fixed) { frame(); return; } if (!looping && visible && !document.hidden) { looping = true; requestAnimationFrame(tick); } };
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; go(); }).observe(host);
    document.addEventListener('visibilitychange', go);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); visible = false; canvas.classList.remove('is-on'); if (opts.onLost) opts.onLost(); });
    if (fixed) { tLight = light = .5; drop(canvas.width * .55, canvas.height * .5, 1); t0 -= 1500; }
    canvas.classList.add('is-on');
    go();
    return true;
  };
})();
