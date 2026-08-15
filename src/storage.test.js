/**
 * 单元测试：src/storage.js
 * 仅覆盖不依赖浏览器 canvas/Image/FileReader 的部分：
 *   openDB / getAll / put / del / bulkPut / clearAll / exportData / importData / uuid / getTodayKey
 * compressImage 依赖浏览器 API（canvas），跳过，标注「需在浏览器验证」。
 *
 * 运行环境：Node + fake-indexeddb（通过 npm install --no-save vitest fake-indexeddb 安装）
 * 执行： npx vitest run src/storage.test.js
 */
import 'fake-indexeddb/auto';
import { describe, test, expect, beforeEach } from 'vitest';
import {
  openDB,
  getAll,
  put,
  del,
  bulkPut,
  clearAll,
  exportData,
  importData,
  uuid,
  getTodayKey,
} from './storage.js';

/** 构造一个完整 Dish 对象（日期用本地 today，保证跨模块一致）。 */
function makeDish(overrides = {}) {
  return {
    id: uuid(),
    name: '番茄炒蛋',
    mealType: 'lunch',
    image: '',
    steps: '1. 打蛋\n2. 翻炒',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    eatenDate: getTodayKey(),
    eatenMeal: 'lunch',
    ...overrides,
  };
}

// 每个用例前清空对象仓库，避免 fake-indexeddb 在整文件运行期间状态串扰。
beforeEach(async () => {
  await clearAll();
});

describe('uuid()', () => {
  test('返回合法的 v4 UUID', () => {
    const id = uuid();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  test('两次调用返回不同值', () => {
    expect(uuid()).not.toBe(uuid());
  });
});

describe('getTodayKey()', () => {
  test('返回本地时区 YYYY-MM-DD 且格式正确', () => {
    const key = getTodayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    expect(key).toBe(expected);
  });
});

describe('openDB()', () => {
  test('成功打开数据库且包含 dishes 对象仓库', async () => {
    const db = await openDB();
    expect(db).toBeDefined();
    expect(db.objectStoreNames.contains('dishes')).toBe(true);
  });
});

describe('CRUD：put / getAll / del', () => {
  test('put 后 getAll 能读回', async () => {
    const dish = makeDish();
    await put(dish);
    const all = await getAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('番茄炒蛋');
    expect(all[0].mealType).toBe('lunch');
  });

  test('put 按 id 覆盖（同 id 不新增）', async () => {
    const dish = makeDish({ id: 'fixed-1', name: '旧名' });
    await put(dish);
    await put({ ...dish, name: '新名' });
    const all = await getAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('新名');
  });

  test('del 按 id 删除', async () => {
    const dish = makeDish({ id: 'del-1' });
    await put(dish);
    await del(dish.id);
    expect(await getAll()).toHaveLength(0);
  });
});

describe('bulkPut()', () => {
  test('批量写入多条并合并', async () => {
    await bulkPut([makeDish({ id: 'b1' }), makeDish({ id: 'b2' })]);
    expect(await getAll()).toHaveLength(2);
  });

  test('空数组 / 非数组输入返回 0 且不写入', async () => {
    expect(await bulkPut([])).toBe(0);
    expect(await bulkPut(null)).toBe(0);
    expect(await bulkPut('not-array')).toBe(0);
    expect(await getAll()).toHaveLength(0);
  });

  test('按 id 覆盖已存在的记录', async () => {
    await put(makeDish({ id: 'm1', name: 'old' }));
    await bulkPut([makeDish({ id: 'm1', name: 'new' })]);
    const all = await getAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('new');
  });
});

describe('clearAll()', () => {
  test('清空后 getAll 返回空数组', async () => {
    await put(makeDish());
    await clearAll();
    expect(await getAll()).toEqual([]);
  });
});

describe('exportData() / importData() 字段一致性', () => {
  test('exportData 返回全部菜品', async () => {
    await clearAll();
    await bulkPut([makeDish({ id: 'e1' }), makeDish({ id: 'e2' })]);
    const exported = await exportData();
    expect(exported).toHaveLength(2);
  });

  test('导出→修改→导入 按 id 合并，字段保持一致', async () => {
    await clearAll();
    const original = makeDish({ id: 'r1', name: '原菜', mealType: 'dinner', steps: '旧做法' });
    await put(original);

    const backup = await exportData();
    expect(backup).toHaveLength(1);

    // 模拟用户在备份中修改后重新导入
    backup[0] = { ...backup[0], name: '改后', steps: '新做法' };
    const n = await importData(backup);
    expect(n).toBe(1);

    const all = await getAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('改后');
    expect(all[0].steps).toBe('新做法');
    // 未被修改的字段应保持一致（字段一致性验证）
    expect(all[0].mealType).toBe('dinner');
    expect(all[0].eatenDate).toBe(getTodayKey());
    expect(all[0].id).toBe('r1');
  });

  test('importData 对非法（非数组）输入明确 reject', async () => {
    await clearAll();
    await expect(importData({ not: 'array' })).rejects.toThrow('导入数据格式不正确');
    // 未写入任何数据
    expect(await getAll()).toHaveLength(0);
  });
});
