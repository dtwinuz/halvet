/* HV-01 Nasos va filtratsiya — prinsipial sxema 3D (mijozning system.jpg uslubida, lekin jonli).
   Kesimli basseyn (haqiqiy suv yuzasi, kaustika, forsunka oqimi, suv osti chirog'i) + shisha platformada qurilmalar:
   nasos+prefiltr → qum filtri (oynadan qum ko'rinadi) → issiqlik almashtirgich (qozon halqasi) → dozalash → qaytish.
   Neon quvurlar rangi vazifasiga qarab, ichida strelkalar oqadi. Scroll kamerani qadamdan qadamga olib boradi,
   raqamli yorliqlar (HTML) 3D nuqtalarga bog'langan; yorliq bosilsa o'sha qadamga o'tadi. */
export async function mountEquip(stage, opts) {
  const [THREE, { RoomEnvironment }] = await Promise.all([import('./vendor/three.module.min.js'), import('./vendor/RoomEnvironment.js')]);
  const reduce = opts.reduce, small = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
  const canvas = document.createElement('canvas');
  canvas.className = 'hv-eq__gl';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: false, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no gl');
  renderer.debug.checkShaderErrors = false;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const BG = 0x061420;
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 26, 60);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = .55;
  pm.dispose();
  const camera = new THREE.PerspectiveCamera(small ? 52 : 38, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xbfe4ff, 0x06121c, .55));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-6, 14, 12); scene.add(key);
  const rim = new THREE.DirectionalLight(0x5fd8ff, 1.1); rim.position.set(10, 6, -14); scene.add(rim);

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); scene.add(m); return m; };
  const cyl = (r, h, s = 40, open = false, t0 = 0, tl = Math.PI * 2) => new THREE.CylinderGeometry(r, r, h, s, 1, open, t0, tl);
  const tex = (w, h, draw, rep) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    return t;
  };
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const radial = (stops) => (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); stops.forEach((s) => r.addColorStop(s[0], s[1])); g.fillStyle = r; g.fillRect(0, 0, w, w); };

  // mozaika plitkasi (basseyn devori/tubi)
  const tileDraw = (g, w, h) => {
    g.fillStyle = '#c9d6dc'; g.fillRect(0, 0, w, h);
    const n = 16, s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      g.fillStyle = `hsl(${192 + rnd() * 14},${55 + rnd() * 20}%,${34 + rnd() * 18}%)`;
      g.fillRect(x * s + 1.2, y * s + 1.2, s - 2.4, s - 2.4);
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x * s + 1.2, y * s + 1.2, s - 2.4, 2);
    }
  };
  const tileTex = tex(256, 256, tileDraw, [6, 1.4]);
  const tileTexF = tex(256, 256, tileDraw);
  tileTexF.wrapS = tileTexF.wrapT = THREE.RepeatWrapping;
  const gridTex = tex(512, 512, (g, w, h) => {
    g.fillStyle = '#0a2233'; g.fillRect(0, 0, w, h);
    g.lineWidth = 1;
    [[64, 'rgba(110,210,255,.07)'], [16, 'rgba(110,210,255,.2)']].forEach(([n, c]) => {
      g.strokeStyle = c;
      for (let i = 0; i <= n; i++) { const p = i * w / n; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, h); g.moveTo(0, p); g.lineTo(w, p); g.stroke(); }
    });
  }, [3, 1]);
  const dotTex = tex(64, 64, radial([[0, 'rgba(255,255,255,1)'], [.4, 'rgba(180,240,255,.6)'], [1, 'rgba(120,220,255,0)']]));
  const glowTex = tex(128, 128, radial([[0, 'rgba(200,250,255,1)'], [.25, 'rgba(110,220,255,.5)'], [1, 'rgba(60,180,255,0)']]));
  const haloTex = tex(128, 128, radial([[0, 'rgba(80,200,255,.55)'], [1, 'rgba(80,200,255,0)']]));

  const M = {
    steel: new THREE.MeshStandardMaterial({ color: 0xd5dbe0, metalness: .95, roughness: .22 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x59636b, metalness: .9, roughness: .3 }),
    black: new THREE.MeshStandardMaterial({ color: 0x15191c, metalness: .5, roughness: .38 }),
    motor: new THREE.MeshStandardMaterial({ color: 0x1f5fd0, metalness: .65, roughness: .3 }),
    tank: new THREE.MeshStandardMaterial({ color: 0x1d58b8, metalness: .55, roughness: .22, side: THREE.DoubleSide }),
    white: new THREE.MeshStandardMaterial({ color: 0xe9eef2, metalness: .35, roughness: .3 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xcfefff, metalness: 0, roughness: .04, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide }),
    coping: new THREE.MeshStandardMaterial({ color: 0xe6e2da, roughness: .5 }),
    tile: new THREE.MeshStandardMaterial({ map: tileTex, roughness: .28, metalness: .05 }),
    plinth: new THREE.MeshStandardMaterial({ color: 0x2a3b47, roughness: .7 }),
    basket: new THREE.MeshStandardMaterial({ color: 0x2b3238, wireframe: true })
  };

  // ── platforma: shisha plita, to'r chiziqlari, yonib turgan qirralar
  const plat = add(new THREE.BoxGeometry(17, .16, 5.2), new THREE.MeshStandardMaterial({ map: gridTex, color: 0x9fd8ff, metalness: .4, roughness: .25 }), 1, .08, -.4);
  plat.add(new THREE.LineSegments(new THREE.EdgesGeometry(plat.geometry), new THREE.LineBasicMaterial({ color: 0x4fd8ff, transparent: true, opacity: .55, blending: THREE.AdditiveBlending })));
  add(new THREE.PlaneGeometry(90, 90), new THREE.MeshBasicMaterial({ color: 0x050f18 }), 0, -.01, 0, -Math.PI / 2);
  add(new THREE.PlaneGeometry(26, 9), new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .35 }), 1, .005, -.4, -Math.PI / 2);

  // ── basseyn (kesim): plintus, mozaika devorlar, tosh bortik, tub
  const PX0 = -5.2, PX1 = 5.2, PZ0 = -10, PZ1 = -4.2, PY = .5, WT = .28, WH = 1.75, WL = 1.55;
  const pw = PX1 - PX0, pd = PZ1 - PZ0, pcx = (PX0 + PX1) / 2, pcz = (PZ0 + PZ1) / 2;
  add(new THREE.BoxGeometry(pw + .6, PY, pd + .6), M.plinth, pcx, PY / 2, pcz);
  const wallX = new THREE.BoxGeometry(pw, WH, WT), wallZ = new THREE.BoxGeometry(WT, WH, pd - WT * 2);
  [PZ0 + WT / 2, PZ1 - WT / 2].forEach((z) => add(wallX, M.tile, pcx, PY + WH / 2, z));
  [PX0 + WT / 2, PX1 - WT / 2].forEach((x) => add(wallZ, M.tile, x, PY + WH / 2, pcz));
  [PZ0 + WT / 2, PZ1 - WT / 2].forEach((z) => add(new THREE.BoxGeometry(pw + .14, .1, WT + .14), M.coping, pcx, PY + WH + .05, z));
  [PX0 + WT / 2, PX1 - WT / 2].forEach((x) => add(new THREE.BoxGeometry(WT + .14, .1, pd), M.coping, x, PY + WH + .05, pcz));
  // (8) suv osti chirog'i pozitsiyasi — tub shaderi ham shu nuqtadan yoritiladi
  const LT = V(-2.2, PY + .78, PZ0 + WT + .02);
  // tub: mozaika + kaustika (shader)
  const floorMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tileTexF }, uTime: { value: 0 }, uLight: { value: 1 }, uLp: { value: new THREE.Vector2(LT.x, LT.z) } },
    vertexShader: 'varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: [
      'uniform sampler2D uMap;uniform float uTime;uniform float uLight;uniform vec2 uLp;varying vec2 vUv;varying vec3 vW;',
      'float c(vec2 p){float v=0.;for(int i=0;i<3;i++){float f=float(i);p+=vec2(sin(p.y*1.3+uTime*.8+f),cos(p.x*1.1-uTime*.7+f*2.))*.5;v+=abs(sin(p.x*2.)+sin(p.y*2.));}return v/3.;}',
      'void main(){vec3 t=texture2D(uMap,vUv*vec2(6.,3.)).rgb;float k=pow(1.-clamp(c(vW.xz*.9)*.5,0.,1.),5.);',
      ' vec2 d=vW.xz-uLp;float lp=exp(-dot(d,d)*.08)*uLight;',
      ' vec3 col=t*vec3(.45,.75,.85)*(.55+lp*.9)+vec3(.7,1.,1.)*k*.55;col=mix(col,vec3(.02,.25,.35),.25);gl_FragColor=vec4(col,1.);',
      '#include <colorspace_fragment>',
      '}'
    ].join('\n')
  });
  add(new THREE.PlaneGeometry(pw - WT * 2, pd - WT * 2), floorMat, pcx, PY + .01, pcz, -Math.PI / 2);
  // suv: hajm (ichki devorlarni moviylashtiradi) + jonli yuza
  add(new THREE.BoxGeometry(pw - WT * 2 - .02, WL - .02, pd - WT * 2 - .02), new THREE.MeshPhysicalMaterial({ color: 0x1aa6c9, transparent: true, opacity: .22, roughness: .1, depthWrite: false, side: THREE.BackSide }), pcx, PY + WL / 2, pcz);
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() } },
    vertexShader: [
      'uniform float uTime;varying vec3 vW;varying vec3 vN;',
      'float hgt(vec2 p){return sin(p.x*1.7+uTime*1.3)*.018+sin(p.y*2.3-uTime*1.1)*.014+sin((p.x+p.y)*3.1+uTime*1.9)*.008;}',
      'void main(){vec4 w=modelMatrix*vec4(position,1.);float h=hgt(w.xz);w.y+=h;',
      ' float e=.05;vN=normalize(vec3(-(hgt(w.xz+vec2(e,0.))-h)/e,1.,-(hgt(w.xz+vec2(0.,e))-h)/e));vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}'
    ].join('\n'),
    fragmentShader: [
      'uniform float uTime;uniform vec3 uCam;varying vec3 vW;varying vec3 vN;',
      'float c(vec2 p){float v=0.;for(int i=0;i<3;i++){float f=float(i);p+=vec2(sin(p.y*1.5+uTime*.9+f),cos(p.x*1.3-uTime*.8+f*1.7))*.45;v+=abs(sin(p.x*2.2)+sin(p.y*2.2));}return v/3.;}',
      'void main(){vec3 V=normalize(uCam-vW);vec3 N=normalize(vN+vec3(sin(vW.x*9.+uTime*2.)*.03,0.,cos(vW.z*8.-uTime*1.7)*.03));',
      ' float fr=pow(1.-max(dot(N,V),0.),3.);vec3 L=normalize(vec3(-.4,.9,.5));float sp=pow(max(dot(reflect(-L,N),V),0.),90.);',
      ' float k=pow(1.-clamp(c(vW.xz*1.1)*.5,0.,1.),6.);',
      ' vec3 deep=vec3(.02,.33,.45),sky=vec3(.55,.85,1.);vec3 col=mix(deep,sky,fr*.8)+vec3(.8,1.,1.)*(sp*1.4+k*.18);',
      ' gl_FragColor=vec4(col,.42+fr*.4+sp);',
      '#include <colorspace_fragment>',
      '}'
    ].join('\n')
  });
  add(new THREE.PlaneGeometry(pw - WT * 2, pd - WT * 2, small ? 40 : 80, small ? 22 : 44), waterMat, pcx, PY + WL, pcz, -Math.PI / 2);
  const WTOP = PY + WL;

  // (1) skimmer: chap old burchakda, panjarali qopqoq
  const SK = V(-4.3, PY + WH, PZ1);
  add(new THREE.BoxGeometry(.9, .9, .7), M.white, SK.x, PY + WH - .45, PZ1 + .2);
  add(new THREE.BoxGeometry(.78, .04, .6), M.darkSteel, SK.x, PY + WH + .12, PZ1 + .2);
  for (let i = 0; i < 7; i++) add(new THREE.BoxGeometry(.03, .05, .52), M.black, SK.x - .3 + i * .1, PY + WH + .145, PZ1 + .2);
  add(new THREE.BoxGeometry(.6, .28, .05), M.black, SK.x, WTOP - .02, PZ1 - WT - .01); // og'iz

  // (2) tub drenaji: dumaloq panjara
  const DR = V(0, PY + .02, pcz);
  add(cyl(.42, .05, 40), M.white, DR.x, DR.y, DR.z);
  const drainRing = add(new THREE.TorusGeometry(.34, .025, 8, 48), new THREE.MeshBasicMaterial({ color: 0xc89bff }), DR.x, DR.y + .04, DR.z, Math.PI / 2);
  for (let i = 0; i < 8; i++) add(new THREE.BoxGeometry(.6, .02, .03), M.darkSteel, DR.x, DR.y + .035, DR.z, 0, i * Math.PI / 8);

  // (8) suv osti chirog'i: chap devorda
  add(cyl(.24, .06, 32), M.steel, LT.x, LT.y, LT.z, Math.PI / 2);
  add(new THREE.CircleGeometry(.19, 32), new THREE.MeshBasicMaterial({ color: 0xdff9ff }), LT.x, LT.y, LT.z + .04);
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9 }));
  lampGlow.position.set(LT.x, LT.y, LT.z + .12); lampGlow.scale.set(2.4, 2.4, 1); scene.add(lampGlow);
  const poolLed = new THREE.PointLight(0x7fe6ff, 9, 9, 1.6); poolLed.position.set(LT.x, LT.y + .2, LT.z + .6); scene.add(poolLed);

  // (7) qaytish forsunkalari: o'ng devorda uchta
  const JETS = [-5.6, -7.1, -8.6].map((z) => V(PX1 - WT - .02, PY + 1.05, z));
  JETS.forEach((j) => { add(cyl(.11, .14, 20), M.steel, j.x, j.y, j.z, 0, 0, Math.PI / 2); add(cyl(.05, .06, 16), M.black, j.x - .08, j.y, j.z, 0, 0, Math.PI / 2); });

  // ── qurilmalar platformada (z = EZ)
  const EZ = -.6;
  // (3) nasos: shaffof prefiltr + savat, korpus, ko'k dvigatel qovurg'alari bilan
  const PUX = -4.2;
  add(new THREE.BoxGeometry(2.6, .1, 1.1), M.darkSteel, PUX + .9, .21, EZ);
  add(cyl(.36, .7, 36), M.glass, PUX, .62, EZ);
  add(cyl(.27, .55, 18, true), M.basket, PUX, .6, EZ);
  add(cyl(.4, .1, 36), M.black, PUX, 1.0, EZ);
  add(new THREE.BoxGeometry(.5, .05, .08), M.black, PUX, 1.08, EZ);
  add(cyl(.34, .3, 36), M.black, PUX, .32, EZ);
  add(new THREE.SphereGeometry(.42, 32, 20), M.black, PUX + .72, .6, EZ);
  add(cyl(.12, .35, 20), M.black, PUX + .72, 1.05, EZ); // chiqish patrubkasi
  add(cyl(.38, 1.15, 40), M.motor, PUX + 1.55, .6, EZ, 0, 0, Math.PI / 2);
  const fin = new THREE.InstancedMesh(new THREE.TorusGeometry(.385, .025, 6, 40), M.motor, 12);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)), one = V(1, 1, 1);
  for (let i = 0; i < 12; i++) { m4.compose(V(PUX + 1.08 + i * .085, .6, EZ), q4, one); fin.setMatrixAt(i, m4); }
  scene.add(fin);
  add(cyl(.33, .22, 32), M.black, PUX + 2.2, .6, EZ, 0, 0, Math.PI / 2);
  add(new THREE.BoxGeometry(.3, .22, .3), M.black, PUX + 1.55, 1.05, EZ);

  // (4) qum filtri: ko'k bak, old tomoni shisha oyna — ichida shag'al, qum va suv; ustida 6 yo'lli klapan + manometr
  const FX = -.6, FR = .72, FH = 1.5, FY = .32, FTOP = FY + FH + FR;
  add(cyl(FR, FH, 48, true), M.tank, FX, FY + FH / 2, EZ);
  // old oyna: shag'al, qum, ustida suv — zarrachalar qumga tushib qoladi (shader, shaffoflik saralashisiz)
  const winMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOn: { value: .4 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: [
      'uniform float uTime;uniform float uOn;varying vec2 vUv;',
      'float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
      'void main(){vec2 u=vUv;vec3 c;',
      ' float g=h(floor(u*vec2(46.,30.)));float s=h(floor(u*vec2(160.,110.)));',
      ' if(u.y<.2){c=mix(vec3(.18,.16,.14),vec3(.42,.38,.33),g)*(.7+.3*step(.5,h(floor(u*vec2(20.,12.)))));}',
      ' else if(u.y<.56){c=mix(vec3(.55,.43,.27),vec3(.86,.72,.5),s)*(.8+.2*smoothstep(.2,.56,u.y));c=mix(c,vec3(.3,.26,.2),.25*smoothstep(.5,.2,u.y));}',
      ' else{c=mix(vec3(.05,.35,.5),vec3(.18,.62,.78),u.y);',
      '  vec2 q=vec2(u.x*26.,u.y*10.+uTime*(.9+uOn*1.6));vec2 i=floor(q);vec2 f=fract(q)-.5;float r=h(i);',
      '  c+=vec3(.75,.95,1.)*smoothstep(.12,.0,length(f+vec2(r-.5,0.)*.6))*step(.55,r)*(.5+uOn);}',
      ' c+=vec3(1.)*smoothstep(.015,.0,abs(u.y-.56))*.25;',
      ' c+=vec3(.9,.97,1.)*smoothstep(.06,.0,abs(u.x-.18))*.18;',
      ' float e=smoothstep(0.,.05,u.x)*smoothstep(1.,.95,u.x)*smoothstep(0.,.04,u.y)*smoothstep(1.,.96,u.y);',
      ' gl_FragColor=vec4(c*(.35+.65*e),1.);',
      '#include <colorspace_fragment>',
      '}'
    ].join('\n')
  });
  add(cyl(FR + .006, 1.1, 32, true, -.62, 1.24), winMat, FX, FY + .72, EZ);
  [-.62, .62].forEach((a) => add(new THREE.BoxGeometry(.04, 1.14, .04), M.darkSteel, FX + Math.sin(a) * (FR + .01), FY + .72, EZ + Math.cos(a) * (FR + .01), 0, a));
  add(new THREE.SphereGeometry(FR, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.tank, FX, FY + FH, EZ);
  add(new THREE.SphereGeometry(FR, 48, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.tank, FX, FY, EZ);
  [0, 1, 2].forEach((i) => add(new THREE.TorusGeometry(FR + .01, .02, 8, 48), M.darkSteel, FX, FY + .2 + i * .55, EZ, Math.PI / 2));
  add(cyl(.55, .22, 32), M.black, FX, .1, EZ);
  add(cyl(.3, .26, 28), M.black, FX, FTOP - .02, EZ);
  add(cyl(.12, .14, 20), M.steel, FX, FTOP + .17, EZ);
  add(new THREE.BoxGeometry(.06, .06, .6), M.black, FX, FTOP + .27, EZ + .1, 0, .5);
  add(cyl(.16, .05, 28), M.white, FX + .38, FTOP + .05, EZ + .05, Math.PI / 2);
  add(cyl(.12, .02, 24), new THREE.MeshBasicMaterial({ color: 0x0b1a22 }), FX + .38, FTOP + .05, EZ + .08, Math.PI / 2);
  const needle = add(new THREE.BoxGeometry(.012, .1, .01), new THREE.MeshBasicMaterial({ color: 0xff5a4a }), FX + .38, FTOP + .07, EZ + .1);

  // (5) issiqlik almashtirgich: gorizontal zanglamas korpus, old oynada issiqlik to'lqinlari; orqada qozon
  const HX = 2.6;
  add(cyl(.46, 1.7, 40), M.steel, HX, .85, EZ, 0, 0, Math.PI / 2);
  [-.85, .85].forEach((d) => add(cyl(.52, .1, 40), M.darkSteel, HX + d, .85, EZ, 0, 0, Math.PI / 2));
  [-.55, .55].forEach((d) => add(new THREE.BoxGeometry(.14, .45, .8), M.darkSteel, HX + d, .32, EZ));
  const heatMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOn: { value: .5 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: [
      'uniform float uTime;uniform float uOn;varying vec2 vUv;',
      'void main(){vec2 p=vUv;float w=0.;for(int i=0;i<3;i++){float y=.25+float(i)*.25;float s=y+sin(p.x*18.-uTime*4.+float(i))*.05;w+=smoothstep(.035,.0,abs(p.y-s));}',
      ' vec3 col=vec3(.25,.03,.02)+vec3(1.,.32,.12)*w*(.6+uOn)+vec3(1.,.5,.2)*.08*uOn;float e=smoothstep(0.,.06,p.x)*smoothstep(1.,.94,p.x)*smoothstep(0.,.1,p.y)*smoothstep(1.,.9,p.y);',
      ' gl_FragColor=vec4(col*e,1.);',
      '#include <colorspace_fragment>',
      '}'
    ].join('\n')
  });
  add(new THREE.BoxGeometry(1.0, .5, .1), M.darkSteel, HX, .85, EZ + .44);
  add(new THREE.PlaneGeometry(.86, .38), heatMat, HX, .85, EZ + .5);
  const hxLight = new THREE.PointLight(0xff6a2a, 2, 1.7, 2); hxLight.position.set(HX, .95, EZ + .8); scene.add(hxLight);
  // qozon (issiqlik manbai) — platforma orqasida
  const BX = HX, BZ = EZ - 1.65;
  add(new THREE.BoxGeometry(1.0, 1.5, .6), M.white, BX, .9, BZ);
  const flame = add(new THREE.PlaneGeometry(.34, .22), new THREE.MeshBasicMaterial({ color: 0xff7a2a }), BX, .75, BZ + .31);
  add(new THREE.PlaneGeometry(.42, .14), new THREE.MeshBasicMaterial({ color: 0x0d2633 }), BX, 1.35, BZ + .31);

  // (6) dozalash stansiyasi: oq shkaf, ekranda pH/Cl, oynada ikki kanistra va peristaltik nasoslar
  const DX = 5.6;
  // ochiq tokcha: kanistralar ko'rinib turadi
  add(new THREE.BoxGeometry(1.25, .7, .62), M.white, DX, 1.3, EZ);
  add(new THREE.BoxGeometry(1.25, .92, .06), M.white, DX, .5, EZ - .28);
  add(new THREE.BoxGeometry(1.25, .06, .62), M.white, DX, .19, EZ);
  [-.6, .6].forEach((dx) => add(new THREE.BoxGeometry(.05, .92, .62), M.white, DX + dx, .5, EZ));
  const scrC = document.createElement('canvas'); scrC.width = 256; scrC.height = 128;
  const scrTex = new THREE.CanvasTexture(scrC); scrTex.colorSpace = THREE.SRGBColorSpace;
  const drawScreen = (ph, cl) => {
    const g = scrC.getContext('2d');
    g.fillStyle = '#04141c'; g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#5fe3ff'; g.font = '600 40px Manrope, system-ui, sans-serif'; g.fillText('pH ' + ph, 18, 52);
    g.fillStyle = '#ffffff'; g.font = '600 32px Manrope, system-ui, sans-serif'; g.fillText('Cl ' + cl, 18, 104);
    g.fillStyle = '#9fb7c2'; g.font = '500 20px Manrope, system-ui, sans-serif'; g.fillText('mg/l', 150, 104);
    g.fillStyle = '#4bd58a'; g.beginPath(); g.arc(232, 26, 7, 0, 7); g.fill();
    scrTex.needsUpdate = true;
  };
  drawScreen('7.2', '1.2');
  add(new THREE.PlaneGeometry(.9, .45), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false }), DX, 1.38, EZ + .315);
  const canShell = new THREE.MeshPhysicalMaterial({ color: 0xe8f3f8, transparent: true, opacity: .35, roughness: .1, depthWrite: false });
  const cans = [[-.25, 0x2f8cff], [.25, 0xffc61a]].map(([dx, c]) => {
    add(cyl(.16, .5, 24), canShell, DX + dx, .55, EZ + .05);
    const liq = add(cyl(.145, .36, 24), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .35, roughness: .2, transparent: true, opacity: .85 }), DX + dx, .48, EZ + .05);
    add(cyl(.07, .08, 16), M.black, DX + dx, .84, EZ + .05);
    add(cyl(.08, .07, 20), M.black, DX + dx, 1.05, EZ + .32, Math.PI / 2);
    return liq;
  });

  // ── quvurlar: neon yadro + tashqi nur, ichida strelkalar oqadi
  const COL = { cold: 0x2f7bff, ret: 0x22f0dc, chem: 0xffd34d, drain: 0xa86bff, hot: 0xff7a2a };
  const PIPE_VS = 'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}';
  const PIPE_FS = [
    'uniform float uTime;uniform float uLen;uniform vec3 uC;uniform float uOn;uniform float uSp;varying vec2 vUv;varying vec3 vN;varying vec3 vV;',
    'void main(){float f=max(dot(vN,vV),0.);',
    ' float s=fract(vUv.x*uLen/.42-uTime*(.9+uOn*1.3)*uSp);float a=abs(fract(vUv.y*2.)-.5);',
    ' float chev=smoothstep(.16,.04,abs(s-.5-a*.55))*smoothstep(.15,.4,f);',
    ' vec3 c=uC*(.28+.55*uOn)*(.45+.55*f)+vec3(1.)*pow(f,24.)*.25+mix(uC,vec3(1.),.6)*chev*(.35+.9*uOn);',
    ' gl_FragColor=vec4(c,1.);',
    '#include <colorspace_fragment>',
    '}'
  ].join('\n');
  const GLOW_FS = 'uniform vec3 uC;uniform float uOn;varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){float f=max(dot(vN,vV),0.);gl_FragColor=vec4(uC*pow(f,2.2)*(.12+.5*uOn),1.);}';
  const pipes = [];
  const pipe = (pts, r, kind, steps, speed = 1) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => V(...p)), false, 'catmullrom', .02);
    const len = curve.getLength(), seg = Math.max(30, Math.round(len * 14)), col = new THREE.Color(COL[kind]);
    const on = { value: .5 };
    const core = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uLen: { value: len }, uC: { value: col }, uOn: on, uSp: { value: speed } }, vertexShader: PIPE_VS, fragmentShader: PIPE_FS });
    const glow = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uC: { value: col }, uOn: on }, vertexShader: PIPE_VS, fragmentShader: GLOW_FS });
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 16, false), core));
    const gm = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r * 2.6, 12, false), glow); gm.renderOrder = 2; scene.add(gm);
    pipes.push({ core, on, steps });
  };
  const Y0 = .34; // platforma ustidagi quvur balandligi
  // filtratsiya: skimmer → nasos
  pipe([[SK.x, PY + WH - .8, PZ1 + .45], [SK.x, Y0 + .2, PZ1 + .55], [SK.x, Y0, PZ1 + 1.4], [-4.75, Y0, EZ - .55], [PUX - .5, .55, EZ], [PUX - .34, .55, EZ]], .085, 'cold', [1, 3]);
  // drenaj: tub → plintus orqali → nasos
  pipe([[DR.x, PY - .05, DR.z], [DR.x, .26, DR.z + 1.2], [DR.x, .26, PZ1 + .3], [-1.6, Y0, PZ1 + 1.2], [-3.1, Y0, EZ - .5], [PUX - .1, .3, EZ - .4], [PUX, .32, EZ - .28]], .075, 'drain', [2, 3]);
  // nasos → filtr klapani
  pipe([[PUX + .72, 1.22, EZ], [PUX + .72, 1.45, EZ], [-1.6, 1.45, EZ], [FX - .25, FTOP + .05, EZ]], .085, 'cold', [3, 4]);
  // filtr → issiqlik almashtirgich
  pipe([[FX + .25, FTOP, EZ], [.5, 2.15, EZ], [1.0, 1.2, EZ], [HX - 1.05, .85, EZ]], .085, 'cold', [4, 5], 1.1);
  // issiqlik almashtirgich → dozalash (iliq, toza suv)
  pipe([[HX + 1.0, .85, EZ], [4.2, .85, EZ], [DX - .7, .9, EZ]], .085, 'ret', [5, 6]);
  // dozalash → basseynga qaytish: o'ng tomondan ko'tarilib kollektorga
  pipe([[DX + .62, .9, EZ], [7.3, .9, EZ], [7.4, Y0 + .1, -2.6], [6.4, 1.0, PZ1 - .2], [PX1 + .35, PY + 1.05, JETS[0].z + .3], [PX1 + .35, PY + 1.05, JETS[2].z - .2]], .085, 'ret', [6, 7]);
  JETS.forEach((j) => pipe([[PX1 + .35, j.y, j.z], [j.x + .05, j.y, j.z]], .06, 'ret', [7]));
  // kimyo: kanistralardan qaytish liniyasiga in'eksiya
  [[-.25, .12], [.25, .2]].forEach(([dx, off]) => pipe([[DX + dx, .86, EZ + .05], [DX + dx, 1.12, EZ - .2], [DX + .55, 1.1, EZ - .25], [6.6, .95 + off * .1, EZ - .1], [6.9, .9, EZ]], .028, 'chem', [6], 1.4));
  // qozon halqasi
  pipe([[BX - .3, .9, BZ + .3], [BX - .3, .6, BZ + .9], [HX - .45, .6, EZ - .3], [HX - .45, .78, EZ - .4]], .055, 'hot', [5], 1.3);
  pipe([[HX + .45, .78, EZ - .4], [HX + .45, 1.1, EZ - .9], [BX + .3, 1.2, BZ + .9], [BX + .3, 1.2, BZ + .3]], .055, 'hot', [5], 1.3);

  // forsunka oqimi: zarralar o'ng devordan basseynga otiladi, sekinlashib pufakchaga aylanadi
  const spN = small ? 120 : 260, spPos = new Float32Array(spN * 3), spV = new Float32Array(spN * 3), spAge = new Float32Array(spN);
  const respawn = (i) => { const j = JETS[i % 3]; spPos[i * 3] = j.x - .1; spPos[i * 3 + 1] = j.y; spPos[i * 3 + 2] = j.z; spV[i * 3] = -(2.2 + rnd() * 1.6); spV[i * 3 + 1] = (rnd() - .5) * .35; spV[i * 3 + 2] = (rnd() - .5) * .5; spAge[i] = 0; };
  for (let i = 0; i < spN; i++) { respawn(i); spAge[i] = rnd() * 2; }
  const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  scene.add(new THREE.Points(spGeo, new THREE.PointsMaterial({ map: dotTex, size: .09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xd8fbff, opacity: .8 })));

  // ── qadamlar: kamera (pozitsiya, nishon) va yorliq nuqtalari
  const TAGS = {
    1: V(SK.x, PY + WH + .3, PZ1 + .2), 2: V(DR.x + .4, WTOP + .05, DR.z - .6), 3: V(PUX + .8, 1.45, EZ), 4: V(FX, FTOP + .5, EZ),
    5: V(HX, 1.45, EZ), 6: V(DX, 1.85, EZ), 7: V(JETS[1].x - .6, JETS[1].y + .35, JETS[1].z), 8: V(LT.x, LT.y + .5, LT.z + .25)
  };
  const STEPS = [
    { pos: V(1.2, 7.8, 11.2), t: V(.6, .7, -3.9) },
    { pos: V(-2.2, 4.6, 2.2), t: V(-4.3, 1.6, -4.2) },
    { pos: V(1.6, 7.6, -1.4), t: V(0, .6, -7.2) },
    { pos: V(-1.9, 2.6, 4.0), t: V(-3.4, .8, -.6) },
    { pos: V(1.4, 3.0, 4.9), t: V(-.5, 1.25, -.6) },
    { pos: V(3.6, 2.3, 3.4), t: V(2.6, .9, -.9) },
    { pos: V(6.6, 2.4, 3.2), t: V(5.6, 1.0, -.6) },
    { pos: V(1.4, 5.2, -1.6), t: V(3.6, 1.2, -7.2) },
    { pos: V(-.6, 5.4, 5.6), t: V(-1.6, .6, -7.4) }
  ];
  const N = STEPS.length;

  // HTML yorliqlar (matni sahifada — tarjima qilinadi)
  const tagEls = {};
  stage.querySelectorAll('[data-tag]').forEach((el) => {
    tagEls[el.dataset.tag] = el;
    el.addEventListener('click', () => { if (opts.onPick) opts.onPick(+el.dataset.tag); });
  });
  const tagWrap = stage.querySelector('[data-eq-tags]');
  if (tagWrap) tagWrap.classList.add('is-on');

  const camPos = V(0, 0, 0), camT = V(0, 0, 0), tmp = V(0, 0, 0);
  const ease = (x) => x * x * (3 - 2 * x);
  let target = 0, prog = 0, mx = 0, my = 0, tmx = 0, tmy = 0, visible = true, looping = false, last = 0, lastScr = 0, W = 1, H = 1, prevCur = -1;
  const t0 = performance.now();
  stage.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; const r = stage.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width - .5; tmy = (e.clientY - r.top) / r.height - .5; }, { passive: true });
  // tik ekranda kamera uzoqlashadi (sahna eniga sig'adi) va kadr yuqoriga suriladi (pastda matn kartasi)
  let fit = 1;
  const size = () => {
    W = stage.clientWidth; H = stage.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H;
    const a = W / H; fit = a < 1.1 ? Math.min(2.1, Math.max(1, .82 / a)) : 1;
    if (a < 1.1) camera.setViewOffset(W, H, 0, H * .11, W, H); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  size();

  const render = (now) => {
    const t = (now - t0) / 1000, dt = Math.min(.05, last ? (now - last) / 1000 : .016);
    prog += (target - prog) * (reduce ? 1 : 1 - Math.exp(-dt * 4.2));
    const kd = 1 - Math.exp(-dt * 3); mx += (tmx - mx) * kd; my += (tmy - my) * kd;
    const f = prog * (N - 1), i = Math.min(N - 2, Math.floor(f)), k = ease(Math.min(1, Math.max(0, (f - i - .12) / .76)));
    camPos.lerpVectors(STEPS[i].pos, STEPS[i + 1].pos, k); camT.lerpVectors(STEPS[i].t, STEPS[i + 1].t, k);
    if (fit !== 1) camPos.sub(camT).multiplyScalar(fit).add(camT);
    camera.position.set(camPos.x + mx * 1.2, camPos.y - my * .7, camPos.z);
    camera.lookAt(camT);
    const cur = Math.round(f), all = cur === 0 || cur === N - 1;
    pipes.forEach((p) => {
      const on = all ? .7 : (p.steps.includes(cur) ? 1.25 : .22);
      p.on.value += (on - p.on.value) * .08;
      p.core.uniforms.uTime.value = t;
    });
    waterMat.uniforms.uTime.value = t; waterMat.uniforms.uCam.value.copy(camera.position);
    floorMat.uniforms.uTime.value = t;
    heatMat.uniforms.uTime.value = t; heatMat.uniforms.uOn.value += ((cur === 5 ? 1 : .35) - heatMat.uniforms.uOn.value) * .06;
    hxLight.intensity = .6 + heatMat.uniforms.uOn.value * 1.6;
    const lightOn = cur === 8 ? 1.6 : 1;
    poolLed.intensity += (9 * lightOn - poolLed.intensity) * .06; floorMat.uniforms.uLight.value = poolLed.intensity / 9;
    lampGlow.material.opacity = .65 + .12 * Math.sin(t * 2.2) + (lightOn - 1) * .4;
    const gs = 2.4 + (lightOn - 1) * 3.2; lampGlow.scale.x += (gs - lampGlow.scale.x) * .08; lampGlow.scale.y = lampGlow.scale.x;
    drainRing.material.color.setHSL(.74, .9, .62 + .12 * Math.sin(t * 3));
    flame.material.color.setHSL(.06 + .02 * Math.sin(t * 7), 1, .5 + .08 * Math.sin(t * 11));
    needle.rotation.z = -.6 + Math.sin(t * .8) * .06;
    cans.forEach((c, ci) => { c.material.emissiveIntensity = .25 + (cur === 6 ? .35 + .2 * Math.sin(t * 4 + ci) : 0); });
    if (t - lastScr > 2.5) { lastScr = t; drawScreen((7.2 + Math.sin(t * .37) * .08).toFixed(1), (1.2 + Math.sin(t * .29) * .15).toFixed(1)); }
    winMat.uniforms.uTime.value = t; winMat.uniforms.uOn.value += ((cur === 4 ? 1 : .3) - winMat.uniforms.uOn.value) * .06;
    // forsunka zarralari
    const sp = cur === 7 ? 1.4 : 1;
    for (let n = 0; n < spN; n++) {
      spAge[n] += dt;
      spV[n * 3] *= 1 - dt * 1.4; spV[n * 3 + 1] += dt * (Math.abs(spV[n * 3]) < .8 ? .9 : .05);
      spPos[n * 3] += spV[n * 3] * dt * sp; spPos[n * 3 + 1] = Math.min(WTOP - .03, spPos[n * 3 + 1] + spV[n * 3 + 1] * dt); spPos[n * 3 + 2] += spV[n * 3 + 2] * dt;
      if (spAge[n] > 2.4 || spPos[n * 3] < PX0 + .6) respawn(n);
    }
    spGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    // yorliqlarni ekranga proyeksiya
    for (const id in tagEls) {
      tmp.copy(TAGS[id]).project(camera);
      const el = tagEls[id], vis = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
      el.style.transform = `translate(${((tmp.x + 1) / 2 * W).toFixed(1)}px,${((1 - tmp.y) / 2 * H).toFixed(1)}px)`;
      if (cur !== prevCur) el.classList.toggle('is-cur', +id === cur);
      el.classList.toggle('is-hide', !vis);
    }
    prevCur = cur;
    last = now;
  };
  const tick = (now) => {
    if (!visible || document.hidden) { looping = false; last = 0; return; }
    requestAnimationFrame(tick);
    if (last && now - last < (small ? 30 : 15)) return;
    render(now);
  };
  const go = () => { if (reduce) { render(performance.now()); return; } if (!looping && visible && !document.hidden) { looping = true; requestAnimationFrame(tick); } };
  addEventListener('resize', () => { size(); go(); });
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; go(); }).observe(stage);
  document.addEventListener('visibilitychange', go);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); visible = false; if (tagWrap) tagWrap.classList.remove('is-on'); if (opts.onLost) opts.onLost(); });
  stage.prepend(canvas);
  render(performance.now());
  go();
  return { setProgress(p) { target = p; if (reduce) go(); }, steps: N };
}
