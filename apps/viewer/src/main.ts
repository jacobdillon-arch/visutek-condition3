import { initScene, startRenderLoop, setupOrbitControls } from './scene';
import { runAnalysis, toIn, buildFitResultsHTML } from './fit-calculator';
import { addToCart, notifyReady } from './cart-bridge';
import type { ViewerPayload, ColorOption, SizeChart } from '@visutek/shared';

const config: ViewerPayload = window.__VISUTEK_CONFIG__;

// ─── UI Elements ───────────────────────────────────────────────────────────

const loadOverlay = document.getElementById('load-overlay')!;
const loadError   = document.getElementById('load-error')!;

function showError() {
  loadOverlay.classList.add('hidden');
  loadError.classList.add('visible');
}

// ─── Scene Setup ───────────────────────────────────────────────────────────

const { scene, camera, renderer, pantGroup, canvas } = initScene(config.backgroundColor);

let autoSpin = true;
startRenderLoop(renderer, scene, camera, pantGroup, () => autoSpin);
setupOrbitControls(canvas, pantGroup, () => { autoSpin = false; });

// ─── Model Loading ─────────────────────────────────────────────────────────

let currentModelIndex = 0;

function loadModel(index: number) {
  const model = config.models[index];
  if (!model) return;

  // Clear existing model
  while (pantGroup.children.length > 0) pantGroup.remove(pantGroup.children[0]);

  loadOverlay.classList.remove('hidden');
  loadOverlay.textContent = 'Loading 3D model…';

  const loader = new (window as any).THREE.GLTFLoader();
  loader.load(
    model.presignedUrl,
    (gltf: any) => {
      const mesh = gltf.scene;
      const box = new window.THREE.Box3().setFromObject(mesh);
      const centre = box.getCenter(new window.THREE.Vector3());
      const size = box.getSize(new window.THREE.Vector3());
      const scale = 2.0 / Math.max(size.x, size.y, size.z);
      mesh.scale.setScalar(scale);
      mesh.position.set(-centre.x * scale, -centre.y * scale + 0.1, -centre.z * scale);
      mesh.traverse((child: any) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
      pantGroup.add(mesh);

      // Apply default color
      const defaultColor = config.colorOptions.find(c => c.isDefault) ?? config.colorOptions[0];
      if (defaultColor) paintModel(defaultColor.hexValue);

      loadOverlay.classList.add('hidden');
      autoSpin = true;
    },
    (progress: any) => {
      if (progress.total > 0) {
        const pct = Math.round((progress.loaded / progress.total) * 100);
        loadOverlay.textContent = `Loading… ${pct}%`;
      }
    },
    (err: unknown) => {
      console.error('GLB load error:', err);
      showError();
    }
  );
}

// ─── Color Painting ────────────────────────────────────────────────────────

function paintModel(hexValue: string): void {
  const hex = parseInt(hexValue.replace('#', ''), 16);
  const isBlack = hex === 0 || hex <= 0x080808;
  const col = new window.THREE.Color(isBlack ? 0x000000 : hex);
  pantGroup.traverse((child: any) => {
    if (!child.isMesh) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((m: any) => {
      if (!m) return;
      m.color.set(col);
      m.roughness = isBlack ? 0.95 : 0.78;
      m.metalness = isBlack ? 0.0 : 0.02;
      m.needsUpdate = true;
    });
  });
}

// ─── Build UI Dynamically from Config ─────────────────────────────────────

function buildUI() {
  buildModelTabs();
  buildColorSwatches();
  buildSizeChartUI();
  buildFitUI();
  buildCartButton();
}

function buildModelTabs() {
  const container = document.getElementById('model-tabs');
  if (!container || config.models.length <= 1) return;
  config.models.forEach((model, i) => {
    const btn = document.createElement('button');
    btn.className = `model-tab${i === 0 ? ' active' : ''}`;
    btn.textContent = model.label;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.model-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentModelIndex = i;
      loadModel(i);
    });
    container.appendChild(btn);
  });
}

function buildColorSwatches() {
  const container = document.getElementById('color-swatches');
  if (!container) return;
  config.colorOptions.forEach((color: ColorOption, i) => {
    const btn = document.createElement('button');
    btn.className = `color-opt${i === 0 ? ' active' : ''}`;
    btn.title = color.name;
    btn.style.cssText = `background:${color.hexValue};width:24px;height:24px;border-radius:50%;border:2px solid ${i === 0 ? '#000' : 'transparent'};cursor:pointer;margin:2px`;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.color-opt').forEach(b => (b as HTMLElement).style.borderColor = 'transparent');
      btn.style.borderColor = '#000';
      paintModel(color.hexValue);
      const label = document.getElementById('color-label');
      if (label) label.textContent = color.name;
    });
    container.appendChild(btn);
  });
}

function buildSizeChartUI() {
  const container = document.getElementById('size-buttons');
  if (!container || !config.sizeCharts.length) return;
  const chart = config.sizeCharts[0];
  const sizes = Object.keys(chart.chartData);
  sizes.forEach((sz, i) => {
    const btn = document.createElement('button');
    btn.className = `size-opt${i === 0 ? ' active' : ''}`;
    btn.textContent = sz;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.size-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    container.appendChild(btn);
  });
}

function buildFitUI() {
  const runBtn = document.getElementById('run-fit-btn');
  if (!runBtn || !config.sizeCharts.length) return;
  runBtn.addEventListener('click', () => {
    const chart: SizeChart = config.sizeCharts[0];
    const waistInput = (document.getElementById('fit-waist') as HTMLInputElement)?.value;
    const hipInput = (document.getElementById('fit-hip') as HTMLInputElement)?.value;
    const lenSelect = (document.getElementById('fit-inseam-len') as HTMLSelectElement)?.value as 'short' | 'reg' | 'tall';
    const unit = (document.querySelector('.fit-unit-btn.active') as HTMLButtonElement)?.dataset.unit as 'in' | 'cm' ?? 'in';

    if (!waistInput || !hipInput) {
      const area = document.getElementById('fit-results-area');
      if (area) area.innerHTML = '<div style="color:#c0401a;font-size:11px;text-align:center;padding:12px">Please enter your waist and hip measurements</div>';
      return;
    }

    const waistIn = toIn(parseFloat(waistInput), unit);
    const hipIn = toIn(parseFloat(hipInput), unit);
    const result = runAnalysis(waistIn, hipIn, lenSelect ?? 'reg', chart.chartData, chart.easeData);
    const area = document.getElementById('fit-results-area');
    if (area) area.innerHTML = buildFitResultsHTML(result);
  });
}

function buildCartButton() {
  const btn = document.getElementById('add-to-cart-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    // Find selected variant from active size + color
    const activeSize = (document.querySelector('.size-opt.active') as HTMLButtonElement)?.textContent ?? '';
    const mapping = config.variantMappings.find(m => m.size === activeSize);
    if (mapping) {
      addToCart(mapping.shopifyVariantId);
    }
    btn.textContent = '✓ Added';
    btn.style.background = '#2a6a2a';
    setTimeout(() => {
      btn.textContent = 'Add to Cart';
      btn.style.background = '';
    }, 1800);
  });
}

// ─── Init ──────────────────────────────────────────────────────────────────

if (config.models.length > 0) {
  loadModel(0);
} else {
  showError();
}
buildUI();
notifyReady();
