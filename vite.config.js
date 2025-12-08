import { defineConfig } from 'vite';

const REPO_NAME = process.env.REPO_NAME || 'repoverse';
const base = REPO_NAME === 'username.github.io' ? '/' : `/${REPO_NAME}/`;

export default defineConfig({
  base: base,
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});

