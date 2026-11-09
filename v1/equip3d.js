/* Muhandislik: basseyn texnik xonasi 3D. Haqiqiy qurilmalar ketma-ketligi (skimmer → prefiltr+nasos → qum filtri →
   issiqlik almashtirgich (+qozon halqasi) → UV → dozalash → basseynga qaytish) quvurlar bilan ulangan, quvurlar
   ichida oqim yuradi. Scroll kamerani qurilmadan qurilmaga olib boradi, joriy qadam quvuri yonadi. */
export async function mountEquip(stage, opts) {
  const THREE = await import('./vendor/three.module.min.js');
  const { RoomEnvironment } = await import('./vendor/RoomEnvironment.js');
  const reduce = opts.reduce, small = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
  const canvas = document.createElement('canvas');
  canvas.className = 'hv-eq__gl';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no gl');
  renderer.debug.checkShaderErrors = false;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1418);
  scene.fog = new THREE.Fog(0x0b1418, 22, 55);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = .45;
  const camera = new THREE.PerspectiveCamera(small ? 60 : 42, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xcfe6ee, 0x0d0b09, .5));
  const sun = new THREE.DirectionalLight(0xffffff, .9); sun.position.set(6, 14, 10); scene.add(sun);

  const M = {
    steel: new THREE.MeshStandardMaterial({ color: 0xd9dde0, metalness: .95, roughness: .22 }),
    pvc: new THREE.MeshStandardMaterial({ color: 0x4b5559, metalness: .1, roughness: .55 }),
    black: new THREE.MeshStandardMaterial({ color: 0x1d2225, metalness: .4, roughness: .45 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x2c55a0, metalness: .6, roughness: .35 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xc27a4a, metalness: .95, roughness: .3 }),
    panel: new THREE.MeshStandardMaterial({ color: 0xe3e5e2, metalness: .3, roughness: .5 }),
    clear: new THREE.MeshPhysicalMaterial({ color: 0xbfe9f2, metalness: 0, roughness: .05, transmission: .85, transparent: true, opacity: .55, thickness: .2 }),
    canBlue: new THREE.MeshStandardMaterial({ color: 0x3d8fc9, roughness: .6 }),
    canWhite: new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: .6 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x1f272a, metalness: .3, roughness: .32 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x262e31, roughness: .85 }),
    tile: new THREE.MeshStandardMaterial({ color: 0x1f6f8f, roughness: .3, metalness: .1 })
  };
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); scene.add(m); return m; };
  const cyl = (r, h, s = 32) => new THREE.CylinderGeometry(r, r, h, s);

  // xona
  add(new THREE.PlaneGeometry(60, 30), M.floor, 4, 0, 0, -Math.PI / 2);
  add(new THREE.PlaneGeometry(60, 12), M.wall, 4, 6, -6.2);
  // basseyn bo'lagi (kesim)
  add(new THREE.BoxGeometry(8, 1.4, 9), M.tile, -11, .7, -.5);
  const waterMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: [
      'uniform float uTime;varying vec2 vUv;',
      'float c(vec2 p){float v=0.;for(int i=0;i<3;i++){float f=float(i);p+=vec2(sin(p.y*1.3+uTime*.7+f),cos(p.x*1.1-uTime*.6+f*2.))*.45;v+=abs(sin(p.x*2.)+sin(p.y*2.));}return v/3.;}',
      'void main(){float k=pow(1.-clamp(c(vUv*vec2(6.,7.))*.5,0.,1.),5.);vec3 col=mix(vec3(.03,.25,.32),vec3(.15,.6,.68),vUv.y)+vec3(.7,1.,1.)*k*.6;gl_FragColor=vec4(col,1.);',
      '#include <colorspace_fragment>',
      '}'
    ].join('\n')
  });
  add(new THREE.PlaneGeometry(7.6, 8.6), waterMat, -11, 1.41, -.5, -Math.PI / 2);
  add(new THREE.BoxGeometry(.5, .35, .7), M.panel, -6.9, 1.2, -2); // skimmer qopqog'i

  // nasos: prefiltr (shaffof) + korpus + dvigatel
  add(cyl(.38, .9), M.clear, 0, .75, -2);
  add(cyl(.18, .6), M.pvc, 0, .7, -2); // savat
  add(cyl(.42, .12), M.black, 0, 1.25, -2);
  add(new THREE.SphereGeometry(.45, 24, 16), M.black, .7, .6, -2);
  add(cyl(.4, 1.2), M.black, 1.5, .6, -2, 0, 0, Math.PI / 2);
  for (let i = 0; i < 10; i++) add(new THREE.BoxGeometry(1.1, .04, .9), M.black, 1.55, .25 + i * .07, -2).scale.set(1, 1, 1);
  add(new THREE.BoxGeometry(2.4, .12, 1.2), M.steel, .9, .06, -2);

  // qum filtri
  add(cyl(1, 2.2, 48), M.steel, 4, 1.65, -2);
  add(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.steel, 4, 2.75, -2);
  add(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.steel, 4, .55, -2);
  [[-.6, -.6], [.6, -.6], [-.6, .6], [.6, .6]].forEach((p) => add(cyl(.06, .5), M.steel, 4 + p[0], .25, -2 + p[1]));
  add(cyl(.32, .3), M.black, 4, 3.85, -2); // 6 yo'lli klapan
  add(new THREE.BoxGeometry(.08, .08, .7), M.black, 4, 4.05, -2).rotation.y = .6;
  add(cyl(.17, .06), M.panel, 4.45, 3.4, -1.15, Math.PI / 2); // manometr
  add(new THREE.TorusGeometry(.32, .05, 12, 40), M.steel, 4, 1.6, -1.02); // lyuk

  // issiqlik almashtirgich (plastinali) + qozon
  add(new THREE.BoxGeometry(.25, 1.5, 1.1), M.blue, 7.4, .95, -2);
  add(new THREE.BoxGeometry(.25, 1.5, 1.1), M.blue, 8.6, .95, -2);
  const plates = new THREE.InstancedMesh(new THREE.BoxGeometry(.03, 1.3, 1), M.steel, 26);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 26; i++) { m4.makeTranslation(7.55 + i * .036, .95, -2); plates.setMatrixAt(i, m4); }
  scene.add(plates);
  [[-.4, .55], [.4, .55], [-.4, 1.35], [.4, 1.35]].forEach((p) => add(cyl(.03, 1.5, 8), M.steel, 8, p[1], -2 + p[0], 0, 0, Math.PI / 2));
  add(new THREE.BoxGeometry(1.3, 1.9, .7), M.panel, 8, 2.4, -5.7); // qozon
  add(new THREE.PlaneGeometry(.5, .3), new THREE.MeshBasicMaterial({ color: 0x77d9ee }), 8, 2.9, -5.34);

  // UV
  add(cyl(.17, 1.5), M.steel, 11, 1.2, -2, 0, 0, Math.PI / 2);
  const uvGlow = add(cyl(.05, 1.3, 12), new THREE.MeshBasicMaterial({ color: 0xbff4ff }), 11, 1.43, -2, 0, 0, Math.PI / 2);
  // dozalash: devor paneli, 2 nasos, 2 kanistra
  add(new THREE.BoxGeometry(1.8, 1.4, .08), M.panel, 13.6, 2.2, -6.1);
  [13.1, 14.1].forEach((x, i) => {
    add(new THREE.BoxGeometry(.5, .5, .3), M.black, x, 2.2, -5.9);
    add(new THREE.BoxGeometry(.55, .9, .4), i ? M.canBlue : M.canWhite, x, .45, -5.2);
    add(cyl(.09, .12), M.black, x, .96, -5.2);
  });
  // boshqaruv shiti
  add(new THREE.BoxGeometry(2.2, 1.7, .4), M.panel, 4, 3.6, -6);
  const screen = add(new THREE.PlaneGeometry(.9, .55), new THREE.MeshBasicMaterial({ color: 0x2a9fc0 }), 4.4, 3.8, -5.79);
  [-.6, -.3].forEach((x) => add(cyl(.07, .05), new THREE.MeshBasicMaterial({ color: 0x6fe3a0 }), 4 + x, 3.5, -5.78, Math.PI / 2));

  // quvurlar: oqim shaderi
  const pipes = [];
  const pipe = (pts, r, kind, step) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', .05);
    const len = curve.getLength();
    const geo = new THREE.TubeGeometry(curve, Math.max(24, Math.round(len * 10)), r, 14, false);
    const col = { cold: 0x5fd7ee, hot: 0xff8a3c, chem: 0xf3d36b, ret: 0x8ef0ff }[kind];
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uLen: { value: len }, uC: { value: new THREE.Color(col) }, uOn: { value: 0 } },
      vertexShader: 'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader: [
        'uniform float uTime;uniform float uLen;uniform vec3 uC;uniform float uOn;varying vec2 vUv;varying vec3 vN;varying vec3 vV;',
        'void main(){float l=max(dot(vN,normalize(vec3(.3,.8,.5))),0.);vec3 base=vec3(.20,.23,.25)*(.45+.7*l)+pow(1.-abs(dot(vN,vV)),3.)*.15;',
        ' float s=fract(vUv.x*uLen/.55-uTime*(1.2+uOn));float dash=smoothstep(.0,.15,s)*smoothstep(.6,.35,s);',
        ' vec3 c=base+uC*dash*(.25+.95*uOn)+uC*.12*uOn;gl_FragColor=vec4(c,1.);',
        '#include <colorspace_fragment>',
        '}'
      ].join('\n')
    });
    const m = new THREE.Mesh(geo, mat); scene.add(m);
    pipes.push({ m, mat, step });
  };
  pipe([[-6.9, 1.05, -2], [-5, 1.05, -2], [-4, .4, -2], [-.45, .4, -2]], .11, 'cold', 1);
  pipe([[0, 1.3, -2], [0, 1.75, -2], [1.5, 1.75, -2], [3, 1.75, -2]], .11, 'cold', 2);
  pipe([[4, 4.0, -2.5], [4, 4.3, -3.2], [5.6, 4.1, -3.2], [6.2, .55, -2.6], [7.3, .55, -2.4]], .1, 'cold', 3);
  pipe([[8.7, 1.35, -1.6], [9.5, 1.35, -1.6], [9.8, 1.2, -2], [10.25, 1.2, -2]], .1, 'ret', 4);
  pipe([[8.7, 1.35, -2.4], [8.9, 2.2, -4.2], [8.3, 2.0, -5.3]], .07, 'hot', 4);
  pipe([[8.7, .55, -2.4], [9.1, 1.0, -4.4], [7.7, 1.8, -5.3]], .07, 'hot', 4);
  pipe([[11.75, 1.2, -2], [13.6, 1.2, -2], [14.6, .45, -1], [14.6, .45, 1.3], [-6.5, .45, 1.3], [-6.9, 1.0, 1.3]], .11, 'ret', 5);
  pipe([[13.1, 1.0, -5.2], [13.1, 1.95, -5.75], [13.3, 1.2, -2.4], [13.4, 1.2, -2.05]], .035, 'chem', 5);
  pipe([[14.1, 1.0, -5.2], [14.1, 1.95, -5.75], [13.8, 1.2, -2.4], [13.7, 1.2, -2.05]], .035, 'chem', 5);
  pipe([[4, 2.75, -5.8], [2.2, 2.4, -5.8], [1.2, 1.0, -2.6]], .03, 'chem', 6);
  pipe([[4.8, 2.75, -5.8], [12, 2.7, -5.9], [13.6, 2.6, -6]], .03, 'chem', 6);

  // qadamlar: kamera kadrlari
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const STEPS = [
    { pos: V(3, 8.5, 15), t: V(2.5, 1.2, -2.5) },
    { pos: V(-8.5, 4.2, 5.5), t: V(-6, .9, -1.5) },
    { pos: V(.6, 2.6, 3.4), t: V(.7, .8, -2) },
    { pos: V(4.3, 3.4, 4.6), t: V(4, 1.9, -2) },
    { pos: V(9.2, 3.2, 3.2), t: V(8.1, 1.3, -3.2) },
    { pos: V(12.6, 2.9, 3.4), t: V(12.8, 1.4, -3.4) },
    { pos: V(4.6, 3.6, 1.4), t: V(4, 3.4, -6) },
    { pos: V(-2, 5.5, 9), t: V(-9, .8, -.5) }
  ];
  const N = STEPS.length;
  const camPos = V(0, 0, 0), camT = V(0, 0, 0);
  const ease = (x) => x * x * (3 - 2 * x);
  let target = 0, prog = 0, mx = 0, my = 0, tmx = 0, tmy = 0, visible = true, looping = false, last = 0;
  const t0 = performance.now();
  stage.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; const r = stage.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width - .5; tmy = (e.clientY - r.top) / r.height - .5; }, { passive: true });
  const size = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  size(); addEventListener('resize', () => { size(); go(); });

  const render = (now) => {
    const t = (now - t0) / 1000;
    prog += (target - prog) * (reduce ? 1 : .07);
    mx += (tmx - mx) * .05; my += (tmy - my) * .05;
    const f = prog * (N - 1), i = Math.min(N - 2, Math.floor(f)), k = ease(Math.min(1, Math.max(0, (f - i - .15) / .7)));
    camPos.lerpVectors(STEPS[i].pos, STEPS[i + 1].pos, k); camT.lerpVectors(STEPS[i].t, STEPS[i + 1].t, k);
    camera.position.set(camPos.x + mx * 1.4, camPos.y - my * .8, camPos.z);
    camera.lookAt(camT);
    const cur = Math.round(f);
    pipes.forEach((p) => { p.mat.uniforms.uTime.value = t; const on = cur === 0 || cur === 7 ? .6 : (p.step === cur ? 1 : (p.step < cur ? .35 : .08)); p.mat.uniforms.uOn.value += (on - p.mat.uniforms.uOn.value) * .08; });
    waterMat.uniforms.uTime.value = t;
    uvGlow.material.color.setScalar(.75 + .25 * Math.sin(t * 9) * Math.sin(t * 3.7));
    screen.material.color.setHSL(.53, .6, .35 + .08 * Math.sin(t * 2));
    renderer.render(scene, camera);
    if (opts.onStep) opts.onStep(cur);
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
  return { setProgress(p) { target = p; if (reduce) go(); }, steps: N };
}
