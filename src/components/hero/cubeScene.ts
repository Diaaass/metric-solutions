import * as THREE from 'three';
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  FXAAEffect,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from 'postprocessing';

/**
 * Процедурная изометрическая сцена из кубов для hero (Этап 1: рендер-пайплайн).
 *
 * Vanilla three.js (без react-three-fiber). Фабрика createScene() создаёт
 * рендерер поверх переданного <canvas> и строит МОНОЛИТНЫЙ кластер тёмных
 * «стеклянно-металлических» кубов — две доли (верхняя + нижняя) с узкой талией,
 * собранные из объединения целочисленных параллелепипедов (box-union), поэтому
 * грани плоские и заподлицо, а силуэт — чистый ступенчатый.
 *
 * Материал — металлический, освещён ярким верхним key + кастомным градиентным
 * окружением (PMREM): верхние грани ловят светлое небо окружения → серебристо-серые
 * с «наклёпанной» фактурой (bump/roughness-карта), боковые уходят почти в чёрное
 * стекло с синими рефлексами.
 *
 * СВЕЧЕНИЕ — НАСТОЯЩЕЕ (postprocessing EffectComposer):
 *   RenderPass (сцена → HDR half-float буфер, тонмаппинг рендерера ВЫКЛЮЧЕН)
 *   → EffectPass(BloomEffect(threshold 1.0, mipmapBlur, levels 8) → ToneMappingEffect(ACES))
 * Рёбра-LineSegments и спрайты-блики — HDR-эмиттеры (цвет ×N > 1.0, toneMapped:false),
 * поэтому порог свечения проходят ТОЛЬКО они, а глянцевые грани (линейно < 1.0)
 * не блумят. Никаких запечённых halo-текстур: ореол считает bloom.
 *
 * ИНИЦИАЛИЗАЦИЯ — ПОЭТАПНАЯ (защита INP): сборка разбита на куски, между
 * которыми отдаём поток браузеру (scheduler.yield / setTimeout(0)); шейдеры
 * прекомпилируются через renderer.compileAsync до первого кадра и кроссфейда.
 *
 * Никакого рандома/времени на этапе SSR — весь сид задаётся здесь, на клиенте,
 * уже после mount, поэтому расхождений гидрации быть не может.
 */

/** Блок кластера: база лупа + слот аддитивного офсета для интерактива (этап 2). */
export interface CubePiece {
  /** Позиция блока в покое (world). */
  readonly base: THREE.Vector3;
  /** Половинные размеры блока (хитбокс для raycast/репульсии). */
  readonly half: THREE.Vector3;
  /**
   * Аддитивный офсет интерактива — этап 2 (репульсия/волны) пишет СЮДА.
   * Итог: position = base + офсет фонового лупа + offset. Луп не ломается.
   */
  readonly offset: THREE.Vector3;
}

/**
 * Тест-хуки интерактива (этап 2). Заполняются контроллером cubeInteractions
 * при ?cubesdebug — сцена сама их не реализует, ей нужен только слот в типе.
 */
export interface InteractDebug {
  /** Синтетический указатель в NDC канваса: x вправо, y вверх, обе [-1,1]. */
  setPointer: (nx: number, ny: number) => void;
  /** Убрать указатель (как pointerleave) — всё возвращается к нейтрали. */
  clearPointer: () => void;
  /** Волна из точки NDC (как pointerdown). */
  triggerWave: (nx: number, ny: number) => void;
  /** Полностью выключить интерактив и обнулить офсеты (проверка лупа). */
  setEnabled: (on: boolean) => void;
  /** Автодрейф наклона (тач-режим) — при детерминированных захватах выключать. */
  setDrift: (on: boolean) => void;
  /** Снимок состояния интерактива (офсеты блоков, наклон, волны, цена кадра). */
  dump: () => unknown;
}

/** Настройки качества (этап 3: лесенка деградации). */
export interface QualityOptions {
  /** Кол-во MIP-уровней блюра bloom: 8 desktop, 4–5 mobile. */
  bloomLevels?: number;
  /** Сила bloom. */
  bloomIntensity?: number;
  /** DPR рендера. */
  pixelRatio?: number;
  /**
   * Постфильтр сглаживания (FXAA). По умолчанию ВЫКЛЮЧЕН: основное сглаживание —
   * пол DPR 1.5 (суперсэмплинг). Включается лесенкой на ступени «DPR → 1».
   */
  aa?: boolean;
  /**
   * Bloom целиком. false — проход блума отключается, а вместо него включается
   * «дешёвый» фейковый ореол на спрайтах-бликах (см. fakeGlow), чтобы сцена не
   * стала плоской. Нижняя ступень лесенки деградации.
   */
  bloom?: boolean;
}

