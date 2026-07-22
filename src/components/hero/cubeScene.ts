import * as THREE from 'three';

/**
 * Процедурная изометрическая сцена из кубов для hero (Фаза 2 → ревизия по видео-референсу).
 *
 * Vanilla three.js (без react-three-fiber). Фабрика createScene() создаёт
 * рендерер поверх переданного <canvas> и строит МОНОЛИТНЫЙ кластер тёмных
 * «стеклянно-металлических» кубов — две доли (верхняя + нижняя) с узкой талией,
 * собранные из объединения целочисленных параллелепипедов (box-union), поэтому
 * грани плоские и заподлицо, а силуэт — чистый ступенчатый (клиент: «ровнее»).
 *
 * Материал — металлический, освещён ярким верхним key + кастомным градиентным
 * окружением (PMREM): верхние грани ловят светлое небо окружения → серебристо-серые
 * с «наклёпанной» фактурой (bump/roughness-карта), боковые уходят почти в чёрное
 * стекло с синими рефлексами. Плюс два пула бликов (крупные 4-лучевые звёзды +
 * мелкие искры), аддитивные рёбра и детерминированный бесшовный цикл сдвигов групп.
 *
 * Никакого рандома/времени на этапе SSR — весь сид задаётся здесь, на клиенте,
 * уже после mount, поэтому расхождений гидрации быть не может.
 */

export interface SceneHandle {
  /** Пауза/возобновление RAF (для visibility hidden / вне вьюпорта). */
  setPaused: (paused: boolean) => void;
  /** Полная очистка ресурсов three. */
  dispose: () => void;
  /** dataURL текущего кадра (для генерации постера/дебага). */
  capture: () => string | null;
  /** dataURL кадра фиксированного размера в «позе покоя» (для постера). */
  captureAt: (w: number, h: number, poseT?: number) => string | null;
  /** Ручной шаг симуляции на dt сек + рендер (только для offline-дебага/скринов). */
  advance: (dt: number) => void;
}

export interface SceneOptions {
  /** Вызывается один раз после первого успешного кадра — для кроссфейда. */
  onReady?: () => void;
  /** preserveDrawingBuffer для toDataURL (постер/скриншот). */
  capture?: boolean;
}

// ---------------------------------------------------------------------------
// Детерминированный ГПСЧ (mulberry32) — один и тот же кластер при каждой загрузке.
// ---------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const easeInOutCubic = (x: number): number =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// ---------------------------------------------------------------------------
// Параметры сцены (крутятся при визуальной сверке с референсом).
// ---------------------------------------------------------------------------
const SEED = 20260722; // фикс-сид: стабильный кластер и расписание сдвигов
const CUBE = 1; // ребро куба (world units)
const GAP = 0.05; // микро-зазор между кубами, чтобы читались рёбра-подразбивка граней
const STEP = CUBE + GAP; // шаг сетки
const LOOP = 15; // период бесшовного цикла сдвигов, сек
const SLAB_TARGET = 4; // сколько блоков 1×2 попытаться собрать (немного, ради вариативности)

