/* Makonlar: scroll bilan boshqariladigan 3D kamera parvozi. Uchta tosh arka-portal (hammom, sauna, basseyn),
   ichida haqiqiy surat; har birining o'z muhiti: bug', cho'g' uchqunlari, suv yuzasi va kaustika. */
export async function mountSpaces(stage, opts) {
  const THREE = await import('./vendor/three.module.min.js');
  const reduce = opts.reduce, small = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
  const canvas = document.createElement('canvas');
  canvas.className = 'hv-fly__gl';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: false, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no gl');
  renderer.debug.checkShaderErrors = false;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const bg = new THREE.Color(0x0d1113);
  scene.background = bg;
  scene.fog = new THREE.FogExp2(0x0d1113, 0.022);
  const camera = new THREE.PerspectiveCamera(small ? 62 : 50, 1, 0.1, 400);

  scene.add(new THREE.HemisphereLight(0xffe9d2, 0x1a1410, 0.55));
  const key = new THREE.DirectionalLight(0xffe2c0, 0.7); key.position.set(10, 30, 20); scene.add(key);

  // pol: qorong'i tosh, portallar ostida rangli yorug'lik dog'lari (shader)
  const floorMat = new THREE.ShaderMaterial({
    uniforms: { uL: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, uC: { value: [new THREE.Color(0xffd7a8), new THREE.Color(0xff8a3c), new THREE.Color(0x3ec9e6)] }, uFog: { value: bg } },
    vertexShader: 'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: [
      'uniform vec3 uL[3];uniform vec3 uC[3];uniform vec3 uFog;varying vec3 vW;',
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}',
      'void main(){vec2 g=abs(fract(vW.xz/3.)-.5);float grid=smoothstep(.49,.5,max(g.x,g.y))*.05;',
      ' vec3 c=vec3(.055,.06,.062)+grid+h(floor(vW.xz*4.))*.012;',
      ' for(int i=0;i<3;i++){float d=length(vW.xz-uL[i].xz);c+=uC[i]*exp(-d*d*.018)*.38;}',
      ' float f=1.-exp(-pow(length(vW-cameraPosition)*.022,2.));gl_FragColor=vec4(mix(c,uFog,f),1.);',
      '#include <colorspace_fragment>',
      '}'
    ].join('\n')
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), floorMat);
  floor.rotation.x = -Math.PI / 2; scene.add(floor);

  const loader = new THREE.TextureLoader();
  const load = (u) => loader.loadAsync(u).then((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; });
  const W = small ? 640 : 1024;
  const [tH, tS, tB] = await Promise.all([load(`img/kurna-${W}.webp`), load(`img/sauna-${W}.webp`), load(`img/basseyn-${W}.webp`)]);

  // arka shakli: to'g'ri to'rtburchak + yarim doira tepa
  const arch = (w, h, x0 = 0, y0 = 0) => {
    const s = new THREE.Shape(), r = w / 2;
    s.moveTo(x0 - r, y0); s.lineTo(x0 + r, y0); s.lineTo(x0 + r, y0 + h); s.absarc(x0, y0 + h, r, 0, Math.PI, false); s.lineTo(x0 - r, y0);
    return s;
  };
  const IW = 9, IH = 8, T = 1.3; // ichki eni, to'g'ri qism balandligi, ramka qalinligi
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xcdbca4, roughness: .85, metalness: 0 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xb9794a, roughness: .35, metalness: .7 });

  const photoMat = (tex) => new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, uTime: { value: 0 }, uLit: { value: 0 } },
    vertexShader: 'varying vec2 vUv;varying vec3 vV;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: [
      'uniform sampler2D map;uniform float uTime;uniform float uLit;varying vec2 vUv;varying vec3 vV;',
      'void main(){vec2 uv=vUv+vV.xy*.025;vec3 c=texture2D(map,uv).rgb;',
      ' float v=smoothstep(.95,.35,length(vUv-vec2(.5,.45)));c*=mix(.35,1.05,v)*(.55+.45*uLit);',
      ' gl_FragColor=vec4(c,1.);',
      '#include <colorspace_fragment>',
      '}'
    ].join('\n')
  });

  // zarralar: 0 bug', 1 cho'g', 2 pufak/kaustika uchqunlari
  const particles = (kind, n, color) => {
    const pos = new Float32Array(n * 3), sd = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 14; pos[i * 3 + 1] = Math.random() * 14; pos[i * 3 + 2] = 1 + Math.random() * 9; sd[i] = Math.random(); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sd, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uK: { value: kind }, uC: { value: new THREE.Color(color) }, uPx: { value: renderer.getPixelRatio() }, uLit: { value: 0 } },
      vertexShader: [
        'attribute float aS;uniform float uTime;uniform float uK;uniform float uPx;varying float vA;',
        'void main(){vec3 p=position;float sp=uK<.5?.35:(uK<1.5?1.6:.7);float t=uTime*sp*(.4+aS);',
        ' p.y=mod(p.y+t,14.);p.x+=sin(t*.9+aS*30.)*(uK<.5?1.2:.35);p.z+=cos(t*.7+aS*17.)*.4;',
        ' vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;',
        ' float sz=uK<.5?(120.+aS*220.):(uK<1.5?(10.+aS*16.):(8.+aS*14.));gl_PointSize=sz*uPx/-mv.z;',
        ' float life=smoothstep(0.,2.,p.y)*(1.-smoothstep(9.,14.,p.y));',
        ' vA=life*(uK<.5?.10:(uK<1.5?(.6+.4*sin(uTime*12.+aS*40.)):.55));}'
      ].join('\n'),
      fragmentShader: 'uniform vec3 uC;uniform float uLit;varying float vA;void main(){vec2 c=gl_PointCoord-.5;float d=dot(c,c);float a=smoothstep(.25,0.,d)*vA*uLit;gl_FragColor=vec4(uC*a,a);}'
    });
    return new THREE.Points(g, m);
  };

  // basseyn suvi: chuqur firuza, kaustika to'ri, fresnel
  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 }, uLit: { value: 0 } },
    vertexShader: 'varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: [
      'uniform float uTime;uniform float uLit;varying vec2 vUv;varying vec3 vW;',
      'float c(vec2 p){float v=0.;for(int i=0;i<3;i++){float fi=float(i);p+=vec2(sin(p.y*1.3+uTime*.6+fi),cos(p.x*1.1-uTime*.5+fi*2.))*.45;v+=abs(sin(p.x*2.)+sin(p.y*2.));}return v/3.;}',
      'void main(){vec2 p=vUv*vec2(9.,7.);float k=pow(1.-clamp(c(p)*.5,0.,1.),5.);',
      ' vec3 deep=vec3(.02,.17,.22),shal=vec3(.12,.55,.62);vec3 col=mix(deep,shal,vUv.y*.6)+vec3(.65,.95,1.)*k*.55;',
      ' float edge=smoothstep(0.,.04,vUv.x)*smoothstep(1.,.96,vUv.x)*smoothstep(0.,.05,vUv.y)*smoothstep(1.,.95,vUv.y);',
      ' gl_FragColor=vec4(col*(.4+.6*uLit),.92*edge);',
      '#include <colorspace_fragment>',
      '}'
    ].join('\n')
  });

  const mkPortal = (tex, color, kind, n) => {
    const g = new THREE.Group();
    // ramka: tashqi arka minus ichki arka
    const outer = arch(IW + T * 2, IH, 0, 0); outer.holes.push(arch(IW, IH, 0, 0));
    const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: 1.4, bevelEnabled: true, bevelSize: .12, bevelThickness: .12, bevelSegments: 2, curveSegments: 40 }), stoneMat);
    frame.position.z = -.7; g.add(frame);
    const trim = new THREE.Mesh(new THREE.TorusGeometry(IW / 2 + .08, .07, 8, 64, Math.PI), trimMat);
    trim.position.set(0, IH, .75); g.add(trim);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(IW + T * 2 + 1.2, .6, 3), stoneMat); plinth.position.set(0, .3, 0); g.add(plinth);
    // surat: ichki arka shakli, cover uv
    const pg = new THREE.ShapeGeometry(arch(IW, IH, 0, 0), 40);
    const ia = tex.image.width / tex.image.height, sa = IW / (IH + IW / 2);
    const uv = pg.attributes.uv, ps = pg.attributes.position;
    for (let i = 0; i < uv.count; i++) {
      let u = (ps.getX(i) + IW / 2) / IW, v = ps.getY(i) / (IH + IW / 2);
      if (ia > sa) u = .5 + (u - .5) * sa / ia; else v = .5 + (v - .5) * ia / sa;
      uv.setXY(i, u, v);
    }
    const pm = photoMat(tex);
    const photo = new THREE.Mesh(pg, pm); photo.position.z = -.2; g.add(photo);
    const light = new THREE.PointLight(color, 0, 34, 1.6); light.position.set(0, 7, 6); g.add(light);
    const pts = particles(kind, n, color); g.add(pts);
    scene.add(g);
    return { g, pm, light, pts, color };
  };

  const P = [
    mkPortal(tH, 0xffd9b0, 0, small ? 30 : 60),
    mkPortal(tS, 0xff8a3c, 1, small ? 120 : 260),
    mkPortal(tB, 0x6fdcf0, 2, small ? 90 : 180)
  ];
  const water = new THREE.Mesh(new THREE.PlaneGeometry(IW + 4, 9), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.set(0, .62, 5.4); P[2].g.add(water);

  // stansiyalar va kamera yo'li
  const ST = [
    { at: new THREE.Vector3(0, 0, 0), cam: new THREE.Vector3(0, 6.5, 17) },
    { at: new THREE.Vector3(18, 0, -36), cam: new THREE.Vector3(11, 6.5, -19) },
    { at: new THREE.Vector3(-6, 0, -74), cam: new THREE.Vector3(-3, 6.5, -56) }
  ];
  ST.forEach((s, i) => { P[i].g.position.copy(s.at); P[i].g.lookAt(s.cam.x, 0, s.cam.z); floorMat.uniforms.uL.value[i].copy(s.at); });
  const tgt = (i, dy = 7.2) => new THREE.Vector3(ST[i].at.x, dy, ST[i].at.z);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const KEYS = [
    { p: 0, pos: V(0, 10, 52), t: tgt(0, 8) },
    { p: .12, pos: ST[0].cam, t: tgt(0) },
    { p: .28, pos: V(.6, 6.2, 12.5), t: tgt(0, 7) },
    { p: .40, pos: V(8, 7, -6), t: V(14, 7, -26) },
    { p: .50, pos: ST[1].cam, t: tgt(1) },
    { p: .63, pos: V(12.6, 6.2, -23.5), t: tgt(1, 7) },
    { p: .75, pos: V(5, 7, -42), t: V(-3, 7, -62) },
    { p: .86, pos: ST[2].cam, t: tgt(2) },
    { p: 1, pos: V(-3.5, 5.6, -60.5), t: tgt(2, 6.4) }
  ];
  const CH = [[.06, .33], [.42, .68], [.76, 1.01]];
  const ease = (x) => x * x * x * (x * (x * 6 - 15) + 10);
  const camPos = V(0, 0, 0), camT = V(0, 0, 0);
  const sample = (p) => {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[i], b = KEYS[i + 1], k = ease(Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p))));
    camPos.lerpVectors(a.pos, b.pos, k); camT.lerpVectors(a.t, b.t, k);
  };

  let target = 0, prog = 0, mx = 0, my = 0, tmx = 0, tmy = 0, visible = true, looping = false, last = 0;
  const t0 = performance.now();
  stage.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; const r = stage.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width - .5; tmy = (e.clientY - r.top) / r.height - .5; }, { passive: true });

  const size = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  size(); addEventListener('resize', () => { size(); go(); });

  const look = V(0, 0, 0);
  const render = (now) => {
    const t = (now - t0) / 1000;
    prog += (target - prog) * (reduce ? 1 : .08);
    mx += (tmx - mx) * .05; my += (tmy - my) * .05;
    sample(prog);
    camera.position.copy(camPos).add(look.set(mx * 2.2, -my * 1.2, 0));
    camera.lookAt(camT);
    P.forEach((o, i) => {
      const c = CH[i], lit = Math.min(1, Math.max(0, Math.min((prog - c[0] + .1) / .14, (c[1] + .08 - prog) / .12)));
      o.pm.uniforms.uLit.value = .25 + lit * .75;
      o.light.intensity = 40 * (.15 + lit);
      o.pts.material.uniforms.uLit.value = .2 + lit;
      o.pts.material.uniforms.uTime.value = t;
    });
    waterMat.uniforms.uTime.value = t; waterMat.uniforms.uLit.value = P[2].pm.uniforms.uLit.value;
    renderer.render(scene, camera);
  };
  const tick = (now) => {
    if (!visible || document.hidden) { looping = false; return; }
    requestAnimationFrame(tick);
    if (now - last < (small ? 30 : 15)) return;
    last = now; render(now);
  };
  const go = () => { if (reduce) { render(performance.now()); return; } if (!looping && visible && !document.hidden) { looping = true; requestAnimationFrame(tick); } };
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; go(); }).observe(stage);
  document.addEventListener('visibilitychange', go);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); visible = false; if (opts.onLost) opts.onLost(); });

  stage.prepend(canvas);
  render(performance.now());
  go();
  return { setProgress(p) { target = p; if (reduce) go(); }, chapters: CH };
}
