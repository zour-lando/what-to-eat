import React from 'react';

const TABS = [
  { key: 'today', label: '今日', icon: '🏠' },
  { key: 'library', label: '菜谱库', icon: '📖' },
  { key: 'random', label: '随机', icon: '🎲' },
  { key: 'stats', label: '统计', icon: '📊' },
  { key: 'ingredients', label: '食材', icon: '🛒' },
];

/**
 * 底部固定 Tab 导航。
 * props:
 *   - active  : 当前激活的 tab key
 *   - onChange: 切换回调 (key) => void
 */
export default function Nav({ active, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[480px] items-stretch justify-around">
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? 'text-brand-600' : 'text-stone-400'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
