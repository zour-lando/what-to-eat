/**
 * meals.js
 * ---------------------------------------------------------------------------
 * 餐别（早 / 中 / 晚）的单一可信来源（single source of truth）。
 * 所有模块（今日视图、菜谱库筛选、随机推荐、表单、详情）均从这里取餐别，
 * 新增餐别只需在此处追加一项，避免各处硬编码不一致。
 * ---------------------------------------------------------------------------
 */

export const MEALS = [
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '中餐' },
  { key: 'dinner', label: '晚餐' },
];

/** mealType -> 中文标签，例如 { breakfast: '早餐', lunch: '中餐', dinner: '晚餐' } */
export const MEAL_LABEL = Object.fromEntries(MEALS.map((m) => [m.key, m.label]));

/** 餐别 key 有序数组 ['breakfast', 'lunch', 'dinner'] */
export const MEAL_KEYS = MEALS.map((m) => m.key);
