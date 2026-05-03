import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'VisuTekViewer',
      fileName: 'viewer',
      formats: ['iife'],
    },
    rollupOptions: {
      // Three.js is loaded via CDN in the viewer HTML template, so exclude it
      external: ['three'],
      output: {
        globals: { three: 'THREE' },
      },
    },
    minify: 'terser',
    sourcemap: false,
  },
});
