/* "Halvet nima" — 3D gumbaz. Haqiqiy gumbaz surati yarim sharga (yuqoridan ortografik) proyeksiya qilinadi,
   suratdagi yorug' teshiklar topilib ulardan hajmli nur ustunlari tushadi, ichida bug' zarralari suzadi.
   Sichqoncha kamerani egadi, scroll gumbazni aylantiradi. three faqat shu modul kerak bo'lganda yuklanadi. */
export async function mountDome(fig, img, opts) {
  const THREE = await import('./vendor/three.module.min.js');
  const reduce = opts.reduce;
  const W = () => fig.clientWidth, H = () => fig.clientHeight;
  const canvas = document.createElement('canvas');
  canvas.className = 'hv-dome__gl';
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!renderer.getContext()) throw new Error('no gl');
  renderer.debug.checkShaderErrors = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(W(), H(), false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(78, 1, 0.1, 100);
  camera.position.set(0, -3.2, 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 10, 0);

  // tekstura: o'sha surat
  const tex = await new THREE.TextureLoader().loadAsync(img.currentSrc || img.src);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const R = 10;
  const domeGeo = new THREE.SphereGeometry(R, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { map: { value: tex }, uTime: { value: 0 } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: [
      'uniform sampler2D map;uniform float uTime;varying vec3 vP;',
      'void main(){vec2 uv=vec2(.5)+vec2(vP.x,-vP.z)*.5;vec3 c=texture2D(map,uv).rgb;',
      ' float rim=smoothstep(0.,.35,vP.y);c*=.35+.65*rim;',
      ' float l=dot(c,vec3(.299,.587,.114));c+=c*smoothstep(.7,1.,l)*(.25+.15*sin(uTime*1.3+vP.x*9.+vP.z*7.));',
      ' gl_FragColor=vec4(c,1.);',
      '#include <colorspace_fragment>',
      '}'
    ].join('\n')
  });
  const group = new THREE.Group();
  scene.add(group);
  group.add(new THREE.Mesh(domeGeo, domeMat));

  // suratdagi yorug' teshiklarni topish (64x64 yorqinlik, lokal maksimumlar)
  const S = 96, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(tex.image, 0, 0, S, S);
  const px = cx.getImageData(0, 0, S, S).data, L = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) L[i] = (px[i * 4] * .3 + px[i * 4 + 1] * .59 + px[i * 4 + 2] * .11) / 255;
  const holes = [];
  for (let y = 2; y < S - 2; y++) for (let x = 2; x < S - 2; x++) {
    const v = L[y * S + x]; if (v < .78) continue;
    let max = true;
    for (let dy = -2; dy <= 2 && max; dy++) for (let dx = -2; dx <= 2; dx++) if ((dx || dy) && L[(y + dy) * S + x + dx] > v) { max = false; break; }
    if (!max) continue;
    const u = x / S * 2 - 1, w = y / S * 2 - 1, r2 = u * u + w * w;
    if (r2 > .92) continue;
    holes.push({ x: u, z: w, y: Math.sqrt(1 - r2), v });
  }
  holes.sort((a, b) => b.v - a.v);
  const H2 = holes.slice(0, 70);

  // nur ustunlari: konus, pastga tomon kengayadi va so'nadi; har biri o'z ritmida "nafas oladi"
  const beamGeo = new THREE.CylinderGeometry(0.12, 1.25, 1, 20, 1, true);
  beamGeo.translate(0, -0.5, 0);
  const phase = new Float32Array(H2.length);
  for (let i = 0; i < H2.length; i++) phase[i] = Math.random() * 6.28;
  beamGeo.setAttribute('aPh', new THREE.InstancedBufferAttribute(phase, 1));
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: 'attribute float aPh;varying float vA;varying float vPh;varying vec3 vN;varying vec3 vV;void main(){vA=-position.y;vPh=aPh;vec4 wp=modelMatrix*instanceMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix*instanceMatrix)*normal);vV=normalize(cameraPosition-wp.xyz);gl_Position=projectionMatrix*viewMatrix*wp;}',
    fragmentShader: 'uniform float uTime;varying float vA;varying float vPh;varying vec3 vN;varying vec3 vV;void main(){float edge=pow(abs(dot(vN,vV)),1.6);float fade=smoothstep(0.,.08,vA)*(1.-smoothstep(.15,1.,vA));float br=.55+.45*sin(uTime*.7+vPh);float a=edge*fade*br*.28;gl_FragColor=vec4(vec3(1.,.9,.74)*a,a);}'
  });
  const beams = new THREE.InstancedMesh(beamGeo, beamMat, H2.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), down = new THREE.Vector3(0, -1, 0);
  H2.forEach((h, i) => {
    const from = new THREE.Vector3(h.x, h.y, h.z).multiplyScalar(R * .985);
    const to = new THREE.Vector3(h.x * 2.5, -9, h.z * 2.5);
    const dir = to.clone().sub(from); const len = dir.length(); dir.normalize();
    q.setFromUnitVectors(down, dir);
    const s = .6 + h.v * .6;
    m4.compose(from, q, new THREE.Vector3(s, len, s));
    beams.setMatrixAt(i, m4);
  });
  group.add(beams);

  // bug' zarralari
  const NP = matchMedia('(pointer: coarse)').matches ? 260 : 520;
  const pos = new Float32Array(NP * 3), seed = new Float32Array(NP);
  for (let i = 0; i < NP; i++) {
    const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 8;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = -3 + Math.random() * 11; pos[i * 3 + 2] = Math.sin(a) * r; seed[i] = Math.random();
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('aS', new THREE.BufferAttribute(seed, 1));
  const pm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: 'attribute float aS;uniform float uTime;uniform float uPx;varying float vA;void main(){vec3 p=position;float t=uTime*(.15+aS*.25);p.y=mod(p.y+t+3.,11.)-3.;p.x+=sin(t*1.7+aS*20.)*.6;p.z+=cos(t*1.3+aS*14.)*.6;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(40.+aS*80.)*uPx/-mv.z;vA=smoothstep(-3.,0.,p.y)*(1.-smoothstep(5.,8.,p.y))*(.25+aS*.35);}',
    fragmentShader: 'varying float vA;void main(){vec2 c=gl_PointCoord-.5;float d=dot(c,c);float a=smoothstep(.25,0.,d)*vA;gl_FragColor=vec4(vec3(1.,.95,.88)*a,a);}'
  });
  group.add(new THREE.Points(pg, pm));

  // interaktivlik
  let tx = 0, ty = 0, cxp = 0, cyp = 0, rot = 0, tRot = 0, visible = true, looping = false, last = 0;
  const t0 = performance.now();
  fig.addEventListener('pointermove', (e) => {
    const r = fig.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = ((e.clientY - r.top) / r.height - .5) * 2;
  }, { passive: true });
  fig.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

  const look = new THREE.Vector3();
  const render = (now) => {
    const t = (now - t0) / 1000;
    cxp += (tx - cxp) * .05; cyp += (ty - cyp) * .05; rot += (tRot - rot) * .06;
    group.rotation.y = rot + (reduce ? 0 : t * .03);
    look.set(cxp * 4.2, 10, cyp * 4.2);
    camera.position.set(-cxp * 1.2, -3.2, -cyp * 1.2);
    camera.lookAt(look);
    domeMat.uniforms.uTime.value = beamMat.uniforms.uTime.value = pm.uniforms.uTime.value = t;
    renderer.render(scene, camera);
  };
  const tick = (now) => {
    if (!visible || document.hidden) { looping = false; return; }
    requestAnimationFrame(tick);
    if (now - last < 16) return;
    last = now; render(now);
  };
  const go = () => { if (reduce) { render(performance.now()); return; } if (!looping && visible && !document.hidden) { looping = true; requestAnimationFrame(tick); } };
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; go(); }).observe(fig);
  document.addEventListener('visibilitychange', go);
  window.addEventListener('resize', () => { renderer.setSize(W(), H(), false); camera.aspect = W() / H(); camera.updateProjectionMatrix(); go(); });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); visible = false; fig.classList.remove('is-3d'); canvas.remove(); });

  camera.aspect = W() / H(); camera.updateProjectionMatrix();
  fig.appendChild(canvas);
  render(performance.now());
  requestAnimationFrame(() => fig.classList.add('is-3d'));
  go();
  return { setScroll(p) { tRot = p * 1.6; if (reduce) go(); } };
}
