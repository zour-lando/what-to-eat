import React, { useState, useRef } from 'react';
import { exportData, importData, getTodayKey } from '../storage.js';

/**
 * 数据备份（Tab4）：
 *  - 导出：将全部 Dish 导出为 JSON 文件下载
 *  - 导入：选择 JSON 文件读回并写入 IndexedDB（导入前 confirm，按 id 合并）
 */
export default function Backup() {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  function handleExport() {
    setMsg('');
    exportData()
      .then((data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `what-to-eat-backup-${getTodayKey()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setMsg(`已导出 ${data.length} 道菜品 ✅`);
      })
      .catch((err) => setMsg('导出失败：' + (err.message || err)));
  }

  async function handleImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    setMsg('');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('文件格式不正确（应为菜品数组）');
      if (!window.confirm(`将导入 ${data.length} 道菜品，按 id 合并（已存在的会覆盖）。确定继续？`)) {
        setBusy(false);
        e.target.value = '';
        return;
      }
      const n = await importData(data);
      setMsg(`已导入 ${n} 道菜品 ✅`);
    } catch (err) {
      setMsg('导入失败：' + (err.message || err));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-4">
        <h2 className="text-base font-semibold text-stone-800">数据备份</h2>
        <p className="mt-1 text-sm text-stone-500">
          所有数据仅存储在你的浏览器本地（IndexedDB），不会上传到任何服务器。建议定期导出备份，换设备或清缓存前务必备份。
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleExport}
          className="w-full rounded-xl bg-brand-500 py-3 font-medium text-white"
        >
          导出备份（下载 JSON）
        </button>

        <button
          type="button"
          onClick={() => fileRef.current && fileRef.current.click()}
          disabled={busy}
          className="w-full rounded-xl border border-stone-200 bg-white py-3 font-medium text-stone-700 disabled:opacity-60"
        >
          {busy ? '导入中…' : '导入备份（选择 JSON）'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {msg && (
        <p className="rounded-xl bg-stone-100 px-4 py-3 text-center text-sm text-stone-600">{msg}</p>
      )}

      <p className="px-1 text-xs leading-relaxed text-stone-400">
        提示：导入会按菜品 id 合并，重复 id 的新数据会覆盖旧数据。导入前已自动弹窗确认。
      </p>
    </div>
  );
}
