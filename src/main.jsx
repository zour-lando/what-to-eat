import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

/**
 * 在 React 入口处注册 Service Worker。
 * 使用 import.meta.env.BASE_URL 拼接，使 SW 路径随 Vite 的 base 配置自适应，
 * 既满足根域名部署（/sw.js），也兼容子路径部署（如 GitHub Pages 项目页）。
 * 注：index.html 内联脚本也会注册同一 SW（幂等，不影响激活），两者并存仅为满足 PWA 规范与首屏最快缓存。
 */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .catch((err) => {
        console.warn('Service Worker 注册失败：', err);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerServiceWorker();
