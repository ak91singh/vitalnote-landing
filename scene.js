(function () {
  'use strict';

  function webglSupported() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  if (
    typeof THREE === 'undefined' ||
    !webglSupported() ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) return;

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const hero = canvas.parentElement;
  let W = hero.offsetWidth;
  let H = hero.offsetHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
  camera.position.z = 6;

  // All objects go in a group so cursor tilt applies to everything at once
  const group = new THREE.Group();
  scene.add(group);

  // Particle field
  const N = 700;
  const pPos = new Float32Array(N * 3);
  const pCol = new Float32Array(N * 3);
  const palette = [
    new THREE.Color('#0d8a7c'),
    new THREE.Color('#7C6FE0'),
    new THREE.Color('#1A5490'),
    new THREE.Color('#13b09d'),
  ];
  for (let i = 0; i < N; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 18;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    const c = palette[Math.floor(Math.random() * palette.length)];
    pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true, opacity: 0.5 })
  );
  group.add(particles);

  // Wireframe icosahedron — central
  const ico = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.4, 1),
    new THREE.MeshBasicMaterial({ color: 0x0d8a7c, wireframe: true, transparent: true, opacity: 0.09 })
  );
  group.add(ico);

  // Wireframe torus — offset for depth
  const tor = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.45, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0x7C6FE0, wireframe: true, transparent: true, opacity: 0.07 })
  );
  tor.position.set(3.5, -1.5, -3);
  group.add(tor);

  // ── Cursor / touch tracking ──────────────────────────────────────────────
  // targetX/Y are the raw normalised cursor position (-1 to 1).
  // smoothX/Y are lazily interpolated toward target each frame — this is what
  // actually drives the scene so the motion feels organic, not mechanical.
  let targetX = 0, targetY = 0;
  let smoothX = 0, smoothY = 0;

  function onPointer(clientX, clientY) {
    const rect = hero.getBoundingClientRect();
    // Ignore pointer events below the hero (other page sections)
    if (clientY > rect.bottom) return;
    targetX = ((clientX - rect.left) / rect.width  - 0.5) * 2;
    targetY = ((clientY - rect.top)  / rect.height - 0.5) * 2;
  }

  window.addEventListener('mousemove',  (e) => onPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove',  (e) => {
    if (e.touches.length) onPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  // Gently return toward centre when cursor leaves the window
  document.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });

  // ── Animation loop ───────────────────────────────────────────────────────
  let t = 0;
  let running = true;

  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);
    t += 0.0005;

    // Lerp — 0.05 keeps the follow smooth (~3–4 second full travel)
    smoothX += (targetX - smoothX) * 0.05;
    smoothY += (targetY - smoothY) * 0.05;

    // Continuous self-rotation (time-based)
    particles.rotation.y = t * 0.08;
    particles.rotation.x = t * 0.03;
    ico.rotation.y       = t * 0.12;
    ico.rotation.x       = t * 0.06;
    tor.rotation.x       = t * 0.18;
    tor.rotation.z       = t * 0.08;

    // Cursor tilt on the whole group — subtle, max ~10° of arc
    group.rotation.y = smoothX * 0.18;
    group.rotation.x = -smoothY * 0.12;

    // Camera micro-shift for parallax depth — amplifies the 3D feel
    camera.position.x = smoothX * 0.35;
    camera.position.y = -smoothY * 0.22;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  tick();

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) tick();
  });

  window.addEventListener('resize', () => {
    W = hero.offsetWidth;
    H = hero.offsetHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  }, { passive: true });
})();
