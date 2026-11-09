/* Hero: jonli tuman (WebGL shader). Domain-warp fbm ikki qatlam (chuqurlik), gumbaz teshiklaridan nur,
   sichqoncha izi tumanni suradi/aylantiradi va iliq yorug'lik bilan yoritadi; scroll tumanni quyuqlashtiradi.
   WebGL yo'q bo'lsa false qaytaradi — app.js 2D bug'ga o'tadi. */
(function () {
  var N = 14; // iz nuqtalari
  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uLight;uniform float uScroll;uniform float uOct;',
    'uniform vec3 uTrail[' + N + '];uniform vec2 uVel[' + N + '];',
    'float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.8,.6,-.6,.8);',
    ' for(int i=0;i<6;i++){if(float(i)>=uOct)break;v+=a*n(p);p=r*p*2.02+vec2(1.7,9.2);a*=.5;}return v;}',
    'float beam(vec2 p,vec2 o,vec2 d,float w0,float len){vec2 q=p-o;float a=dot(q,d);float s=abs(dot(q,vec2(-d.y,d.x)));',
    ' float w=w0+a*.075;return smoothstep(w,w*.15,s)*smoothstep(0.,.08,a)*smoothstep(len,len*.25,a);}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;vec2 p=vec2(uv.x*asp,uv.y);',
    ' vec2 disp=vec2(0.);float clr=0.;',
    ' for(int i=0;i<' + N + ';i++){vec3 tr=uTrail[i];if(tr.z<.01)continue;vec2 d=p-vec2(tr.x*asp,tr.y);float r=dot(d,d);',
    '  float f=exp(-r*22.)*tr.z;disp+=(d*.9+uVel[i]*1.4)*f;clr+=exp(-r*55.)*tr.z;}',
    ' vec2 q=p-disp*.55;float t=uTime*.035;',
    ' vec2 w=vec2(fbm(q*1.5+vec2(t,0.)),fbm(q*1.5+vec2(0.,-t)+5.2));',
    ' float f1=fbm(q*2.3+w*1.6+vec2(t*1.8,-t*.5));',
    ' float f2=fbm(q*1.1+w*.9+vec2(-t*.8,t*.35)+3.1);',
    ' float band=smoothstep(.02,.4,uv.y)*smoothstep(1.08,.5,uv.y);',
    ' float dens=(smoothstep(.38,.86,f1)*.6+smoothstep(.32,.9,f2)*.55)*(.45+.55*band);',
    ' dens*=1.-clamp(clr*1.15,0.,.9);',
    ' dens*=.75+uScroll*1.1;',
    // nurlar: gumbaz teshiklaridan pastga, markazga qiya
    ' float ry=0.;',
    ' ry+=beam(p,vec2(.40*asp,1.04),normalize(vec2(.10,-1.)),.010,1.0)*(.65+.35*sin(uTime*.55));',
    ' ry+=beam(p,vec2(.52*asp,1.06),normalize(vec2(.02,-1.)),.014,1.1)*(.6+.4*sin(uTime*.42+1.7));',
    ' ry+=beam(p,vec2(.61*asp,1.04),normalize(vec2(-.06,-1.)),.009,.95)*(.6+.4*sin(uTime*.61+3.1));',
    ' ry+=beam(p,vec2(.70*asp,1.05),normalize(vec2(-.14,-1.)),.012,1.0)*(.55+.45*sin(uTime*.38+4.4));',
    ' ry+=beam(p,vec2(.30*asp,1.03),normalize(vec2(.20,-1.)),.008,.8)*(.5+.5*sin(uTime*.47+2.2));',
    ' ry*=.55+.9*f2;',
    // sichqoncha: tumanni ichidan yoritadi
    ' vec2 m=vec2(uMouse.x*asp,uMouse.y);float md=dot(p-m,p-m);float lit=exp(-md*7.)*uLight;',
    ' vec3 fogC=mix(vec3(.80,.72,.62),vec3(1.,.95,.86),f1);',
    ' vec3 col=fogC*dens*(.55+lit*.9)+vec3(1.,.9,.74)*ry*.32+vec3(1.,.82,.6)*lit*.10;',
    ' float a=clamp(dens*(.5+lit*.35)+ry*.26+lit*.06,0.,.92);',
    ' gl_FragColor=vec4(col,a);}'
  ].join('\n');

  window.HVFog = function (canvas, host, opts) {
    var gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) return false;
    var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false;
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uRes', 'uTime', 'uMouse', 'uLight', 'uScroll', 'uOct', 'uTrail', 'uVel'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });

    var small = window.innerWidth < 760 || matchMedia('(pointer: coarse)').matches;
    var Q = small ? .42 : .55, oct = small ? 4 : 5, minDt = small ? 32 : 15;
    var trail = new Float32Array(N * 3), vel = new Float32Array(N * 2), head = 0;
    var mx = .6, my = .55, tmx = .6, tmy = .55, light = 0, tLight = 0, lastP = null;
    var scroll = 0, visible = true, looping = false, last = 0, t0 = performance.now(), fixed = opts && opts.still;

    var size = function () {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.max(2, Math.round(w * Q)); canvas.height = Math.max(2, Math.round(h * Q));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    size(); window.addEventListener('resize', size);

    var onMove = function (e) {
      var r = host.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
      tmx = x; tmy = y; tLight = 1;
      if (lastP) {
        var dx = x - lastP[0], dy = y - lastP[1];
        if (dx * dx + dy * dy > .00002) {
          head = (head + 1) % N;
          trail[head * 3] = x; trail[head * 3 + 1] = y; trail[head * 3 + 2] = 1;
          vel[head * 2] = dx * 3; vel[head * 2 + 1] = dy * 3;
        }
      }
      lastP = [x, y];
    };
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', function () { tLight = 0; lastP = null; });

    var frame = function (now) {
      var t = (now - t0) / 1000;
      mx += (tmx - mx) * .08; my += (tmy - my) * .08; light += (tLight - light) * .05;
      for (var i = 0; i < N; i++) trail[i * 3 + 2] *= .955;
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, t + 40); gl.uniform2f(U.uMouse, mx, my); gl.uniform1f(U.uLight, light);
      gl.uniform1f(U.uScroll, scroll); gl.uniform1f(U.uOct, oct);
      gl.uniform3fv(U.uTrail, trail); gl.uniform2fv(U.uVel, vel);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (opts && opts.onFrame) opts.onFrame(mx, my, light);
    };
    var tick = function (now) {
      if (!visible || document.hidden) { looping = false; return; }
      requestAnimationFrame(tick);
      if (now - last < minDt) return;
      last = now; frame(now);
    };
    var go = function () { if (fixed) { frame(performance.now()); return; } if (!looping && visible && !document.hidden) { looping = true; requestAnimationFrame(tick); } };
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; go(); }).observe(host);
    document.addEventListener('visibilitychange', go);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); visible = false; canvas.style.display = 'none'; if (opts && opts.onLost) opts.onLost(); });
    go();
    return { setScroll: function (s) { scroll = s; if (fixed) go(); } };
  };
})();
