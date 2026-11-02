import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  build: { chunkSizeWarningLimit: 1500 },
});
