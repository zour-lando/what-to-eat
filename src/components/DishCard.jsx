import React from 'react';

const MEAL_LABEL = { lunch: '中餐', dinner: '晚餐' };

/**
 * 菜品卡片：缩略图 + 菜名 + 餐别标签。
 * props:
 *   - dish   : Dish 对象
 *   - onClick: 点击回调
 */
export default function DishCard({ dish, onClick }) {
  const hasImage = dish.image && dish.image.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-stone-100 transition active:scale-[0.98]"
    >
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
        {hasImage ? (
          <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">🍽️</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-stone-800">{dish.name}</div>
        <div className="mt-0.5 text-xs text-stone-400">{MEAL_LABEL[dish.mealType] || '菜品'}</div>
      </div>
    </button>
  );
}