export interface SceneHandle {
  /** Пауза/возобновление RAF (для visibility hidden / вне вьюпорта). */
  setPaused: (paused: boolean) => void;
  /** Полная очистка ресурсов three. */
  dispose: () => void;
  /** dataURL текущего кадра (для генерации постера/дебага). */
  capture: () => string | null;
  /**
   * dataURL кадра фиксированного размера в «позе покоя» (для постера).
   * bg — если задан, кадр композитится на непрозрачный фон (для сверки скринов);
   * без него отдаётся прозрачный PNG/WebP с починенной альфой (см. exportFrame).
   */
  captureAt: (
    w: number,
    h: number,
    poseT?: number,
    mime?: string,
    quality?: number,
    bg?: [number, number, number],
  ) => string | null;
  /** Ручной шаг симуляции на dt сек + рендер (только для offline-дебага/скринов). */
  advance: (dt: number) => void;
  /** Блоки кластера — база + слот аддитивного офсета (этап 2). */
  pieces: readonly CubePiece[];
  /** Группа-обёртка над кластером: наклон/параллакс от курсора (этап 2). */
  tiltGroup: THREE.Group;
  /**
   * Группа самого кластера (внутри tiltGroup, несёт bob/breathe). Координаты
   * piece.base заданы в ЕЁ системе — этап 2 переводит сюда точку луча
   * (cluster.worldToLocal), чтобы наклон/дыхание не сбивали репульсию.
   */
  cluster: THREE.Group;
  /** Ортокамера сцены (этап 2: raycast курсора в плоскость кластера). */
  camera: THREE.OrthographicCamera;
  /** Колбэк перед каждым кадром — этап 2 считает здесь пружины/волны. */
  onFrame: ((t: number, dt: number) => void) | null;
  /** Рантайм-переключение качества (этап 3). */
  setQuality: (q: QualityOptions) => void;
  /** Ссылки на внутренности — только в debug-режиме (?cubesdebug). */
  debug?: SceneDebug;
}

export interface SceneDebug {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  composer: EffectComposer;
  bloom: BloomEffect;
  /** Материал рёбер — .visible=false скрывает все рёбра (замер спекуляров). */
  edgeMat: THREE.LineBasicMaterial;
  /** Группа всех спрайтов-бликов — .visible=false скрывает блики. */
  glintGroup: THREE.Group;
  /** Материал широкой синей «атмосферы». */
  hazeMat: THREE.SpriteMaterial;
  /**
   * Прогон лесенки деградации на синтетическом времени кадра: подсовывает
   * `frames` замеров по `frameMs` мс с виртуально идущими часами, чтобы
   * кулдаун между шагами отрабатывал без реального ожидания.
   */
  feedFrameTimes: (frameMs: number, frames: number) => void;
  /** Текущее состояние лесенки (номер шага, остановлена ли). */
  ladderState: () => { step: number; done: boolean; pixelRatio: number; fakeGlow: boolean };
  /** Тест-хуки интерактива — ставит контроллер cubeInteractions (этап 2). */
  interact?: InteractDebug;
}

