import React, { useEffect, useState, useCallback } from 'react';
import { getAll, put, del, getTodayKey } from '../storage.js';
import { MEALS } from '../meals.js';
import DishCard from './DishCard.jsx';
import DishForm from './DishForm.jsx';
import DishDetail from './DishDetail.jsx';

/** 今日日期的人类可读展示，如「8月15日 周六」。 */
function formatDate() {
  const d = new Date();
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
}

/**
 * 今日视图（首页 / Tab1）：
 *  - 顶部显示今天日期
 *  - 分「中餐」「晚餐」两栏，展示当天 eatenDate === 今天 的菜品
 *  - 每栏「+ 加一道菜」打开 DishForm，提交后写入 IndexedDB（eatenDate=今天）并刷新
 *  - 卡片点击进入详情，可编辑 / 删除
 */
export default function TodayView() {
  const today = getTodayKey();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formMeal, setFormMeal] = useState(null); // 当前打开「新增」表单的餐别
  const [selected, setSelected] = useState(null); // 当前查看详情的菜品
  const [editing, setEditing] = useState(null); // 当前编辑的菜品

  const load = useCallback(async () => {
    const all = await getAll();
    setDishes(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddSubmit(dish) {
    await put(dish);
    setFormMeal(null);
    await load();
  }

  async function handleEditSubmit(dish) {
    await put(dish);
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    if (!selected) return;
    if (!window.confirm(`确定删除「${selected.name}」吗？此操作不可恢复。`)) return;
    await del(selected.id);
    setSelected(null);
    await load();
  }

  const todayDishes = dishes.filter((d) => d.eatenDate === today);

  return (
    <div>
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 px-4 py-4 text-white shadow-sm">
        <div className="text-sm opacity-90">今天</div>
        <div className="text-xl font-semibold">{formatDate()}</div>
      </div>

      <div className="space-y-5">
        {MEALS.map((meal) => {
          const list = todayDishes.filter((d) => d.mealType === meal.key);
          return (
            <section key={meal.key}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-semibold text-stone-700">{meal.label}</h2>
                <span className="text-xs text-stone-400">{list.length} 道</span>
              </div>

              <div className="space-y-2">
                {list.map((dish) => (
                  <DishCard key={dish.id} dish={dish} onClick={() => setSelected(dish)} />
                ))}
                {list.length === 0 && (
                  <p className="rounded-xl bg-white px-3 py-4 text-center text-sm text-stone-400">
                    还没记录{meal.label}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setFormMeal(meal.key)}
                className="mt-2 w-full rounded-xl border border-dashed border-brand-300 bg-brand-50 py-2.5 text-sm font-medium text-brand-600"
              >
                + 加一道菜
              </button>
            </section>
          );
        })}
      </div>

      {editing && (
        <DishForm initial={editing} onCancel={() => setEditing(null)} onSubmit={handleEditSubmit} />
      )}

      {!editing && formMeal && (
        <DishForm
          defaultMealType={formMeal}
          eatenDate={today}
          onCancel={() => setFormMeal(null)}
          onSubmit={handleAddSubmit}
        />
      )}

      {!editing && !formMeal && selected && (
        <DishDetail
          dish={selected}
          onEdit={(d) => {
            setSelected(null);
            setEditing(d);
          }}
          onDelete={handleDelete}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
