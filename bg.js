// bg.js — subtle cursor-reactive particle backdrop for light-background pages
// Looks for a <canvas id="bg-canvas"> on the page and renders into it.
// Very low opacity so page text/content remains fully primary.
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

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  let W = window.innerWidth;
  let H = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(W, H);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.z = 7;

  const group = new THREE.Group();
  scene.add(group);

  // Sparse particle field — spread wide, very low opacity for cream backgrounds
  const N = 320;
  const pPos = new Float32Array(N * 3);
  const pCol = new Float32Array(N * 3);
  const palette = [
    new THREE.Color('#0d8a7c'),  // teal
    new THREE.Color('#7C6FE0'),  // violet
    new THREE.Color('#1A5490'),  // blue
  ];
  for (let i = 0; i < N; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 24;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    const c = palette[Math.floor(Math.random() * palette.length)];
    pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
  const particles = new THREE.Points(
    pGeo,
    // Low opacity — just enough to feel alive without competing with text
    new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.18 })
  );
  group.add(particles);

  // Cursor / touch tracking
  let targetX = 0, targetY = 0;
  let smoothX  = 0, smoothY  = 0;

  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / W - 0.5) * 2;
    targetY = (e.clientY / H - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length) {
      targetX = (e.touches[0].clientX / W - 0.5) * 2;
      targetY = (e.touches[0].clientY / H - 0.5) * 2;
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });

  let t = 0;
  let running = true;

  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);
    t += 0.0003;

    // Slow-lerp cursor follow — even softer than the hero (0.03 vs 0.05)
    smoothX += (targetX - smoothX) * 0.03;
    smoothY += (targetY - smoothY) * 0.03;

    // Gentle drift + cursor tilt
    particles.rotation.y = t * 0.06 + smoothX * 0.15;
    particles.rotation.x = t * 0.025 - smoothY * 0.10;

    // Camera micro-shift for depth
    camera.position.x = smoothX * 0.22;
    camera.position.y = -smoothY * 0.14;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  tick();

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) tick();
  });

  window.addEventListener('resize', () => {
    W = window.innerWidth;
    H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  }, { passive: true });
})();
