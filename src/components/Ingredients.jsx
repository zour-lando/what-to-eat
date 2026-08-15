import React, { useEffect, useState, useCallback } from 'react';
import { getAll } from '../storage.js';

const STORAGE_KEY = 'wte-bought-ingredients';

/** 从 localStorage 读取已购食材集合（勾选状态仅存于本机浏览器）。 */
function loadBought() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveBought(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

/**
 * 食材清单（Tab）：汇总所有菜品里填写的「食材」，去重后形成采购清单；
 * 每条可勾选「已购」（状态存于本机 localStorage），并提供全选 / 清空。
 */
export default function Ingredients() {
  const [items, setItems] = useState([]);
  const [bought, setBought] = useState(loadBought());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const all = await getAll();
    const set = new Set();
    all.forEach((d) => {
      (d.ingredients || '')
        .split('\n')
        .forEach((line) => {
          const t = line.trim();
          if (t) set.add(t);
        });
    });
    setItems([...set]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(name) {
    const next = new Set(bought);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setBought(next);
    saveBought(next);
  }

  function markAll() {
    const s = new Set(items);
    setBought(s);
    saveBought(s);
  }

  function clearBought() {
    setBought(new Set());
    saveBought(new Set());
  }

  const boughtCount = items.filter((i) => bought.has(i)).length;
  const remaining = items.length - boughtCount;

  return (
    <div>
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 px-4 py-4 text-white shadow-sm">
        <div className="text-sm opacity-90">食材清单</div>
        <div className="mt-1 flex items-end gap-4">
          <div>
            <div className="text-2xl font-bold">{items.length}</div>
            <div className="text-[11px] opacity-80">种食材</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{remaining}</div>
            <div className="text-[11px] opacity-80">待购买</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{boughtCount}</div>
            <div className="text-[11px] opacity-80">已购买</div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={markAll}
          disabled={items.length === 0}
          className="flex-1 rounded-lg bg-brand-500 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          全部已购
        </button>
        <button
          type="button"
          onClick={clearBought}
          disabled={boughtCount === 0}
          className="flex-1 rounded-lg border border-stone-200 bg-white py-2 text-sm text-stone-600 disabled:opacity-50"
        >
          清空勾选
        </button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-stone-400">加载中…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-stone-400">
          还没有食材。在菜品里填写「食材」后，会自动汇总到这里 🛒
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((name) => {
            const isBought = bought.has(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-sm"
              >
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${
                    isBought ? 'border-brand-500 bg-brand-500 text-white' : 'border-stone-300 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className={`flex-1 text-sm ${isBought ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-4 px-1 text-xs leading-relaxed text-stone-400">
        食材取自各菜品的「食材」字段（一行一个）。勾选状态只存在你这台手机的浏览器里，换机或清缓存会重置。
      </p>
    </div>
  );
}
