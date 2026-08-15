import React, { useEffect, useState, useCallback } from 'react';
import { getAll, put, del } from '../storage.js';
import { MEALS } from '../meals.js';
import DishCard from './DishCard.jsx';
import DishDetail from './DishDetail.jsx';
import DishForm from './DishForm.jsx';
import Backup from './Backup.jsx';

const FILTERS = [{ key: 'all', label: '全部' }, ...MEALS];

/**
 * 菜谱库（Tab2）：展示全部历史菜品，可按餐别筛选；
 * 点击卡片进入详情（大图 + 菜名 + 食材 + 做法），详情内可编辑 / 删除；
 * 顶部「+ 新建菜品」可直接把一道新菜加进菜谱本（作为纯菜谱，不记入今日用餐）。
 * 页面底部内嵌「数据备份」模块（导出 / 导入 JSON）。
 */
export default function DishLibrary() {
  const [dishes, setDishes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const all = await getAll();
    all.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    setDishes(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = filter === 'all' ? dishes : dishes.filter((d) => d.mealType === filter);

  async function handleEdit(updated) {
    await put(updated);
    await load();
  }

  async function handleDelete() {
    if (!selected) return;
    if (!window.confirm(`确定删除「${selected.name}」吗？此操作不可恢复。`)) return;
    await del(selected.id);
    setSelected(null);
    await load();
  }

  async function handleAddSubmit(dish) {
    await put(dish);
    setAdding(false);
    await load();
  }

  // 新建时的默认餐别：跟随当前筛选（若正看某一餐别），否则默认中餐
  const addDefaultMeal = MEALS.some((m) => m.key === filter) ? filter : 'lunch';

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`flex-1 rounded-full py-1.5 text-sm ${
              filter === f.key ? 'bg-brand-500 text-white' : 'bg-white text-stone-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mb-3 w-full rounded-xl border border-dashed border-brand-300 bg-brand-50 py-2.5 text-sm font-medium text-brand-600"
      >
        + 新建菜品
      </button>

      {loading ? (
        <p className="py-10 text-center text-sm text-stone-400">加载中…</p>
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-400">还没有菜品，点上面的「+ 新建菜品」添加吧</p>
      ) : (
        <div className="space-y-2">
          {visible.map((dish) => (
            <DishCard key={dish.id} dish={dish} onClick={() => setSelected(dish)} />
          ))}
        </div>
      )}

      {selected && (
        <DishDetail
          dish={selected}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setSelected(null)}
        />
      )}

      {adding && (
        <DishForm
          recipeMode
          defaultMealType={addDefaultMeal}
          onCancel={() => setAdding(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      <div className="mt-8 border-t border-stone-200 pt-5">
        <Backup />
      </div>
    </div>
  );
}