export interface SceneOptions extends QualityOptions {
  /** Вызывается один раз после первого успешного кадра — для кроссфейда. */
  onReady?: () => void;
  /** preserveDrawingBuffer для toDataURL (постер/скриншот) + debug-ссылки. */
  capture?: boolean;
  /**
   * Контекст WebGL потерян (iOS-регрессии по памяти, сон GPU, смена видеокарты).
   * Восстановление НЕ запрашиваем: возвращаем постер — это и надёжнее, и дешевле.
   */
  onContextLost?: () => void;
  /**
   * Лесенка деградации исчерпана: даже на минимальном качестве кадр не укладывается
   * в бюджет. Сцену дальше не крутим — зовущий возвращает постер.
   */
  onExhausted?: () => void;
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
/** Шаг сетки кластера в world units — интерактив (этап 2) меряет всё в них. */
export const GRID_STEP = STEP;
const LOOP = 15; // период бесшовного цикла сдвигов, сек
const SLAB_TARGET = 4; // сколько блоков 1×2 попытаться собрать (немного, ради вариативности)

// --- HDR-эмиттеры: множители цвета ВЫШЕ 1.0 → проходят порог bloom (1.0) ---
// Только эти объекты светятся; тонмаппинг к ним не применяется (toneMapped:false).
const EDGE_COLOR = 0xb2cff0;
const EDGE_HDR = 3.0; // рёбра: linear(EDGE_COLOR)*3.0*0.46 → lum ≈ 0.87; порог берут поверх светлых топов
const STAR_COLOR = 0x5aaeff; // насыщённо-синий: ядро после ACES уходит в белый, ореол остаётся синим
const STAR_HDR = 5.0; // ядро крупного блика: lum ≈ 2.3 → уверенно за порогом bloom
const PIN_COLOR = 0x77bcff;
const PIN_HDR = 3.0; // мелкие искры
const BLOOM_INTENSITY = 0.75;
const BLOOM_LEVELS = 8; // desktop; этап 3 опустит до 4–5 на мобилке
const BLOOM_RADIUS = 0.85;
// Широкая синяя «атмосфера» рисуется поверх кластера (depthTest:false, аддитивно),
// поэтому напрямую поднимает дно тёмных боковых граней и съедает контраст. Держим
// её ровно настолько, чтобы читалась синяя среда референса (0.55 → 0.45 → 0.30).
const HAZE_OPACITY = 0.3;
const EXPOSURE = 1.12; // читается ToneMappingEffect'ом через uniform toneMappingExposure

// ---------------------------------------------------------------------------
// Текстура 4-лучевой звезды-блика. ТОЛЬКО ФОРМА (ядро + лучи), без запечённого
// halo: мягкий ореол вокруг рисует настоящий bloom.
// ---------------------------------------------------------------------------
function makeStarTexture(): THREE.Texture {
  const S = 128;
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = S;
  const ctx = cnv.getContext('2d')!;
  const c = S / 2;

  // Профиль луча подобран ПОД HDR-множитель: у самого ядра альфа 1 (цвет×STAR_HDR
  // уходит за порог bloom → ореол), дальше резкий спад, чтобы тело луча в линейных
  // единицах осталось таким же, как было до HDR (иначе весь луч выжигается в белый).
  const drawRay = (angle: number, len: number, width: number) => {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.1, 'rgba(226,242,255,0.34)');
    g.addColorStop(0.45, 'rgba(150,205,255,0.12)');
    g.addColorStop(1, 'rgba(130,190,255,0)');
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

  // компактное ядро — источник ореола для bloom
  const core = ctx.createRadialGradient(c, c, 0, c, c, S * 0.1);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.4, 'rgba(232,246,255,0.42)');
  core.addColorStop(1, 'rgba(210,235,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

// Мелкая точечная искра — тоже только форма (короткий крест + ядро).
function makePinTexture(): THREE.Texture {
  const S = 64;
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = S;
  const ctx = cnv.getContext('2d')!;
  const c = S / 2;

  const drawRay = (angle: number) => {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, 0, c * 0.72, 0);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(210,235,255,0.32)');
    g.addColorStop(1, 'rgba(180,215,255,0)');
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

  const core = ctx.createRadialGradient(c, c, 0, c, c, S * 0.11);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.5, 'rgba(225,242,255,0.4)');
  core.addColorStop(1, 'rgba(210,235,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

// Мягкий круглый ореол — ФОЛБЭК на самой нижней ступени лесенки деградации,
// когда проход bloom отключён совсем. Досветка «запечённым» halo-спрайтом за
// каждым крупным бликом (подход до этапа 1): сцена не становится плоской, а
// стоит это один дополнительный спрайт на блик и НОЛЬ полноэкранных проходов.
// Создаётся лениво — на здоровых устройствах не тратим ни памяти, ни времени.
function makeHaloTexture(): THREE.Texture {
  const S = 128;
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = S;
  const ctx = cnv.getContext('2d')!;
  const c = S / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, 'rgba(226,242,255,0.6)');
  g.addColorStop(0.16, 'rgba(140,200,255,0.2)');
  g.addColorStop(0.45, 'rgba(70,150,255,0.06)');
  g.addColorStop(1, 'rgba(30,90,220,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

// Широкая синяя «атмосфера» за кластером. Это НЕ фейковый ореол эмиттеров
// (их теперь рисует настоящий bloom), а отдельный слой рассеянного синего света:
// он даёт кластеру ту же синюю среду, что в утверждённом рендере. Держится
// заведомо НИЖЕ порога bloom, поэтому в свечение не подмешивается.
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
  // Ниже 0.5 — зона, которую отражают БОКОВЫЕ грани. Спад делаем резче и глубже:
  // референс (raw1/видео) — почти чёрное глянцевое стекло по бокам, светлое только
  // сверху. Пологий спад давал «серые» бока и съедал контраст между верхом и боком.
  grad.addColorStop(0.5, '#333c4b');
  grad.addColorStop(0.6, '#0d121b');
  grad.addColorStop(0.72, '#05080e');
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
  blueA.addColorStop(0, 'rgba(42,104,235,0.42)');
  blueA.addColorStop(0.5, 'rgba(22,58,150,0.1)');
  blueA.addColorStop(1, 'rgba(10,30,90,0)');
  ctx.fillStyle = blueA;
  ctx.fillRect(0, 0, W, H);

  const blueB = ctx.createRadialGradient(W * 0.85, H * 0.66, 0, W * 0.85, H * 0.66, H * 0.34);
  blueB.addColorStop(0, 'rgba(32,84,205,0.24)');
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

// ---------------------------------------------------------------------------
// Отдать поток браузеру между кусками инициализации (защита INP / long tasks).
// ---------------------------------------------------------------------------
interface Scheduler {
  yield?: () => Promise<void>;
}
function yieldToMain(): Promise<void> {
  const s = (globalThis as unknown as { scheduler?: Scheduler }).scheduler;
  return s?.yield ? s.yield() : new Promise<void>((r) => setTimeout(r, 0));
}

export async function createScene(
  canvas: HTMLCanvasElement,
  opts: SceneOptions = {},
): Promise<SceneHandle | null> {
  const rng = mulberry32(SEED);

  // Инструментовка: каждый кусок init'а меряется, самый длинный виден в
  // performance.getEntriesByType('measure') (цель — ни одного >200 мс).
  let tChunk = performance.now();
  const chunk = async (name: string): Promise<void> => {
    const end = performance.now();
    try {
      performance.measure(`hero:init:${name}`, { start: tChunk, end });
    } catch {
      /* Safari <16.4 без объектной формы measure — метрика не критична */
    }
    await yieldToMain();
    tChunk = performance.now();
  };

  // ---- 1. рендерер --------------------------------------------------------
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // MSAA не нужен: композер рендерит в свой буфер (multisampling: 0)
      alpha: true,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: opts.capture ?? false, // включаем только в дебаг-режиме
    });
    if (!renderer.getContext()) return null;
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0); // прозрачный фон → просвечивает #001a3d страницы
  // Пол DPR 1.5 даже на не-retina мониторах: суперсэмплинг восстанавливает
  // субпиксельную информацию, которой у морфологического SMAA просто нет
  // (замер: PSNR по краям 21.2 дБ против 15.3 дБ на DPR 1). Канвас маленький,
  // 2.25× пикселей — это 0.41 Мп, для любой GPU пренебрежимо; а если устройство
  // всё-таки не тянет, лесенка деградации опустит DPR ниже пола (см. HeroCubes).
  renderer.setPixelRatio(
    opts.pixelRatio ?? Math.max(1.5, Math.min(window.devicePixelRatio || 1, 2)),
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Тонмаппинг УБРАН из материалов: буфер композера линейный HDR, ACES применяет
  // ToneMappingEffect уже ПОСЛЕ bloom. Экспозиция уезжает в шейдер эффекта
  // автоматически (three заливает uniform toneMappingExposure в любой материал).
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = EXPOSURE;

  const scene = new THREE.Scene();
  const tiltGroup = new THREE.Group(); // этап 2: наклон/параллакс от курсора
  const container = new THREE.Group(); // фоновый bob/breathe
  tiltGroup.add(container);
  scene.add(tiltGroup);

  // --- камера: истинная изометрия (ортографическая) ---
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
  const isoDir = new THREE.Vector3(1, 0.82, 1).normalize();
  camera.position.copy(isoDir.clone().multiplyScalar(60));
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);

  // --- свет: сильный верхний key (светлый серебристо-синий верх),
  //     очень низкий ambient/hemi → боковые грани уходят почти в чёрный,
  //     синий контровой сзади + мягкий синий подсвет спереди-снизу («стекло») ---
  const hemi = new THREE.HemisphereLight(0x565b64, 0x01040a, 0.1); // нейтральное небо → топы без синевы
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xf8faff, 2.3); // резкий блик на верхних рёбрах (спекуляр)
  key.position.set(1.5, 12.5, 3.0);
  scene.add(key);
  const rimBack = new THREE.DirectionalLight(0x2b5cff, 0.6); // синий контровой сзади (акцент)
  rimBack.position.set(-5, 2, -8);
  scene.add(rimBack);
  const fillBlue = new THREE.DirectionalLight(0x1c46d8, 0.12); // едва заметный синий подсвет («стекло»)
  fillBlue.position.set(-6, -3, 5);
  scene.add(fillBlue);
  scene.add(new THREE.AmbientLight(0x0a1424, 0.035)); // очень низкий → бока почти в чёрный

