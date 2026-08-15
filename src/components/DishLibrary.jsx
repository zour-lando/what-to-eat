import React, { useEffect, useState, useCallback } from 'react';
import { getAll, put, del } from '../storage.js';
import DishCard from './DishCard.jsx';
import DishDetail from './DishDetail.jsx';

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'lunch', label: '中餐' },
  { key: 'dinner', label: '晚餐' },
];

/**
 * 菜谱库（Tab2）：展示全部历史菜品，可按餐别筛选；
 * 点击卡片进入详情（大图 + 菜名 + 做法），详情内可编辑 / 删除。
 */
export default function DishLibrary() {
  const [dishes, setDishes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
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

      {loading ? (
        <p className="py-10 text-center text-sm text-stone-400">加载中…</p>
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-400">还没有菜品，去「今日」加一道吧</p>
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
    </div>
  );
}
