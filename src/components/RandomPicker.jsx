import React, { useEffect, useState } from 'react';
import { getAll } from '../storage.js';
import { MEALS, MEAL_LABEL } from '../meals.js';

/**
 * 随机推荐（Tab3）：点击「今天吃什么」从菜谱库随机抽取一道菜；
 * 可开启「按餐别过滤」开关，弹层展示大图 + 菜名 + 做法，可「换一个」重抽。
 */
export default function RandomPicker() {
  const [dishes, setDishes] = useState([]);
  const [filterByMeal, setFilterByMeal] = useState(false);
  const [meal, setMeal] = useState('breakfast');
  const [picked, setPicked] = useState(null);
  const [empty, setEmpty] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAll().then((all) => {
      setDishes(all);
      setLoading(false);
    });
  }, []);

  function pick() {
    let pool = dishes;
    if (filterByMeal) pool = dishes.filter((d) => d.mealType === meal);
    if (pool.length === 0) {
      setPicked(null);
      setEmpty(true);
      return;
    }
    const r = pool[Math.floor(Math.random() * pool.length)];
    setPicked(r);
    setEmpty(false);
  }

  const hasImage = picked && picked.image && picked.image.length > 0;

  return (
    <div>
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 px-4 py-6 text-center text-white shadow-sm">
        <div className="text-sm opacity-90">不知道吃什么？</div>
        <div className="text-2xl font-bold">让命运来决定</div>
      </div>

      <div className="mb-4 rounded-xl bg-white p-3">
        <label className="flex cursor-pointer items-center justify-between text-sm text-stone-600">
          <span>只从指定餐别里抽</span>
          <input
            type="checkbox"
            checked={filterByMeal}
            onChange={(e) => setFilterByMeal(e.target.checked)}
            className="h-4 w-4 accent-brand-500"
          />
        </label>
        {filterByMeal && (
          <div className="mt-2 flex gap-2">
            {MEALS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMeal(m.key)}
                className={`flex-1 rounded-lg py-1.5 text-sm ${
                  meal === m.key ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={pick}
        disabled={loading}
        className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-semibold text-white shadow-sm disabled:opacity-60"
      >
        🎲 今天吃什么
      </button>

      {empty && (
        <p className="mt-4 text-center text-sm text-stone-400">
          {filterByMeal
            ? `菜谱库里还没有${MEAL_LABEL[meal]}的菜`
            : '菜谱库还是空的，先去加几道菜吧'}
        </p>
      )}

      {picked && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setPicked(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-60 w-full bg-stone-100">
              {hasImage ? (
                <img src={picked.image} alt={picked.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl">🍽️</div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="text-center text-xl font-bold text-stone-800">{picked.name}</div>
              <div className="mt-1 text-center text-xs text-stone-400">
                {MEAL_LABEL[picked.mealType] || ''}
              </div>
              <h3 className="mb-1 mt-4 text-sm font-medium text-stone-500">做法</h3>
              {picked.steps ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                  {picked.steps}
                </p>
              ) : (
                <p className="text-sm text-stone-400">暂无做法记录</p>
              )}
            </div>
            <div className="flex gap-3 border-t border-stone-100 px-4 py-3">
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="flex-1 rounded-lg border border-stone-200 py-2.5 text-stone-600"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={pick}
                className="flex-1 rounded-lg bg-brand-500 py-2.5 font-medium text-white"
              >
                换一个
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