// ---------------------------------------------------------------------------
// Текстура 4-лучевой звезды-блика (крупный «герой»: мягкое свечение + лучи).
// ---------------------------------------------------------------------------
function makeStarTexture(): THREE.Texture {
  const S = 128;
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = S;
  const ctx = cnv.getContext('2d')!;
  const c = S / 2;

  const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
  glow.addColorStop(0, 'rgba(190,224,255,0.99)');
  glow.addColorStop(0.1, 'rgba(105,178,255,0.78)');
  glow.addColorStop(0.28, 'rgba(34,120,242,0.34)');
  glow.addColorStop(0.6, 'rgba(16,72,185,0.1)');
  glow.addColorStop(1, 'rgba(10,40,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  const drawRay = (angle: number, len: number, width: number) => {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, 'rgba(228,244,255,0.97)');
    g.addColorStop(0.5, 'rgba(125,194,255,0.38)');
    g.addColorStop(1, 'rgba(120,190,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -width);
    ctx.lineTo(len, 0);
    ctx.lineTo(0, width);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  for (let i = 0; i < 4; i++) drawRay((i * Math.PI) / 2, c * 0.98, 2.3);
  for (let i = 0; i < 4; i++) drawRay((i * Math.PI) / 2 + Math.PI / 4, c * 0.5, 1.4);

  const core = ctx.createRadialGradient(c, c, 0, c, c, S * 0.07);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(1, 'rgba(210,235,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

// Мелкая точечная искра (второй слой бликов — dim pinpoints вдоль рёбер).
function makePinTexture(): THREE.Texture {
  const S = 64;
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = S;
  const ctx = cnv.getContext('2d')!;
  const c = S / 2;

  const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
  glow.addColorStop(0, 'rgba(215,238,255,0.95)');
  glow.addColorStop(0.25, 'rgba(110,180,255,0.45)');
  glow.addColorStop(0.7, 'rgba(30,100,220,0.08)');
  glow.addColorStop(1, 'rgba(10,40,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  // короткий тонкий крест
  const drawRay = (angle: number) => {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, 0, c * 0.72, 0);
    g.addColorStop(0, 'rgba(225,242,255,0.9)');
    g.addColorStop(1, 'rgba(150,200,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -0.9);
    ctx.lineTo(c * 0.72, 0);
    ctx.lineTo(0, 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  for (let i = 0; i < 4; i++) drawRay((i * Math.PI) / 2);

  const core = ctx.createRadialGradient(c, c, 0, c, c, S * 0.09);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(1, 'rgba(210,235,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

// Мягкое радиальное пятно (аддитивная «дымка» свечения за кластером).
function makeHazeTexture(): THREE.Texture {
  const S = 256;
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = S;
  const ctx = cnv.getContext('2d')!;
  const c = S / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, 'rgba(40,110,235,0.5)');
  g.addColorStop(0.4, 'rgba(20,70,190,0.18)');
  g.addColorStop(1, 'rgba(6,26,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  return tex;
}

// ---------------------------------------------------------------------------
// «Наклёпанная» металлическая фактура: многооктавный мягкий шум (мотл) +
// слабые направленные штрихи (brushed). Используется как bumpMap и roughnessMap.
// Тайлится бесшовно (оборачиваем координаты), нейтральный серый диапазон.
// ---------------------------------------------------------------------------
function makeGrainTexture(): THREE.Texture {
  const S = 256;
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = S;
  const ctx = cnv.getContext('2d')!;
  const rng = mulberry32(0x9e3779b9);

  // Тайлящееся value-noise: сумма октав на решётках-делителях S.
  const lattice = (cells: number): number[] => {
    const g = new Array(cells * cells);
    for (let i = 0; i < g.length; i++) g[i] = rng();
    return g;
  };
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const octaves = [
    { cells: 4, amp: 0.46 },
    { cells: 8, amp: 0.27 },
    { cells: 16, amp: 0.16 },
    { cells: 32, amp: 0.1 },
    { cells: 64, amp: 0.06 },
  ].map((o) => ({ ...o, grid: lattice(o.cells) }));

  const sample = (o: (typeof octaves)[number], x: number, y: number): number => {
    const { cells, grid } = o;
    const fx = x * cells;
    const fy = y * cells;
    const x0 = Math.floor(fx),
      y0 = Math.floor(fy);
    const tx = smooth(fx - x0),
      ty = smooth(fy - y0);
    const at = (ix: number, iy: number) =>
      grid[(((iy % cells) + cells) % cells) * cells + (((ix % cells) + cells) % cells)];
    const a = at(x0, y0),
      b = at(x0 + 1, y0),
      c = at(x0, y0 + 1),
      d = at(x0 + 1, y0 + 1);
    return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
  };

  const img = ctx.createImageData(S, S);
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      const u = px / S;
      const v = py / S;
      let n = 0;
      let norm = 0;
      for (const o of octaves) {
        // очень лёгкая анизотропия по X → органичный мотл, почти без «сетки»
        n += o.amp * sample(o, u * 1.12, v);
        norm += o.amp;
      }
      n /= norm; // 0..1
      // Контраст в средних тонах → «наклёпанный» мотл, без выбитых крайностей.
      n = 0.5 + (n - 0.5) * 1.72;
      // Редкие блестящие микро-зёрна (глянцевые точки на топах).
      if (rng() < 0.07) n = Math.min(1, n * 0.48);
      const g = Math.max(0, Math.min(255, Math.round(n * 255)));
      const idx = (py * S + px) * 4;
      img.data[idx] = g;
      img.data[idx + 1] = g;
      img.data[idx + 2] = g;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Направленные штрихи (brushed-грань как на видео): один доминирующий наклон,
  // тонкие светлые + тёмные линии, но заметно слабее общего мотла (без «сетки»).
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const y = rng() * S;
    const dark = rng() < 0.45;
    ctx.strokeStyle = dark ? '#000000' : '#ffffff';
    ctx.globalAlpha = (dark ? 0.02 : 0.03) + rng() * 0.035;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(S, y + (rng() - 0.5) * 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(cnv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2); // мельче зерно на грань → фактура, а не «плитка»
  tex.colorSpace = THREE.NoColorSpace; // это данные, не цвет
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = 4;
  return tex;
}

// ---------------------------------------------------------------------------
// Кастомное окружение (equirect-градиент) → PMREM. Даёт металлу «студийный»
// отклик: светлое небо сверху (серебристые топы), почти чёрный низ (тёмные бока),
// два синих пятна по бокам (синие рефлексы в стекле). Собирается на canvas.
// ---------------------------------------------------------------------------
function makeEnvEquirect(): THREE.Texture {
  const W = 512;
  const H = 256;
  const cnv = document.createElement('canvas');
  cnv.width = W;
  cnv.height = H;
  const ctx = cnv.getContext('2d')!;

  // Вертикальный градиент под ОРТО-ИЗО: верхние грани отражают элевацию ~+33° (v≈0.32),
  // боковые ~−33° (v≈0.68). Поэтому «небо» держим белым вплоть до v≈0.38 (яркие серебристые
  // топы), затем резкий спад к почти чёрному (тёмные стеклянные бока).
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0.0, '#ffffff');
  grad.addColorStop(0.34, '#f4f7fd'); // держим яркое небо до зоны отражения топов
  grad.addColorStop(0.42, '#9fabbd');
  grad.addColorStop(0.5, '#4a5568');
  grad.addColorStop(0.6, '#161d29');
  grad.addColorStop(0.72, '#080c14');
  grad.addColorStop(1.0, '#010208');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Яркое «key»-пятно у зенита (спереди-справа) — усиливает блик на топах.
  const key = ctx.createRadialGradient(W * 0.64, H * 0.12, 0, W * 0.64, H * 0.12, H * 0.6);
  key.addColorStop(0, 'rgba(255,255,255,0.9)');
  key.addColorStop(0.5, 'rgba(244,248,255,0.25)');
  key.addColorStop(1, 'rgba(244,248,255,0)');
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, W, H);

  // Синие рефлексы — в НИЖНЕЙ зоне (v≈0.62), чтобы красить только тёмные бока, не топы.
  const blueA = ctx.createRadialGradient(W * 0.15, H * 0.62, 0, W * 0.15, H * 0.62, H * 0.4);
  blueA.addColorStop(0, 'rgba(42,104,235,0.5)');
  blueA.addColorStop(0.5, 'rgba(22,58,150,0.15)');
  blueA.addColorStop(1, 'rgba(10,30,90,0)');
  ctx.fillStyle = blueA;
  ctx.fillRect(0, 0, W, H);

  const blueB = ctx.createRadialGradient(W * 0.85, H * 0.66, 0, W * 0.85, H * 0.66, H * 0.34);
  blueB.addColorStop(0, 'rgba(32,84,205,0.3)');
  blueB.addColorStop(1, 'rgba(10,30,90,0)');
  ctx.fillStyle = blueB;
  ctx.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(cnv);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Геометрия кластера: объединение целочисленных параллелепипедов (box-union).
// Две доли (нижняя + верхняя, смещённая по +x) соединены узкой талией, плюс
// несколько ступеней-выступов и вырезов — чистый ступенчатый монолит.
// ---------------------------------------------------------------------------
interface CubeCell {
  i: number;
  j: number;
  k: number;
}

// Инклюзивные диапазоны [x0,y0,z0, x1,y1,z1].
const ADD_BOXES: number[][] = [
  // ── нижняя доля ──
  [0, 0, 0, 2, 2, 2], // ядро 3×3×3
  [3, 0, 0, 3, 1, 1], // ступень вправо (+x)
  [0, 0, 3, 1, 1, 3], // ступень вперёд-влево (+z)
  [1, -1, 1, 2, -1, 2], // нижний выступ вниз (ступень)
  // ── талия (узкая шейка, читается как «две доли») ──
  [1, 3, 1, 2, 3, 2], // 2×1×2
  // ── верхняя доля (смещена по +x → ступенчатый стык) ──
  [1, 4, 0, 3, 6, 2], // ядро 3×3×3
  [2, 7, 0, 3, 7, 1], // пик 2×1×2 (крупный светлый топ)
  [1, 4, 3, 2, 5, 3], // ступень вперёд (+z)
  [4, 5, 0, 4, 6, 1], // ступень вправо (+x)
];
// Вырезы (после сложения) — добавляют ступенчатые уступы.
const NOTCH_BOXES: number[][] = [
  [3, 6, 2, 3, 6, 2], // срез верх-задне-правого угла
  [0, 2, 0, 0, 2, 0], // срез верх-задне-левого угла нижней доли
  [4, 6, 1, 4, 6, 1], // подрез правой ступени
];

function buildVoxels(): CubeCell[] {
  const present = new Set<string>();
  const key = (i: number, j: number, k: number) => `${i},${j},${k}`;
  const fill = (b: number[], add: boolean) => {
    const [x0, y0, z0, x1, y1, z1] = b;
    for (let i = x0; i <= x1; i++)
      for (let j = y0; j <= y1; j++)
        for (let k = z0; k <= z1; k++) {
          if (add) present.add(key(i, j, k));
          else present.delete(key(i, j, k));
        }
  };
  for (const b of ADD_BOXES) fill(b, true);
  for (const b of NOTCH_BOXES) fill(b, false);

  const cells: CubeCell[] = [];
  Array.from(present).forEach((s) => {
    const [i, j, k] = s.split(',').map(Number);
    cells.push({ i, j, k });
  });
  // Отбрасываем полностью внутренние кубы (все 6 соседей есть) — они невидимы.
  return cells.filter(({ i, j, k }) => {
    return !(
      present.has(key(i + 1, j, k)) &&
      present.has(key(i - 1, j, k)) &&
      present.has(key(i, j + 1, k)) &&
      present.has(key(i, j - 1, k)) &&
      present.has(key(i, j, k + 1)) &&
      present.has(key(i, j, k - 1))
    );
  });
}

// ---------------------------------------------------------------------------
// Блоки (piece): единичный куб или слэб 1×2, из ячеек сетки в world-координаты.
// ---------------------------------------------------------------------------
interface PieceDesc {
  base: THREE.Vector3; // центр блока в world (в покое)
  size: THREE.Vector3; // размеры в world units (для scale и half-extent)
}

function buildPieces(
  cells: CubeCell[],
  rng: () => number,
  cx: number,
  cy: number,
  cz: number,
): PieceDesc[] {
  const key = (i: number, j: number, k: number) => `${i},${j},${k}`;
  const present = new Set(cells.map((c) => key(c.i, c.j, c.k)));
  const used = new Set<string>();
  const world = (i: number, j: number, k: number) =>
    new THREE.Vector3((i - cx) * STEP, (j - cy) * STEP, (k - cz) * STEP);
  // предпочитаем горизонтальные слэбы (x/z) как в референсе
  const slabAxes = [
    [1, 0, 0],
    [0, 0, 1],
    [1, 0, 0],
    [0, 0, 1],
    [0, 1, 0],
  ];

  const order = cells
    .map((c) => ({ c, r: rng() }))
    .sort((a, b) => a.r - b.r)
    .map((o) => o.c);

  const pieces: PieceDesc[] = [];
  let slabs = 0;
  for (const c of order) {
    const k0 = key(c.i, c.j, c.k);
    if (used.has(k0)) continue;
    if (slabs < SLAB_TARGET && rng() < 0.5) {
      const [ax, ay, az] = slabAxes[Math.floor(rng() * slabAxes.length)];
      const nk = key(c.i + ax, c.j + ay, c.k + az);
      if (present.has(nk) && !used.has(nk)) {
        used.add(k0);
        used.add(nk);
        slabs++;
        const a = world(c.i, c.j, c.k);
        const b = world(c.i + ax, c.j + ay, c.k + az);
        pieces.push({
          base: a.clone().add(b).multiplyScalar(0.5),
          size: new THREE.Vector3(
            ax ? STEP + CUBE : CUBE,
            ay ? STEP + CUBE : CUBE,
            az ? STEP + CUBE : CUBE,
          ),
        });
        continue;
      }
    }
    used.add(k0);
    pieces.push({ base: world(c.i, c.j, c.k), size: new THREE.Vector3(CUBE, CUBE, CUBE) });
  }
  return pieces;
}

// ---------------------------------------------------------------------------
// Расписание сдвигов: детерминированное, бесшовное (в t=0 и t=LOOP смещения=0).
// Группировка соседей — по world-дистанции (работает и для слэбов).
// ---------------------------------------------------------------------------
interface Mover {
  idx: number[];
  axis: THREE.Vector3;
  tOut: number;
  dOut: number;
  tBack: number;
  dBack: number;
}

function buildMovers(
  pieces: PieceDesc[],
  rng: () => number,
): { movers: Mover[]; pieceMover: (number | null)[] } {
  const axes = [
    new THREE.Vector3(STEP, 0, 0),
    new THREE.Vector3(-STEP, 0, 0),
    new THREE.Vector3(0, STEP, 0),
    new THREE.Vector3(0, -STEP, 0),
    new THREE.Vector3(0, 0, STEP),
    new THREE.Vector3(0, 0, -STEP),
  ];
  const pieceMover: (number | null)[] = new Array(pieces.length).fill(null);
  const movers: Mover[] = [];
  const EVENTS = 13;

  for (let e = 0; e < EVENTS; e++) {
    let seed = -1;
    for (let tries = 0; tries < 40; tries++) {
      const cand = Math.floor(rng() * pieces.length);
      if (pieceMover[cand] === null) {
        seed = cand;
        break;
      }
    }
    if (seed < 0) break;

    const group = [seed];
    const base0 = pieces[seed].base;
    const near: number[] = [];
    for (let i = 0; i < pieces.length; i++) {
      if (i === seed || pieceMover[i] !== null) continue;
      if (pieces[i].base.distanceTo(base0) < STEP * 1.55) near.push(i);
    }
    near.sort(() => rng() - 0.5);
    const extra = Math.floor(rng() * 3); // группа до 3 блоков
    for (const i of near) {
      if (group.length - 1 >= extra) break;
      group.push(i);
    }

    const axis = axes[Math.floor(rng() * axes.length)];
    const dOut = 1.0 + rng() * 0.5; // ~1.0–1.5s
    const dBack = 1.0 + rng() * 0.5;
    const margin = 0.4;
    const hold = 0.8 + rng() * 2.2;
    const total = dOut + hold + dBack;
    const tOut = margin + rng() * (LOOP - total - 2 * margin);
    const tBack = tOut + dOut + hold;

    const mi = movers.push({ idx: group, axis, tOut, dOut, tBack, dBack }) - 1;
    for (const i of group) pieceMover[i] = mi;
  }

  return { movers, pieceMover };
}

function moverOffset(m: Mover, tLoop: number, out: THREE.Vector3): void {
  out.set(0, 0, 0);
  if (tLoop >= m.tOut && tLoop < m.tOut + m.dOut) {
    const p = easeInOutCubic((tLoop - m.tOut) / m.dOut);
    out.copy(m.axis).multiplyScalar(p);
  } else if (tLoop >= m.tOut + m.dOut && tLoop < m.tBack) {
    out.copy(m.axis);
  } else if (tLoop >= m.tBack && tLoop < m.tBack + m.dBack) {
    const p = easeInOutCubic(1 - (tLoop - m.tBack) / m.dBack);
    out.copy(m.axis).multiplyScalar(p);
  }
}

// ---------------------------------------------------------------------------
// Блики: два пула спрайтов (крупные звёзды + мелкие искры) на фронтальных вершинах.
// ---------------------------------------------------------------------------
interface GlintCfg {
  lifeMin: number;
  lifeRange: number;
  delayInit: number;
  delayMin: number;
  delayRange: number;
  scaleMin: number;
  scaleRange: number;
  heroChance: number;
  heroBonus: number;
  peakMin: number;
  peakRange: number;
  minScale: number;
}
interface Glint {
  sprite: THREE.Sprite;
  age: number;
  life: number;
  delay: number;
  maxScale: number;
  peak: number;
  cfg: GlintCfg;
}

export function createScene(
  canvas: HTMLCanvasElement,
  opts: SceneOptions = {},
): SceneHandle | null {
  const rng = mulberry32(SEED);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: opts.capture ?? false, // включаем только в дебаг-режиме
    });
    if (!renderer.getContext()) return null;
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0); // прозрачный фон → просвечивает #001a3d страницы
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // мягкие светлые топы без пересвета
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const container = new THREE.Group();
  scene.add(container);

  // --- окружение (PMREM из кастомного equirect-градиента) для металлических рефлексов ---
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envSrc = makeEnvEquirect();
  const envRT = pmrem.fromEquirectangular(envSrc);
  scene.environment = envRT.texture;
  envSrc.dispose();

  // --- камера: истинная изометрия (ортографическая) ---
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
  const isoDir = new THREE.Vector3(1, 0.82, 1).normalize();
  camera.position.copy(isoDir.clone().multiplyScalar(60));
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);

  // --- свет: сильный верхний key (светлый серебристо-синий верх),
  //     очень низкий ambient/hemi → боковые грани уходят почти в чёрный,
  //     синий контровой сзади + мягкий синий подсвет спереди-снизу («стекло») ---
  const hemi = new THREE.HemisphereLight(0x565b64, 0x01040a, 0.13); // нейтральное небо → топы без синевы
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xf8faff, 2.3); // резкий блик на верхних рёбрах (спекуляр)
  key.position.set(1.5, 12.5, 3.0);
  scene.add(key);
  const rimBack = new THREE.DirectionalLight(0x2b5cff, 0.68); // синий контровой сзади (акцент)
  rimBack.position.set(-5, 2, -8);
  scene.add(rimBack);
  const fillBlue = new THREE.DirectionalLight(0x1c46d8, 0.18); // едва заметный синий подсвет («стекло»)
  fillBlue.position.set(-6, -3, 5);
  scene.add(fillBlue);
  scene.add(new THREE.AmbientLight(0x0a1424, 0.05)); // очень низкий → бока почти в чёрный

  // --- геометрия + «наклёпанная» карта (bump + roughness) ---
  const boxGeo = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
  const edgeGeo = new THREE.EdgesGeometry(boxGeo);
  const grainTex = makeGrainTexture();
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0xbcd6f2,
    transparent: true,
    opacity: 0.46,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const cells = buildVoxels();
  let cx = 0,
    cy = 0,
    cz = 0;
  for (const c of cells) {
    cx += c.i;
    cy += c.j;
    cz += c.k;
  }
  cx /= cells.length;
  cy /= cells.length;
  cz /= cells.length;

  const pieces = buildPieces(cells, rng, cx, cy, cz);

  // --- меши блоков: у каждого свой материал (джиттер яркости/шероховатости) ---
  interface PieceObj {
    group: THREE.Group;
    base: THREE.Vector3;
    half: THREE.Vector3;
  }
  const pieceObjs: PieceObj[] = [];
  const bodyMats: THREE.MeshStandardMaterial[] = [];
  const baseColor = new THREE.Color(0xb4b9c2); // светлый нейтральный → серебристый рефлекс
  for (const p of pieces) {
    const mat = new THREE.MeshStandardMaterial({
      // зеркальный тёмный «хром»: топы ловят белое небо окружения → серебро; бока → чёрное
      color: baseColor.clone().multiplyScalar(0.86 + rng() * 0.26), // ±яркость на блок
      metalness: 0.78 + rng() * 0.12,
      roughness: 0.28 + rng() * 0.2,
      roughnessMap: grainTex,
      bumpMap: grainTex,
      bumpScale: 0.04,
      envMapIntensity: 1.1 + rng() * 0.18,
      emissive: 0x050609,
    });
    bodyMats.push(mat);

    const g = new THREE.Group();
    g.position.copy(p.base);
    g.scale.copy(p.size); // единичный бокс → размер блока (слэб = длиннее по одной оси)
    const mesh = new THREE.Mesh(boxGeo, mat);
    g.add(mesh);
    g.add(new THREE.LineSegments(edgeGeo, edgeMat));
    container.add(g);
    pieceObjs.push({ group: g, base: p.base, half: p.size.clone().multiplyScalar(0.5) });
  }

  // --- фронтальные вершины блоков для бликов ---
  const camDir = isoDir.clone();
  const vertsWorld: THREE.Vector3[] = [];
  const signs = [-0.5, 0.5];
  const seenV = new Set<string>();
  for (const po of pieceObjs) {
    for (const sx of signs)
      for (const sy of signs)
        for (const sz of signs) {
          const v = new THREE.Vector3(
            po.base.x + sx * 2 * po.half.x,
            po.base.y + sy * 2 * po.half.y,
            po.base.z + sz * 2 * po.half.z,
          );
          if (v.clone().dot(camDir) < 0.2) continue;
          const kk = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
          if (seenV.has(kk)) continue;
          seenV.add(kk);
          vertsWorld.push(v);
        }
  }

  // --- два пула бликов ---
  const starTex = makeStarTexture();
  const pinTex = makePinTexture();
  const glints: Glint[] = [];

  const spawnGlint = (gl: Glint, initial: boolean) => {
    const cfg = gl.cfg;
    gl.age = 0;
    gl.life = cfg.lifeMin + rng() * cfg.lifeRange;
    gl.delay = initial ? rng() * cfg.delayInit : cfg.delayMin + rng() * cfg.delayRange;
    gl.maxScale =
      cfg.scaleMin + rng() * cfg.scaleRange + (rng() < cfg.heroChance ? cfg.heroBonus : 0);
    gl.peak = cfg.peakMin + rng() * cfg.peakRange;
    gl.sprite.position.copy(vertsWorld[Math.floor(rng() * vertsWorld.length)]);
  };

  const addPool = (count: number, tex: THREE.Texture, color: number, cfg: GlintCfg) => {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        color,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        opacity: 0,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.setScalar(0.001);
      container.add(sprite);
      const gl: Glint = { sprite, age: 0, life: 1, delay: 0, maxScale: 1, peak: 1, cfg };
      spawnGlint(gl, true);
      glints.push(gl);
    }
  };

  const heroCfg: GlintCfg = {
    lifeMin: 0.7,
    lifeRange: 1.1,
    delayInit: 1.8,
    delayMin: 0.2,
    delayRange: 1.6,
    scaleMin: 0.85,
    scaleRange: 1.0,
    heroChance: 0.26,
    heroBonus: 1.45,
    peakMin: 0.95,
    peakRange: 0.05,
    minScale: 0.12,
  };
  const pinCfg: GlintCfg = {
    lifeMin: 0.35,
    lifeRange: 0.7,
    delayInit: 1.3,
    delayMin: 0.08,
    delayRange: 0.9,
    scaleMin: 0.1,
    scaleRange: 0.28,
    heroChance: 0,
    heroBonus: 0,
    peakMin: 0.45,
    peakRange: 0.4,
    minScale: 0.02,
  };
  const heroCount = Math.min(18, Math.max(10, Math.floor(vertsWorld.length * 0.24)));
  const pinCount = Math.min(72, Math.max(34, Math.floor(vertsWorld.length * 1.0)));
  addPool(heroCount, starTex, 0x9fd0ff, heroCfg);
  addPool(pinCount, pinTex, 0xcfe6ff, pinCfg);

  // --- дымка свечения за кластером (фейковый bloom-ambient) ---
  const hazeMat = new THREE.SpriteMaterial({
    map: makeHazeTexture(),
    color: 0x1e5bd6,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    opacity: 0.55,
  });
  const haze = new THREE.Sprite(hazeMat);
  haze.scale.setScalar(13);
  haze.position.set(0, 0, -2);
  container.add(haze);

  // --- подгонка ортокамеры под кластер: «contain» по экранным экстентам ---
  // Проецируем углы всех блоков на оси камеры (right/up) и берём макс-экстенты,
  // затем строим кадр под текущий aspect так, чтобы кластер заполнял связывающее
  // измерение (для вытянутого портрета — по высоте) → крупнее в кадре, чем по сфере.
  camera.updateMatrixWorld();
  const camRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const camUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  let extentX = 0.001;
  let extentY = 0.001;
  const corner = new THREE.Vector3();
  for (const po of pieceObjs) {
    for (const sx of [-1, 1])
      for (const sy of [-1, 1])
        for (const sz of [-1, 1]) {
          corner.set(
            po.base.x + sx * po.half.x,
            po.base.y + sy * po.half.y,
            po.base.z + sz * po.half.z,
          );
          extentX = Math.max(extentX, Math.abs(corner.dot(camRight)));
          extentY = Math.max(extentY, Math.abs(corner.dot(camUp)));
        }
  }
  const FIT_MARGIN = STEP * 0.85; // запас под сдвиги блоков (макс. проекция сдвига ≈ STEP)
  const computeFrame = (aspect: number) => {
    const halfW = Math.max(extentX + FIT_MARGIN, (extentY + FIT_MARGIN) * aspect);
    return { halfW, halfH: halfW / aspect };
  };
  const applyFrame = (w: number, h: number) => {
    const { halfW, halfH } = computeFrame(w / h);
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  const fit = () => applyFrame(canvas.clientWidth || 1, canvas.clientHeight || 1);
  fit();

  // --- цикл анимации (своё время с клампом dt — без прыжков после паузы) ---
  let simTime = 0;
  let lastNow = performance.now();
  let raf = 0;
  let paused = false;
  let ready = false;
  const tmp = new THREE.Vector3();
  const { movers, pieceMover } = buildMovers(pieces, rng);

  const update = (dt: number) => {
    simTime += dt;
    const t = simTime;
    const tLoop = t % LOOP;

    // Периоды bob/breathe делят LOOP (15с) нацело (7.5=2×, 5=3×) → всё возвращается
    // к нулю в t=0 и t=LOOP: весь цикл (не только сдвиги) бесшовен без единого скачка.
    container.position.y = Math.sin((t / 7.5) * Math.PI * 2) * 0.18; // общий bob (2 цикла/LOOP)
    container.scale.setScalar(1 + Math.sin((t / 5) * Math.PI * 2) * 0.012); // «дыхание» (3 цикла/LOOP)

    for (let i = 0; i < pieceObjs.length; i++) {
      const mi = pieceMover[i];
      if (mi === null) continue;
      moverOffset(movers[mi], tLoop, tmp);
      pieceObjs[i].group.position.copy(pieceObjs[i].base).add(tmp);
    }

    for (const gl of glints) {
      const mat = gl.sprite.material as THREE.SpriteMaterial;
      if (gl.delay > 0) {
        gl.delay -= dt;
        mat.opacity = 0;
        gl.sprite.scale.setScalar(0.001);
        continue;
      }
      gl.age += dt;
      if (gl.age >= gl.life) {
        spawnGlint(gl, false);
        continue;
      }
      const p = gl.age / gl.life;
      let env: number;
      if (p < 0.18) env = easeInOutCubic(p / 0.18);
      else if (p > 0.72) env = easeInOutCubic(Math.max(0, (1 - p) / 0.28));
      else env = 1;
      mat.opacity = env * gl.peak;
      gl.sprite.scale.setScalar(gl.cfg.minScale + env * gl.maxScale);
    }

    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      opts.onReady?.();
    }
  };

  const loop = () => {
    if (paused) return;
    const now = performance.now();
    let dt = (now - lastNow) / 1000;
    lastNow = now;
    if (dt > 0.1) dt = 0.1;
    update(dt);
    raf = requestAnimationFrame(loop);
  };

  const ro = new ResizeObserver(() => fit());
  ro.observe(canvas);

  loop();

  return {
    setPaused(p: boolean) {
      if (p === paused) return;
      paused = p;
      if (!p) {
        lastNow = performance.now();
        loop();
      } else {
        cancelAnimationFrame(raf);
      }
    },
    capture() {
      try {
        update(0);
        return canvas.toDataURL('image/png');
      } catch {
        return null;
      }
    },
    captureAt(w: number, h: number, poseT = 0) {
      // Постер: фиксированный размер, поза покоя (по умолчанию t=0 → все сдвиги=0).
      const prevW = canvas.clientWidth || w;
      const prevH = canvas.clientHeight || h;
      const prevRatio = renderer.getPixelRatio();
      const prevTime = simTime;
      try {
        renderer.setPixelRatio(1);
        applyFrame(w, h);
        simTime = poseT;
        update(0);
        return canvas.toDataURL('image/png');
      } catch {
        return null;
      } finally {
        simTime = prevTime;
        renderer.setPixelRatio(prevRatio);
        renderer.setSize(prevW, prevH, false);
        fit();
      }
    },
    advance(dt: number) {
      update(dt);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      boxGeo.dispose();
      edgeGeo.dispose();
      edgeMat.dispose();
      grainTex.dispose();
      envRT.texture.dispose();
      pmrem.dispose();
      for (const m of bodyMats) m.dispose();
      starTex.dispose();
      pinTex.dispose();
      hazeMat.map?.dispose();
      hazeMat.dispose();
      for (const gl of glints) (gl.sprite.material as THREE.SpriteMaterial).dispose();
      renderer.dispose();
    },
  };
}
