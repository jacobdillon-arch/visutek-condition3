import type { ViewerPayload } from '@visutek/shared';

export function renderViewerHTML(payload: ViewerPayload): string {
  const configJson = JSON.stringify(payload)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  const brandingBadge = payload.showBranding
    ? `<a href="https://visutek.io" target="_blank" rel="noopener noreferrer" style="position:fixed;bottom:10px;right:12px;font-family:system-ui,sans-serif;font-size:9px;letter-spacing:0.08em;color:rgba(0,0,0,0.35);text-decoration:none;z-index:99">Powered by VisuTek</a>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' https://*.amazonaws.com https://*.r2.cloudflarestorage.com blob:; img-src 'self' data: blob:; worker-src blob:;" />
  <title>VisuTek 3D Viewer</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${payload.backgroundColor}; }
    #visutek-canvas { display: block; width: 100%; height: 100%; touch-action: none; }
    #load-overlay {
      position: fixed; inset: 0; background: ${payload.backgroundColor};
      display: flex; align-items: center; justify-content: center;
      font-family: system-ui, sans-serif; font-size: 12px; letter-spacing: 0.1em;
      color: rgba(0,0,0,0.4); text-transform: uppercase; z-index: 10;
    }
    #load-overlay.hidden { display: none; }
    #load-error {
      position: fixed; inset: 0; display: none; align-items: center; justify-content: center;
      flex-direction: column; gap: 8px; font-family: system-ui, sans-serif;
      font-size: 12px; color: rgba(0,0,0,0.5);
    }
    #load-error.visible { display: flex; }
  </style>
</head>
<body>
  <div id="load-overlay">Loading 3D model…</div>
  <div id="load-error">
    <span>Unable to load 3D model</span>
    <button onclick="window.location.reload()" style="padding:6px 14px;border:1px solid rgba(0,0,0,0.2);background:transparent;cursor:pointer;font-size:11px">Retry</button>
  </div>
  <canvas id="visutek-canvas"></canvas>

  <script>window.__VISUTEK_CONFIG__ = ${configJson};</script>
  <script integrity="sha512-xBwqDygaV24LAFtYHlRxCiZ7pFsI5d7dEKDpPP9gZ+K0IM7TPPR7TlQnFCJMz3GFjKQJ1Q7kB4q2g5A+Bg==" crossorigin="anonymous" src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script crossorigin="anonymous" src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
  <script src="/viewer.js"></script>
  ${brandingBadge}
</body>
</html>`;
}
