/// <reference types="./types" />

const THREE = window.THREE;

export interface SceneObjects {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  pantGroup: THREE.Group;
  canvas: HTMLCanvasElement;
  wrap: HTMLElement;
}

export function initScene(backgroundColor: string): SceneObjects {
  const canvas = document.getElementById('visutek-canvas') as HTMLCanvasElement;
  const wrap = canvas.parentElement as HTMLElement;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(backgroundColor);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 50);
  camera.position.set(0, 0, 4.8);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  // Studio 6-point lighting rig
  const hemi = new THREE.HemisphereLight(0xdde8f0, 0xd4c8a8, 0.65);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff8f0, 3.2);
  key.position.set(-2, 4, 2.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -2; key.shadow.camera.right = 2;
  key.shadow.camera.top = 3;   key.shadow.camera.bottom = -3;
  key.shadow.camera.far = 18;  key.shadow.radius = 8; key.shadow.bias = -0.0002;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xc8ddf5, 1.1);
  fill.position.set(3, 1, 1);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xa8c8e8, 0.7);
  rim.position.set(0.5, 2, -4);
  scene.add(rim);

  const bnc = new THREE.DirectionalLight(0xf0e4cc, 0.45);
  bnc.position.set(0, -2, 1);
  scene.add(bnc);

  const kick = new THREE.DirectionalLight(0xffe8c8, 0.35);
  kick.position.set(-3, 0.5, -1);
  scene.add(kick);

  // Shadow plane
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ opacity: 0.18 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.5;
  ground.receiveShadow = true;
  scene.add(ground);

  const pantGroup = new THREE.Group();
  scene.add(pantGroup);

  function resize() {
    const W = wrap.clientWidth || 800;
    const H = wrap.clientHeight || 600;
    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(wrap);
  window.addEventListener('resize', resize);

  return { scene, camera, renderer, pantGroup, canvas, wrap };
}

export function startRenderLoop(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  pantGroup: THREE.Group,
  getAutoSpin: () => boolean,
): void {
  function animate() {
    requestAnimationFrame(animate);
    if (getAutoSpin()) {
      pantGroup.rotation.y += 0.004;
    }
    renderer.render(scene, camera);
  }
  animate();
}

export function setupOrbitControls(
  canvas: HTMLCanvasElement,
  pantGroup: THREE.Group,
  onDragStart: () => void,
): void {
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener('mousedown', (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; onDragStart(); });
  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    pantGroup.rotation.y += dx * 0.008;
    pantGroup.rotation.x += dy * 0.008;
    pantGroup.rotation.x = Math.max(-0.6, Math.min(0.6, pantGroup.rotation.x));
    lastX = e.clientX; lastY = e.clientY;
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  // Touch
  let lastTouchX = 0;
  canvas.addEventListener('touchstart', (e) => { lastTouchX = e.touches[0].clientX; onDragStart(); }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    const dx = e.touches[0].clientX - lastTouchX;
    pantGroup.rotation.y += dx * 0.008;
    lastTouchX = e.touches[0].clientX;
  }, { passive: true });
}
