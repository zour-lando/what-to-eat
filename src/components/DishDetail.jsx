import React, { useState, useEffect } from 'react';
import DishForm from './DishForm.jsx';
import { MEALS, MEAL_LABEL } from '../meals.js';

/**
 * 菜品详情（模态层）：大图 + 菜名 + 做法 + 食材。
 * 支持「编辑」（复用 DishForm 预填）、「删除」（由父级 confirm）、
 * 「复制为…」（一键复制成其它餐别的菜品，由父级 onDuplicate 负责入库）。
 * props:
 *   - dish       : Dish 对象
 *   - onEdit     : 编辑回调 (updatedDish) => Promise
 *   - onDelete   : 删除回调 () => void（父级负责 confirm）
 *   - onDuplicate: 复制为其它餐别回调 (targetMealType) => Promise
 *   - onClose    : 关闭回调
 */
export default function DishDetail({ dish, onEdit, onDelete, onDuplicate, onClose }) {
  const [editing, setEditing] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [toast, setToast] = useState('');

  // 复制成功提示自动消失
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // 可复制的目标餐别（排除当前餐别）
  const targets = MEALS.filter((m) => m.key !== dish.mealType);

  if (editing) {
    return (
      <DishForm
        initial={dish}
        onCancel={() => setEditing(false)}
        onSubmit={async (updated) => {
          await onEdit(updated);
          setEditing(false);
        }}
      />
    );
  }

  const hasImage = dish.image && dish.image.length > 0;
  const ingredientLines = (dish.ingredients || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 w-full bg-stone-100">
          {hasImage ? (
            <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl">🍽️</div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-800">{dish.name}</h2>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600">
              {MEAL_LABEL[dish.mealType] || '菜品'}
            </span>
          </div>

          {ingredientLines.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-medium text-stone-500">食材</h3>
              <div className="flex flex-wrap gap-2">
                {ingredientLines.map((ing, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-600"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          <h3 className="mb-1 mt-4 text-sm font-medium text-stone-500">做法</h3>
          {dish.steps ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{dish.steps}</p>
          ) : (
            <p className="text-sm text-stone-400">暂无做法记录</p>
          )}
        </div>

        <div className="flex gap-3 border-t border-stone-100 px-4 py-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 rounded-lg border border-stone-200 py-2.5 text-stone-600"
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => setPickOpen((v) => !v)}
            className="flex-1 rounded-lg border border-stone-200 py-2.5 text-stone-600"
          >
            复制为…
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex-1 rounded-lg bg-red-50 py-2.5 font-medium text-red-500"
          >
            删除
          </button>
        </div>

        {pickOpen && (
          <div className="border-t border-stone-100 bg-stone-50 px-4 py-3">
            <p className="mb-2 text-xs text-stone-500">复制到哪个餐别？</p>
            <div className="flex gap-2">
              {targets.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={async () => {
                    setPickOpen(false);
                    await onDuplicate(m.key);
                    setToast(`已复制到${m.label}`);
                  }}
                  className="flex-1 rounded-lg bg-brand-500 py-2 text-sm text-white"
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {toast && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-sm text-white">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
