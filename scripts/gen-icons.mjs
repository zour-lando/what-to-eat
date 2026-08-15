/**
 * gen-icons.mjs
 * 纯 Node 实现（不依赖任何第三方库）生成应用图标 PNG：
 *   public/icons/icon-192.png   (192x192)
 *   public/icons/icon-512.png   (512x512)
 *   public/icons/apple-touch-icon.png (180x180)
 *
 * 图案（「今天吃什么」主题）：暖橙渐变圆角底色 + 居中的白碗 + 碗口描边
 *       + 碗内米饭点缀 + 上方三缕热气。扁平化设计，适配 PWA 与 iOS 主屏。
 * 仅用原生 zlib 编码 PNG，便于 CI 在部署前自动重生成，无需提交二进制。
 */
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.resolve(__dirname, '../public/icons');

// ---- CRC32（PNG chunk 校验用） ----
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function buildPng(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function makeIconPixels(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;

  // 调色板
  const bgTop = [253, 186, 116]; // #FDBA74
  const bgBot = [234, 88, 12]; // #EA580C
  const white = [255, 255, 255];
  const rice = [255, 251, 235]; // #FFFBEB
  const rim = [251, 146, 60]; // #FB923C
  const steam = [255, 255, 255];

  const r = size * 0.22; // 圆角半径

  // 碗几何
  const yTop = size * 0.5;
  const yBot = size * 0.84;
  const Rx = size * 0.27;
  const Ry = yBot - yTop;
  const rimRx = Rx;
  const rimRy = size * 0.05;

  // 热气预计算：每条热气在各 y 的目标 x（避免像素循环内重复 sin）
  const yLo = size * 0.16;
  const yHi = size * 0.46;
  const amp = size * 0.025;
  const freq = (2 * Math.PI) / (yHi - yLo);
  const thick = size * 0.014;
  const steamOffsets = [-0.11, 0, 0.11].map((o) => o * size);
  const steamX = steamOffsets.map(() => new Float64Array(size));
  for (let k = 0; k < steamOffsets.length; k++) {
    for (let y = 0; y < size; y++) {
      steamX[k][y] = cx + steamOffsets[k] + amp * Math.sin((y - yLo) * freq);
    }
  }

  const lerp = (a, b, t) => Math.round(a + (b - a) * t);

  function inRoundRect(x, y) {
    if (x >= r && x <= size - r && y >= 0 && y <= size) return true;
    if (y >= r && y <= size - r && x >= 0 && x <= size) return true;
    const corners = [
      [r, r],
      [size - r, r],
      [r, size - r],
      [size - r, size - r],
    ];
    for (const [ccx, ccy] of corners) {
      const dx = x - ccx;
      const dy = y - ccy;
      if (dx * dx + dy * dy <= r * r) return true;
    }
    return false;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let R = 0;
      let G = 0;
      let B = 0;
      let A = 0;

      // 1) 圆角矩形背景（对角线渐变）
      if (inRoundRect(x, y)) {
        const t = (x + y) / (2 * size);
        R = lerp(bgTop[0], bgBot[0], t);
        G = lerp(bgTop[1], bgBot[1], t);
        B = lerp(bgTop[2], bgBot[2], t);
        A = 255;
      }

      // 2) 碗体（以 (cx, yTop) 为心的椭圆下半）
      if (y >= yTop && y <= yBot) {
        const nx = (x - cx) / Rx;
        const ny = (y - yTop) / Ry;
        if (nx * nx + ny * ny <= 1) {
          R = white[0];
          G = white[1];
          B = white[2];
          A = 255;
        }
      }

      // 3) 碗口描边（扁椭圆环）
      {
        const nx = (x - cx) / rimRx;
        const ny = (y - yTop) / rimRy;
        const v = nx * nx + ny * ny;
        if (v >= 0.8 && v <= 1.0) {
          R = rim[0];
          G = rim[1];
          B = rim[2];
          A = 255;
        }
      }

      // 4) 热气（白色半透明，从碗口升起、向上渐隐）
      if (y >= yLo && y <= yHi) {
        let ha = 0;
        for (let k = 0; k < steamX.length; k++) {
          const d = Math.abs(x - steamX[k][y]);
          if (d <= thick) {
            const local = (y - yLo) / (yHi - yLo); // 底部浓、顶部淡
            const edge = 1 - d / thick;
            ha = Math.max(ha, 0.85 * local * edge);
          }
        }
        if (ha > 0) {
          R = Math.round(R + (steam[0] - R) * ha);
          G = Math.round(G + (steam[1] - G) * ha);
          B = Math.round(B + (steam[2] - B) * ha);
          A = 255;
        }
      }

      buf[i] = R;
      buf[i + 1] = G;
      buf[i + 2] = B;
      buf[i + 3] = A;
    }
  }

  // 5) 米饭点缀（碗内靠上的几个小圆，覆盖在碗白之上）
  const riceDots = [
    [cx - size * 0.1, yTop + size * 0.12, size * 0.028],
    [cx + size * 0.08, yTop + size * 0.1, size * 0.024],
    [cx + size * 0.02, yTop + size * 0.18, size * 0.03],
    [cx - size * 0.03, yTop + size * 0.08, size * 0.02],
  ];
  for (const [dxc, dyc, dr] of riceDots) {
    const x0 = Math.max(0, Math.floor(dxc - dr));
    const x1 = Math.min(size - 1, Math.ceil(dxc + dr));
    const y0 = Math.max(0, Math.floor(dyc - dr));
    const y1 = Math.min(size - 1, Math.ceil(dyc + dr));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ddx = x - dxc;
        const ddy = y - dyc;
        if (ddx * ddx + ddy * ddy <= dr * dr) {
          const nx = (x - cx) / Rx;
          const ny = (y - yTop) / Ry;
          if (ny >= 0 && nx * nx + ny * ny <= 1) {
            const i = (y * size + x) * 4;
            buf[i] = rice[0];
            buf[i + 1] = rice[1];
            buf[i + 2] = rice[2];
            buf[i + 3] = 255;
          }
        }
      }
    }
  }

  return buf;
}

function main() {
  if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

  const targets = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const t of targets) {
    const png = buildPng(t.size, makeIconPixels(t.size));
    const out = path.join(ICONS_DIR, t.name);
    fs.writeFileSync(out, png);
    console.log(`生成 ${t.name} (${t.size}x${t.size}) -> ${png.length} bytes`);
  }
}

main();
