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
  scene.add(particles);

  // Wireframe icosahedron — central, slow rotation
  const ico = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.4, 1),
    new THREE.MeshBasicMaterial({ color: 0x0d8a7c, wireframe: true, transparent: true, opacity: 0.09 })
  );
  scene.add(ico);

  // Wireframe torus — offset, adds depth
  const tor = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.45, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0x7C6FE0, wireframe: true, transparent: true, opacity: 0.07 })
  );
  tor.position.set(3.5, -1.5, -3);
  scene.add(tor);

  let t = 0;
  let running = true;

  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);
    t += 0.0005;

    particles.rotation.y = t * 0.08;
    particles.rotation.x = t * 0.03;
    ico.rotation.y       = t * 0.12;
    ico.rotation.x       = t * 0.06;
    tor.rotation.x       = t * 0.18;
    tor.rotation.z       = t * 0.08;

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
