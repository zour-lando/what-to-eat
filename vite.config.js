import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 使用相对 base，方便部署到任意子路径（GitHub Pages 项目页、Netlify 等）。
// Service Worker 在入口处通过 import.meta.env.BASE_URL + 'sw.js' 注册，
// 可随 base 自适应，保证 PWA 在子路径下也能正常 scope。
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2018',
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
