import React, { useState, useRef } from 'react';
import { compressImage, uuid } from '../storage.js';
import { MEALS } from '../meals.js';

const MEAL_OPTIONS = MEALS;

/**
 * 新增 / 编辑 共用的菜品表单（底部弹起的模态层）。
 * props:
 *   - initial        : 编辑时的已有 Dish（可选）
 *   - defaultMealType: 新增时的默认餐别 'breakfast' | 'lunch' | 'dinner'
 *   - eatenDate      : 新增时记录的就餐日期（YYYY-MM-DD）
 *   - recipeMode     : true 表示「作为纯菜谱新建」（不记入今日用餐，eatenDate/eatenMeal 留空）
 *   - onCancel       : 取消回调
 *   - onSubmit       : 提交回调，接收组装好的完整 Dish 对象
 */
export default function DishForm({ initial, defaultMealType = 'lunch', eatenDate = '', recipeMode = false, onCancel, onSubmit }) {
  const isEdit = Boolean(initial && initial.id);
  const [name, setName] = useState(initial?.name ?? '');
  const [mealType, setMealType] = useState(initial?.mealType ?? defaultMealType);
  const [steps, setSteps] = useState(initial?.steps ?? '');
  const [ingredients, setIngredients] = useState(initial?.ingredients ?? '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      setError('');
      const dataUrl = await compressImage(file, 1024, 0.8);
      setImage(dataUrl);
    } catch (err) {
      setError(err.message || '图片处理失败，请换一张试试');
    } finally {
      e.target.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('请填写菜名');
      return;
    }
    setBusy(true);
    setError('');
    const now = new Date().toISOString();
    const dish = {
      id: initial?.id || uuid(),
      name: name.trim(),
      mealType,
      image,
      ingredients: ingredients.trim(),
      steps: steps.trim(),
      createdAt: initial?.createdAt || now,
      updatedAt: now,
      eatenDate: recipeMode ? '' : (initial?.eatenDate != null ? initial.eatenDate : eatenDate),
      eatenMeal: recipeMode ? '' : (initial ? (initial.eatenMeal ?? '') : mealType),
    };
    try {
      await onSubmit(dish);
    } catch (err) {
      setError(err.message || '保存失败，请重试');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <h2 className="text-base font-semibold text-stone-800">{isEdit ? '编辑菜品' : '加一道菜'}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-stone-400"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-600">菜名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：番茄炒蛋"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-800 outline-none focus:border-brand-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-600">餐别</label>
            <div className="flex gap-2">
              {MEAL_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setMealType(opt.key)}
                  className={`flex-1 rounded-lg border py-2 text-sm ${
                    mealType === opt.key
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : 'border-stone-200 text-stone-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-600">图片（可选）</label>
            <div className="flex items-center gap-3">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
                {image ? (
                  <img src={image} alt="预览" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-stone-300">
                    🍽️
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current && fileRef.current.click()}
                  className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700"
                >
                  选择图片
                </button>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="rounded-lg px-3 py-1 text-xs text-stone-400"
                  >
                    移除图片
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-600">食材（可选，一行一个）</label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={3}
              placeholder={'每行写一个食材，例如：\n鸡蛋\n番茄\n葱'}
              className="w-full resize-y rounded-lg border border-stone-200 px-3 py-2 text-stone-800 outline-none focus:border-brand-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-600">做法</label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={5}
              placeholder={'每行写一步，例如：\n1. 鸡蛋打散\n2. 热油下锅翻炒'}
              className="w-full resize-y rounded-lg border border-stone-200 px-3 py-2 text-stone-800 outline-none focus:border-brand-400"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-stone-200 py-2.5 text-stone-600"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-lg bg-brand-500 py-2.5 font-medium text-white disabled:opacity-60"
            >
              {busy ? '保存中…' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
