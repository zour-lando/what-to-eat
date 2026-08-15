import React, { useState } from 'react';
import Nav from './components/Nav.jsx';
import TodayView from './components/TodayView.jsx';
import DishLibrary from './components/DishLibrary.jsx';
import RandomPicker from './components/RandomPicker.jsx';
import Backup from './components/Backup.jsx';

/**
 * 应用根组件：管理底部 Tab 切换，并按当前 Tab 渲染对应模块。
 * 仅渲染当前激活的模块，切换 Tab 时会重新挂载，从而自动从 IndexedDB 重新拉取数据，
 * 保证今日视图、菜谱库、随机推荐之间的数据一致性（如新增菜品后立即在菜谱库可见）。
 */
export default function App() {
  const [tab, setTab] = useState('today');

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-stone-50 pb-24">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-brand-500 px-4 py-3 text-center text-lg font-semibold text-white shadow-sm">
          今天吃什么
        </header>

        <main className="flex-1 px-4 py-4">
          {tab === 'today' && <TodayView />}
          {tab === 'library' && <DishLibrary />}
          {tab === 'random' && <RandomPicker />}
          {tab === 'backup' && <Backup />}
        </main>
      </div>

      <Nav active={tab} onChange={setTab} />
    </div>
  );
}