  await chunk('renderer');

  // ---- 2. окружение (PMREM из кастомного equirect-градиента) --------------
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envSrc = makeEnvEquirect();
  const envRT = pmrem.fromEquirectangular(envSrc);
  scene.environment = envRT.texture;
  envSrc.dispose();

  await chunk('env');

  // ---- 3. геометрия + «наклёпанная» карта (bump + roughness) --------------
  const boxGeo = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
  const edgeGeo = new THREE.EdgesGeometry(boxGeo);
  const grainTex = makeGrainTexture();
  // HDR-эмиттер №1: рёбра. Цвет ×EDGE_HDR > 1.0 → проходят порог bloom.
  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(EDGE_COLOR).multiplyScalar(EDGE_HDR),
    transparent: true,
    opacity: 0.46,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
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

  await chunk('geometry');

  // ---- 4. меши блоков (батчами, с отдачей потока между батчами) -----------
  // У каждого блока свой материал (джиттер яркости/шероховатости).
  interface PieceObj {
    group: THREE.Group;
    base: THREE.Vector3;
    half: THREE.Vector3;
    offset: THREE.Vector3;
  }
  const pieceObjs: PieceObj[] = [];
  const bodyMats: THREE.MeshStandardMaterial[] = [];
  const baseColor = new THREE.Color(0xb4b9c2); // светлый нейтральный → серебристый рефлекс
  const BATCH = 16;
  for (let start = 0; start < pieces.length; start += BATCH) {
    for (const p of pieces.slice(start, start + BATCH)) {
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
      pieceObjs.push({
        group: g,
        base: p.base,
        half: p.size.clone().multiplyScalar(0.5),
        offset: new THREE.Vector3(),
      });
    }
    await chunk('meshes');
  }

  // ---- 5. блики (два пула HDR-спрайтов) -----------------------------------
  // Фронтальные вершины блоков — точки, где рождаются блики.
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

  const starTex = makeStarTexture();
  const pinTex = makePinTexture();
  const glints: Glint[] = [];
  const glintGroup = new THREE.Group();
  container.add(glintGroup);

