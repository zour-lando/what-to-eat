import React, { useEffect, useState } from 'react';
import { getAll } from '../storage.js';
import { MEALS, MEAL_LABEL } from '../meals.js';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/** 今天本地日期键 YYYY-MM-DD。 */
function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 返回本周一与本周日的本地日期键（周一为一周起点）。 */
function getWeekRange() {
  const now = new Date();
  const dow = now.getDay(); // 0=周日
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon);
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  const key = (d) => {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  };
  return { monKey: key(mon), sunKey: key(sun) };
}

/**
 * 按周统计（Tab）：统计本周（周一~周日）按餐别的饮食打卡情况，
 * 并给出 7 天每日分布条形图。
 */
export default function Statistics() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAll().then((all) => {
      setDishes(all);
      setLoading(false);
    });
  }, []);

  const { monKey, sunKey } = getWeekRange();
  const tKey = todayKey();

  const weekDishes = dishes.filter(
    (d) => d.eatenDate && d.eatenDate >= monKey && d.eatenDate <= sunKey,
  );

  const mealCount = {};
  MEALS.forEach((m) => {
    mealCount[m.key] = weekDishes.filter((d) => d.mealType === m.key).length;
  });
  const total = weekDishes.length;

  const byDay = WEEKDAYS.map((label, idx) => {
    const d = new Date(monKey);
    d.setDate(d.getDate() + idx);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${d.getFullYear()}-${m}-${day}`;
    return { label, key, total: weekDishes.filter((x) => x.eatenDate === key).length };
  });

  const maxDay = Math.max(1, ...byDay.map((d) => d.total));

  return (
    <div>
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 px-4 py-5 text-white shadow-sm">
        <div className="text-sm opacity-90">本周饮食打卡</div>
        <div className="mt-1 text-3xl font-bold">{total} 道</div>
        <div className="mt-1 text-xs opacity-80">周一至周日的记录都会计入本周</div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {MEALS.map((m) => (
          <div key={m.key} className="rounded-2xl bg-white p-3 text-center shadow-sm">
            <div className="text-xs text-stone-400">{m.label}</div>
            <div className="text-2xl font-bold text-brand-600">{mealCount[m.key]}</div>
            <div className="text-[11px] text-stone-400">道</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-stone-700">每日分布</h2>
        {loading ? (
          <p className="py-6 text-center text-sm text-stone-400">加载中…</p>
        ) : (
          <div className="space-y-2.5">
            {byDay.map((d) => (
              <div key={d.key} className="flex items-center gap-2">
                <div
                  className={`w-10 shrink-0 text-xs ${
                    d.key === tKey ? 'font-semibold text-brand-600' : 'text-stone-400'
                  }`}
                >
                  {d.label}
                </div>
                <div className="h-5 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className={`flex h-full items-center justify-end rounded-full px-2 text-[11px] font-medium text-white ${
                      d.key === tKey ? 'bg-brand-500' : 'bg-brand-400'
                    }`}
                    style={{ width: `${Math.max(d.total > 0 ? 14 : 0, (d.total / maxDay) * 100)}%` }}
                  >
                    {d.total > 0 ? d.total : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && total === 0 && (
        <p className="mt-4 rounded-xl bg-white px-4 py-6 text-center text-sm text-stone-400">
          本周还没有记录，去「今日」加一道菜吧 🍽️
        </p>
      )}

      <p className="mt-4 px-1 text-xs leading-relaxed text-stone-400">
        统计口径：仅统计「就餐日期」落在周一~周日内的菜品。在「今日」加菜时会自动记录当天日期。
      </p>
    </div>
  );
}
