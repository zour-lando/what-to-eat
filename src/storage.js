/**
 * storage.js
 * ---------------------------------------------------------------------------
 * 纯前端、零后端的本地数据层。所有数据通过 IndexedDB 永久存储在用户浏览器中。
 *
 * 数据模型 Dish：
 *   - id           : string  (crypto.randomUUID())
 *   - name         : string  (菜名)
 *   - mealType     : 'breakfast' | 'lunch' | 'dinner'  (早餐 / 中餐 / 晚餐)，详见 src/meals.js
 *   - image        : string  (压缩后的 base64 dataURL，可为空字符串)
 *   - ingredients  : string  (食材，多行文本，一行一个；可为空)
 *   - steps        : string  (做法，多行文本)
 *   - createdAt    : string  (ISO 时间)
 *   - updatedAt    : string  (ISO 时间)
 *   - eatenDate    : string  (YYYY-MM-DD，记录当天所吃；可为空)
 *   - eatenMeal    : 'breakfast' | 'lunch' | 'dinner' | ''  (记录当餐别；可为空)
 *
 * 导出函数：
 *   openDB, getAll, put, del, bulkPut, clearAll, exportData, importData,
 *   compressImage, getTodayKey, uuid
 * ---------------------------------------------------------------------------
 */

const DB_NAME = 'what-to-eat-db';
const DB_VERSION = 1;
const STORE_NAME = 'dishes';

/**
 * 打开（或按需升级）IndexedDB 数据库，返回 Promise<IDBDatabase>。
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前环境不支持 IndexedDB'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('mealType', 'mealType', { unique: false });
        store.createIndex('eatenDate', 'eatenDate', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** 取 object store（事务内）。 */
function store(db, mode) {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

/**
 * 读取全部菜品。
 * @returns {Promise<Array<Object>>}
 */
export async function getAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = store(db, 'readonly').getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 新增或更新一条菜品（按 id 覆盖）。
 * @param {Object} dish
 * @returns {Promise<Object>}
 */
export async function put(dish) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = store(db, 'readwrite').put(dish);
    request.onsuccess = () => resolve(dish);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 按 id 删除一条菜品。
 * @param {string} id
 * @returns {Promise<string>}
 */
export async function del(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = store(db, 'readwrite').delete(id);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 批量写入（用于导入备份，按 id 合并）。在单个事务中完成。
 * @param {Array<Object>} dishes
 * @returns {Promise<number>} 写入条数
 */
export async function bulkPut(dishes) {
  if (!Array.isArray(dishes) || dishes.length === 0) return 0;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const objectStore = store(db, 'readwrite');
    dishes.forEach((dish) => objectStore.put(dish));
    objectStore.transaction.oncomplete = () => resolve(dishes.length);
    objectStore.transaction.onerror = () => reject(objectStore.transaction.error);
  });
}

/**
 * 清空整个菜品库（暂未在前端 UI 暴露，预留给备份模块将来扩展）。
 */
export async function clearAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = store(db, 'readwrite').clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** 导出：返回全部菜品数组（用于备份）。 */
export function exportData() {
  return getAll();
}

/** 导入：将菜品数组批量写回数据库。非法输入（非数组）抛出明确错误。 */
export function importData(dishes) {
  if (!Array.isArray(dishes)) {
    return Promise.reject(new Error('导入数据格式不正确（应为菜品数组）'));
  }
  return bulkPut(dishes);
}

/**
 * 生成 UUID，优先使用原生 crypto.randomUUID，并提供降级实现。
 * @returns {string}
 */
export function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 返回本地时区下的今天日期键 YYYY-MM-DD。
 * 今日视图与新增菜品均使用此函数，保证跨模块「今天」判定一致。
 * @returns {string}
 */
export function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 将用户选择的图片文件压缩为 base64 dataURL：
 *   - 等比缩放，使最长边不超过 maxSize（默认 1024px）
 *   - 转码为 JPEG，quality 默认 0.8
 *   - 非图片文件直接 reject
 * @param {File} file
 * @param {number} [maxSize=1024]
 * @param {number} [quality=0.8]
 * @returns {Promise<string>} dataURL
 */
export function compressImage(file, maxSize = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('请选择图片文件'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('图片解析失败'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('当前环境不支持 Canvas'));
          return;
        }
        // 白底，避免 JPEG 透明区域变黑
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