  const spawnGlint = (gl: Glint, initial: boolean) => {
    const cfg = gl.cfg;
    gl.age = 0;
    gl.life = cfg.lifeMin + rng() * cfg.lifeRange;
    if (initial) {
      // Пул стартует «в полёте»: часть бликов уже горит на ПЕРВОМ кадре, остальные
      // ждут своей очереди. Иначе первую пару секунд кластер стоит без искр — и
      // постер (снимается в позе t=0) не совпал бы с первым живым кадром, из-за
      // чего кроссфейд давал бы вспышку. Сид фиксирован, так что это состояние
      // одинаково у постера и у любого пользователя.
      const alive = rng() < 0.45;
      gl.delay = alive ? 0 : rng() * cfg.delayInit;
      gl.age = alive ? rng() * gl.life * 0.7 : 0;
    } else {
      gl.delay = cfg.delayMin + rng() * cfg.delayRange;
    }
    gl.maxScale =
      cfg.scaleMin + rng() * cfg.scaleRange + (rng() < cfg.heroChance ? cfg.heroBonus : 0);
    gl.peak = cfg.peakMin + rng() * cfg.peakRange;
    gl.sprite.position.copy(vertsWorld[Math.floor(rng() * vertsWorld.length)]);
  };

  // HDR-эмиттеры №2: блики. Цвет ×N > 1.0 → ядро и лучи блумят, ореол рисует bloom.
  const addPool = (count: number, tex: THREE.Texture, color: THREE.Color, cfg: GlintCfg) => {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        color,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        opacity: 0,
        toneMapped: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.setScalar(0.001);
      glintGroup.add(sprite);
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
  addPool(heroCount, starTex, new THREE.Color(STAR_COLOR).multiplyScalar(STAR_HDR), heroCfg);
  addPool(pinCount, pinTex, new THREE.Color(PIN_COLOR).multiplyScalar(PIN_HDR), pinCfg);

  // --- фолбэк-ореолы (включаются только когда bloom выключен лесенкой) ---
  const haloGroup = new THREE.Group();
  haloGroup.visible = false;
  container.add(haloGroup);
  let haloTex: THREE.Texture | null = null;
  const haloSprites: THREE.Sprite[] = [];
  let fakeGlow = false;
  const ensureHalos = () => {
    if (haloTex) return;
    haloTex = makeHaloTexture();
    for (let i = 0; i < heroCount; i++) {
      const mat = new THREE.SpriteMaterial({
        map: haloTex,
        // bloom выключен → цвет держим В ПРЕДЕЛАХ LDR, иначе ACES выжжет ореол в белый
        color: new THREE.Color(STAR_COLOR),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        opacity: 0,
        toneMapped: false,
      });
      const s = new THREE.Sprite(mat);
      s.scale.setScalar(0.001);
      haloGroup.add(s);
      haloSprites.push(s);
    }
  };

  // Широкая синяя «атмосфера» (ниже порога bloom → в свечение не попадает).
  const hazeMat = new THREE.SpriteMaterial({
    map: makeHazeTexture(),
    color: 0x1e5bd6,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    opacity: HAZE_OPACITY,
    toneMapped: false,
  });
  const haze = new THREE.Sprite(hazeMat);
  haze.scale.setScalar(13);
  haze.position.set(0, 0, -2);
  container.add(haze);

  await chunk('glints');

  // ---- 6. композер: RenderPass → Bloom → ACES ------------------------------
  // HalfFloat: буфер держит линейные значения > 1.0 (HDR), без него порог bloom
  // не имел бы смысла (всё клипалось бы в 1.0). multisampling: 0 — MSAA не нужен.
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
    multisampling: 0,
  });
  const bloom = new BloomEffect({
    luminanceThreshold: 1.0, // ниже 1.0 остаётся вся геометрия → блумят только эмиттеры
    luminanceSmoothing: 0.03,
    mipmapBlur: true,
    levels: opts.bloomLevels ?? BLOOM_LEVELS,
    intensity: opts.bloomIntensity ?? BLOOM_INTENSITY,
    radius: BLOOM_RADIUS,
  });
  const toneMapping = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
  composer.addPass(new RenderPass(scene, camera));
  const mainPass = new EffectPass(camera, bloom, toneMapping);
  composer.addPass(mainPass);

  await chunk('composer');

  // ---- 6b. Сглаживание ----------------------------------------------------
  // MSAA у композера выключен (multisampling: 0), поэтому ступенчатые изо-грани
  // нужно чем-то сглаживать. Замерили три варианта против эталона-суперсэмплинга ×4
  // (PSNR по краевым пикселям, кадр без bloom — чтобы мерить именно сглаживание):
  //   DPR 1, без AA ....... 15.10 дБ   ← регрессия этапа 1
  //   DPR 1 + SMAA ........ 15.29 дБ   +56.5 KB gzip (одни только lookup-текстуры
  //                                     SMAA — 65 KB base64), даёт всего +0.2 дБ
  //   DPR 1.5, без AA ..... 21.19 дБ   0 KB
  // Морфологический фильтр восстанавливает край из ОДНОЙ выборки на пиксель и
  // субпиксельной информации взять ему просто неоткуда, а суперсэмплинг ею
  // располагает. Поэтому основное сглаживание — пол DPR 1.5 (см. setPixelRatio),
  // а SMAA не берём: он и слабее, и дороже четверти бюджета чанка.
  //
  // FXAA (никаких lookup-текстур, ~2 KB) держим ВЫКЛЮЧЕННЫМ и включаем только
  // на ступени лесенки «DPR → 1»: там суперсэмплинга уже нет, и дешёвое сглаживание
  // лучше голой лесенки. В обычном режиме он не нужен и слегка мылил бы картинку.
  const fxaa = new FXAAEffect();
  const fxaaPass = new EffectPass(camera, fxaa);
  fxaaPass.enabled = false;
  composer.addPass(fxaaPass);
  // Композер держит renderToScreen на последнем проходе; раз последний проход
  // выключен, вывод на экран возвращаем предыдущему.
  const setAA = (on: boolean) => {
    fxaaPass.enabled = on;
    fxaaPass.renderToScreen = on;
    mainPass.renderToScreen = !on;
  };
  setAA(opts.aa ?? false);

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
    composer.setSize(w, h, false); // сам зовёт renderer.setSize + ресайзит буферы
  };
  const fit = () => applyFrame(canvas.clientWidth || 1, canvas.clientHeight || 1);
  fit();

  await chunk('aa+fit');

  // ---- 7. прекомпил шейдеров (KHR_parallel_shader_compile, если есть) -----
  // Постер НЕ кроссфейдится, пока программы не собраны и первый кадр не выведен.
  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    /* compileAsync не критичен — первый кадр всё равно скомпилирует */
  }
  await chunk('compile');

  // --- цикл анимации (своё время с клампом dt — без прыжков после паузы) ---
  let simTime = 0;
  let lastNow = performance.now();
  let raf = 0;
  let paused = false;
  let ready = false;
  const tmp = new THREE.Vector3();
  const { movers, pieceMover } = buildMovers(pieces, rng);

  // -------------------------------------------------------------------------
  // Экспорт кадра. canvas.toDataURL() делит цвет на альфу (un-premultiply) и
  // клампит: аддитивное свечение bloom (rgb ≫ alpha над прозрачным фоном) при
  // этом выжигается в белый и теряется. Поэтому читаем ПРЕМУЛЬТИПЛЕННЫЙ буфер
  // напрямую и:
  //   • bg задан → композитим ровно как браузер: out = rgb + bg*(1−a), кадр непрозрачный;
  //   • bg нет   → чиним альфу: a' = max(a, r, g, b), rgb' = rgb/a'. Обычный source-over
  //     такого PNG/WebP поверх тёмного фона даёт тот же результат, что аддитивный канвас.
  // -------------------------------------------------------------------------
  const exportFrame = (
    mime: string,
    quality?: number,
    bg?: [number, number, number],
  ): string | null => {
    const gl = renderer.getContext();
    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;
    const src = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, src);
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const ctx = out.getContext('2d');
    if (!ctx) return null;
    const img = ctx.createImageData(W, H);
    const dst = img.data;
    for (let y = 0; y < H; y++) {
      const sRow = (H - 1 - y) * W * 4; // readPixels отдаёт строки снизу вверх
      const dRow = y * W * 4;
      for (let x = 0; x < W; x++) {
        const s = sRow + x * 4;
        const o = dRow + x * 4;
        const r = src[s];
        const g = src[s + 1];
        const b = src[s + 2];
        const a = src[s + 3];
        if (bg) {
          const k = (255 - a) / 255;
          dst[o] = Math.min(255, r + bg[0] * k);
          dst[o + 1] = Math.min(255, g + bg[1] * k);
          dst[o + 2] = Math.min(255, b + bg[2] * k);
          dst[o + 3] = 255;
        } else {
          const a2 = Math.max(a, r, g, b);
          if (a2 === 0) continue; // createImageData уже нулевая
          dst[o] = Math.min(255, Math.round((r * 255) / a2));
          dst[o + 1] = Math.min(255, Math.round((g * 255) / a2));
          dst[o + 2] = Math.min(255, Math.round((b * 255) / a2));
          dst[o + 3] = a2;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    return out.toDataURL(mime, quality);
  };

  const handle: SceneHandle = {
    pieces: pieceObjs,
    tiltGroup,
    cluster: container,
    camera,
    onFrame: null,
    setPaused(p: boolean) {
      if (p === paused) return;
      paused = p;
      if (!p) {
        lastNow = performance.now();
        // Копившиеся до паузы замеры больше не про текущий кадр, а первые кадры
        // после возобновления идут по холодным кэшам — начинаем окно заново.
        resetFrameSampler();
        loop();
      } else {
        cancelAnimationFrame(raf);
      }
    },
    setQuality(q: QualityOptions) {
      if (q.bloomLevels !== undefined) bloom.mipmapBlurPass.levels = q.bloomLevels;
      if (q.bloomIntensity !== undefined) bloom.intensity = q.bloomIntensity;
      if (q.aa !== undefined) setAA(q.aa);
      if (q.bloom !== undefined) {
        // Порог 1.0 отсекает всю геометрию, поэтому «выключить bloom» = поднять
        // порог за пределы досягаемости: проход остаётся в конвейере (пересборка
        // композера на слабом устройстве дороже), но мипы больше ничего не ловят.
        bloom.luminanceMaterial.threshold = q.bloom ? 1.0 : 1e4;
        bloom.intensity = q.bloom ? (q.bloomIntensity ?? BLOOM_INTENSITY) : 0;
        fakeGlow = !q.bloom;
        if (fakeGlow) ensureHalos();
        haloGroup.visible = fakeGlow;
        // Без bloom HDR-эмиттеры просто клипаются в белый — возвращаем им LDR-цвет,
        // иначе рёбра и блики выглядят как плоские белые пятна.
        edgeMat.color.set(EDGE_COLOR).multiplyScalar(q.bloom ? EDGE_HDR : 1.0);
        for (let i = 0; i < glints.length; i++) {
          const isHero = i < heroCount;
          const c = isHero ? STAR_COLOR : PIN_COLOR;
          const k = q.bloom ? (isHero ? STAR_HDR : PIN_HDR) : 1.0;
          (glints[i].sprite.material as THREE.SpriteMaterial).color.set(c).multiplyScalar(k);
        }
      }
      if (q.pixelRatio !== undefined) {
        renderer.setPixelRatio(q.pixelRatio);
        fit();
      }
    },
    capture() {
      try {
        update(0);
        return exportFrame('image/png');
      } catch {
        return null;
      }
    },
    captureAt(
      w: number,
      h: number,
      poseT = 0,
      mime = 'image/png',
      quality?: number,
      bg?: [number, number, number],
    ) {
      // Постер: фиксированный размер, поза покоя (по умолчанию t=0 → все сдвиги=0).
      const prevRatio = renderer.getPixelRatio();
      const prevTime = simTime;
      try {
        renderer.setPixelRatio(1);
        applyFrame(w, h);
        simTime = poseT;
        update(0);
        return exportFrame(mime, quality, bg);
      } catch {
        return null;
      } finally {
        simTime = prevTime;
        renderer.setPixelRatio(prevRatio);
        fit();
      }
    },
    advance(dt: number) {
      update(dt);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      composer.dispose();
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
      haloTex?.dispose();
      for (const s of haloSprites) (s.material as THREE.SpriteMaterial).dispose();
      renderer.dispose();
    },
  };

  const update = (dt: number) => {
    simTime += dt;
    const t = simTime;
    const tLoop = t % LOOP;

    handle.onFrame?.(t, dt); // этап 2: пружины/волны пишут в piece.offset

    // Периоды bob/breathe делят LOOP (15с) нацело (7.5=2×, 5=3×) → всё возвращается
    // к нулю в t=0 и t=LOOP: весь цикл (не только сдвиги) бесшовен без единого скачка.
    container.position.y = Math.sin((t / 7.5) * Math.PI * 2) * 0.18; // общий bob (2 цикла/LOOP)
    container.scale.setScalar(1 + Math.sin((t / 5) * Math.PI * 2) * 0.012); // «дыхание» (3 цикла/LOOP)

    for (let i = 0; i < pieceObjs.length; i++) {
      const po = pieceObjs[i];
      const mi = pieceMover[i];
      if (mi === null) tmp.set(0, 0, 0);
      else moverOffset(movers[mi], tLoop, tmp);
      // база лупа + аддитивный офсет интерактива (этап 2)
      po.group.position.copy(po.base).add(tmp).add(po.offset);
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

    // Фолбэк-ореолы повторяют крупные блики (только когда bloom отключён).
    if (fakeGlow) {
      for (let i = 0; i < haloSprites.length; i++) {
        const gl = glints[i];
        const s = haloSprites[i];
        s.position.copy(gl.sprite.position);
        s.scale.setScalar(gl.sprite.scale.x * 1.7);
        (s.material as THREE.SpriteMaterial).opacity =
          (gl.sprite.material as THREE.SpriteMaterial).opacity * 0.26;
      }
    }

    composer.render(dt);
    if (!ready) {
      ready = true;
      opts.onReady?.();
    }
  };

  // -------------------------------------------------------------------------
  // ЛЕСЕНКА ДЕГРАДАЦИИ. Статические сигналы (hardwareConcurrency, deviceMemory,
  // строка GPU) на мобильных врут, поэтому единственный честный источник — само
  // время кадра. Копим окно из 60 межкадровых интервалов, берём МЕДИАНУ (среднее
  // убил бы один случайный GC-выброс) и, если она держится выше бюджета, делаем
  // ОДИН шаг вниз, не чаще раза в 3с. Вверх не возвращаемся никогда: качели
  // «упало-подняли-опять упало» заметнее, чем стабильно среднее качество.
  //
  // Отдельная защита от ложного срабатывания: если дисплей 30 Гц или вкладку
  // тротлит браузер, межкадровый интервал будет большим независимо от нас. Поэтому
  // после каждого шага проверяем, ПОМОГЛО ли: если медиана не улучшилась заметно,
  // узкое место не в нашей отрисовке — лесенку останавливаем и до постера не
  // доводим.
  // -------------------------------------------------------------------------
  const FRAME_BUDGET_MS = 22; // ~45 fps: ниже этого кадр уже «дёргается»
  const WINDOW = 60;
  const STEP_COOLDOWN_MS = 3000;
  const samples: number[] = [];
  let warmupUntil = performance.now() + 2000; // первые 2с — компиляция/прогрев кэшей
  let lastStepAt = 0;
  let ladderStep = 0;
  let ladderDone = false;
  let medianBeforeStep = 0;
  let virtualClock = 0; // только для debug-прогона лесенки (feedFrameTimes)

  const median = (a: number[]): number => {
    const s = a.slice().sort((x, y) => x - y);
    return s[s.length >> 1];
  };

  // Объявление функцией (не const): её зовёт setPaused, описанный ВЫШЕ по файлу.
  function resetFrameSampler(): void {
    samples.length = 0;
    warmupUntil = performance.now() + 500;
  }

  // Ступени строго по убыванию стоимости кадра. У каждой есть проверка applies():
  // ступень, которая ничего не изменит (например «DPR → 1.5», когда DPR уже 1.5 —
  // ровно наш случай на не-retina мониторе), ПРОПУСКАЕТСЯ. Иначе лесенка потратила
  // бы шаг впустую, а следующая проверка «помогло ли» справедливо решила бы, что
  // тормозим не мы, и остановила спуск на ровном месте.
  const LADDER: { applies: () => boolean; apply: () => void; label: string }[] = [
    {
      applies: () => renderer.getPixelRatio() > 1.5,
      apply: () => handle.setQuality({ pixelRatio: 1.5 }),
      label: 'DPR → 1.5',
    },
    {
      // Ниже пола DPR суперсэмплинга больше нет — включаем дешёвый FXAA, иначе
      // силуэт распадётся на ступеньки ровно в тот момент, когда устройству и так тяжело.
      applies: () => renderer.getPixelRatio() > 1,
      apply: () => handle.setQuality({ pixelRatio: 1, aa: true }),
      label: 'DPR → 1 (+FXAA взамен суперсэмплинга)',
    },
    {
      applies: () => bloom.mipmapBlurPass.levels > 4,
      apply: () => handle.setQuality({ bloomLevels: 4 }),
      label: 'bloom levels → 4',
    },
    {
      // Самая дорогая часть кадра — мип-цепочка блума. Убираем её целиком, но
      // сцену не оставляем плоской: включается запечённый ореол на спрайтах.
      applies: () => !fakeGlow,
      apply: () => handle.setQuality({ bloom: false }),
      label: 'bloom выключен, включён фолбэк-ореол',
    },
  ];

  /** Делает первый ПРИМЕНИМЫЙ шаг вниз. Возвращает описание для лога. */
  const applyLadderStep = (): string => {
    while (ladderStep < LADDER.length) {
      const s = LADDER[ladderStep++];
      if (!s.applies()) continue;
      s.apply();
      return s.label;
    }
    ladderDone = true;
    return 'лесенка исчерпана → постер';
  };

  const sampleFrame = (frameMs: number, now: number) => {
    if (ladderDone || now < warmupUntil) return;
    samples.push(frameMs);
    if (samples.length < WINDOW) return;
    const med = median(samples);
    samples.length = 0;

    // Проверка «предыдущий шаг помог?» — иначе тормозим не мы.
    if (ladderStep > 0 && medianBeforeStep > 0) {
      if (med > medianBeforeStep * 0.95 && med > FRAME_BUDGET_MS) {
        ladderDone = true;
        console.debug(
          `[hero] лесенка остановлена: шаг не дал выигрыша (${medianBeforeStep.toFixed(1)} → ${med.toFixed(1)} мс). Узкое место вне отрисовки сцены.`,
        );
        return;
      }
      medianBeforeStep = 0;
    }
    if (med <= FRAME_BUDGET_MS) return;
    if (now - lastStepAt < STEP_COOLDOWN_MS) return;

    lastStepAt = now;
    medianBeforeStep = med;
    const what = applyLadderStep();
    console.debug(`[hero] медиана кадра ${med.toFixed(1)} мс > ${FRAME_BUDGET_MS} — ${what}`);
    if (ladderDone) {
      cancelAnimationFrame(raf);
      paused = true;
      opts.onExhausted?.();
    }
  };

  const loop = () => {
    if (paused) return;
    const now = performance.now();
    const frameMs = now - lastNow;
    let dt = frameMs / 1000;
    lastNow = now;
    if (dt > 0.1) dt = 0.1;
    update(dt);
    sampleFrame(frameMs, now);
    if (!paused) raf = requestAnimationFrame(loop);
  };

  // --- потеря контекста WebGL: восстановление не запрашиваем, отдаём постер ---
  // preventDefault НЕ зовём намеренно: без него браузер не пытается восстановить
  // контекст, а нам это и не нужно — постер надёжнее и не стоит ни байта.
  const onContextLost = () => {
    cancelAnimationFrame(raf);
    paused = true;
    ladderDone = true;
    console.debug('[hero] контекст WebGL потерян — возвращаем постер');
    opts.onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  const ro = new ResizeObserver(() => fit());
  ro.observe(canvas);

  if (opts.capture) {
    handle.debug = {
      renderer,
      scene,
      camera,
      composer,
      bloom,
      edgeMat,
      glintGroup,
      hazeMat,
      feedFrameTimes(frameMs: number, frames: number) {
        warmupUntil = 0; // прогрев в тесте не нужен
        // Виртуальные часы ОБЩИЕ для всех вызовов: если начинать их заново, между
        // вызовами время как будто откатывается назад и кулдаун между ступенями
        // не истекает никогда.
        if (!virtualClock) virtualClock = performance.now();
        for (let i = 0; i < frames; i++) {
          virtualClock += frameMs;
          sampleFrame(frameMs, virtualClock);
        }
      },
      ladderState: () => ({
        step: ladderStep,
        done: ladderDone,
        pixelRatio: renderer.getPixelRatio(),
        fakeGlow,
      }),
    };
  }

  loop();
  await chunk('first-frame');

  return handle;
}
