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
   * Нормаль грани большого куба, на которой сидит блок (единичная, в системе
   * кластера). Этап 2 двигает блок ТОЛЬКО вдоль неё — как панели в референсе.
   */
  readonly normal: THREE.Vector3;
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
  /**
   * Преломление в стекле (MeshPhysicalMaterial.transmission). Стоит целого
   * дополнительного прохода сцены в transmission-таргет. false — стекло
   * становится непрозрачным тёмным (как до этапа 4), картинка беднеет, но
   * кадр дешевеет примерно вдвое по геометрии. Ступень лесенки между
   * «bloom levels → 4» и «bloom выключен».
   */
  transmission?: boolean;
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
  /** Материал всех линий (контуры панелей + силуэт): .visible=false — замер спекуляров. */
  edgeMat: THREE.LineBasicMaterial;
  /** Материал светящегося внутреннего слоя: .visible=false гасит свет в швах. */
  seamMat: THREE.MeshStandardMaterial;
  /** Внутренний слой целиком — прячется вместе со своим светом. */
  seamLayer: THREE.Mesh;
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
// Замер по утверждённому макету (figma/export.png): объект выше, чем куб —
// отношение экранных габаритов h/w ≈ 1.47, тогда как ровный куб в этой изометрии
// даёт 1.12. Значит по вертикали ячеек больше: 4×5×4 (+ рельеф) даёт ≈1.4.
// Силуэт при этом остаётся силуэтом одного большого блока, как требует клиент.
const N = 4; // ячеек по горизонтали (X и Z)
const NY = 5; // ячеек по вертикали
const CUBE = 1; // ребро ячейки (world units)
const GAP = 0.05; // шов между ячейками: сквозь него видно светящийся внутренний слой
const STEP = CUBE + GAP; // шаг сетки
/** Шаг сетки кластера в world units — интерактив (этап 2) меряет всё в них. */
export const GRID_STEP = STEP;
/** Полуразмер большого куба до ВНЕШНЕЙ поверхности (центр крайней ячейки + half). */
const SURF = ((N - 1) / 2) * STEP + CUBE / 2;
/** То же по вертикали. */
const SURF_Y = ((NY - 1) / 2) * STEP + CUBE / 2;
/**
 * Насколько светящийся внутренний слой утоплен под внешнюю поверхность.
 * Держим МИНИМАЛЬНЫМ: шов узкий (GAP), и на изо-угле (~35° к нормали) уже при
 * утоплении в половину его ширины дно шва уходит за собственную стенку — свечение
 * пропадает. 0.015 хватает, чтобы не было z-файтинга с гранями ячеек.
 */
const SEAM_SINK = 0.015;
const LOOP = 15; // период бесшовного цикла сдвигов, сек

// --- HDR-эмиттеры: множители цвета ВЫШЕ 1.0 → проходят порог bloom (1.0) ---
// Только эти объекты светятся; тонмаппинг к ним не применяется (toneMapped:false).
// Рёбра ВЫДВИНУТЫХ панелей — тот самый тонкий белый контур по периметру панели
// из референса. Отдельный материал: у панелей он ярче и полностью непрозрачный.
const RIM_COLOR = 0xdce9ff;
const RIM_HDR = 3.0;
// Светящийся внутренний слой (свет ИЗНУТРИ куба, вытекающий в швы). Эмиссия
// модулируется картой-сеткой: линии по границам ячеек ярче 1.0 → берут порог bloom.
const SEAM_COLOR = 0x2f86ff;
const SEAM_HDR = 4.4;
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
// Карта СВЕТА ИЗНУТРИ. Кладётся эмиссией на «внутренний слой» — куб чуть меньше
// внешней поверхности оболочки. Оболочка (ячейки) его закрывает, и наружу свет
// выходит только там, где в ней есть щель: в ШВАХ между ячейками и в «колодцах»,
// открывшихся под выдвинутыми панелями. Отсюда и берётся картинка референса —
// светящаяся сетка швов и звёзды на их пересечениях.
//
// Сетка нарисована по границам ячеек (u,v = 0, 1/N … 1): широкий мягкий ореол
// (ниже порога bloom, красит стекло вокруг) + тонкое ядро (ярче 1.0 → блумит).
// ---------------------------------------------------------------------------
function makeSeamTexture(cu: number, cv: number, halfU: number, halfV: number): THREE.Texture {
  const S = 512;
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = S;
  const ctx = cnv.getContext('2d')!;
  const rng = mulberry32(0x51ea3);

  // Слой чуть меньше куба, поэтому позицию линии считаем ИЗ МИРОВЫХ координат
  // границы ячейки, а не как n/N: иначе сетка света разъезжается со швами на
  // величину порядка самого шва — и швы перестают светиться.
  const atU = (n: number) => (0.5 + ((n - cu / 2) * STEP) / (2 * halfU)) * S;
  const atV = (n: number) => (0.5 + ((n - cv / 2) * STEP) / (2 * halfV)) * S;
  const cell = Math.min(atU(1) - atU(0), atV(1) - atV(0));

  // 1. НЕ чёрное дно: сквозь стекло (transmission) видно именно его, и если тут
  //    ноль — грань читается плоской матовой плиткой, а не стеклом. Слабая
  //    синева + мягкие пятна дают «глубину» внутри объёма.
  ctx.fillStyle = '#040812';
  ctx.fillRect(0, 0, S, S);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const x = rng() * S;
    const y = rng() * S;
    const r = S * (0.04 + rng() * 0.13);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(90,150,255,${0.05 + rng() * 0.07})`);
    g.addColorStop(1, 'rgba(60,120,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Внутренние «царапины» — в референсе сквозь тёмное стекло видны тонкие штрихи.
  ctx.lineWidth = 1;
  for (let i = 0; i < 44; i++) {
    const x = rng() * S;
    const y = rng() * S;
    const len = S * (0.03 + rng() * 0.1);
    const a = (rng() - 0.5) * 0.9 + (rng() < 0.5 ? 0 : Math.PI / 2);
    ctx.strokeStyle = `rgba(150,190,255,${0.05 + rng() * 0.1})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }

  // 2. Сам шов — ЕЛЕ ЗАМЕТНАЯ линия. Ключевое отличие от «неоновой сетки»: в
  //    референсе шов сам по себе почти не светится, свет копится в УЗЛАХ.
  ctx.strokeStyle = 'rgba(120,170,255,0.06)';
  ctx.lineWidth = 1.2;
  for (let n = 0; n <= cu; n++) {
    const x = atU(n);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, S);
    ctx.stroke();
  }
  for (let n = 0; n <= cv; n++) {
    const y = atV(n);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(S, y);
    ctx.stroke();
  }

  // 3. УЗЛЫ: из каждого пересечения свет растекается по швам и быстро гаснет —
  //    это и даёт «звёзды на пересечениях» и рваный, живой рисунок свечения.
  //    Длина лучей джиттерится, поэтому сетка не выглядит штампованной.
  const ray = (x: number, y: number, dx: number, dy: number, len: number, w: number) => {
    const g = ctx.createLinearGradient(x, y, x + dx * len, y + dy * len);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.12, 'rgba(210,235,255,0.34)');
    g.addColorStop(0.45, 'rgba(150,200,255,0.09)');
    g.addColorStop(1, 'rgba(120,180,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx * len, y + dy * len);
    ctx.stroke();
  };
  for (let a = 0; a <= cu; a++)
    for (let b = 0; b <= cv; b++) {
      const x = atU(a);
      const y = atV(b);
      const hot = rng();
      if (hot < 0.34) continue; // большинство пересечений НЕ горит — как в референсе
      const heat = 0.3 + ((hot - 0.42) / 0.58) * 0.7;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const)
        ray(x, y, dx, dy, cell * (0.34 + rng() * 0.46) * heat, 2.4);
      const halo = ctx.createRadialGradient(x, y, 0, x, y, cell * 0.42);
      halo.addColorStop(0, `rgba(90,160,255,${0.1 * heat})`);
      halo.addColorStop(0.4, `rgba(60,130,255,${0.03 * heat})`);
      halo.addColorStop(1, 'rgba(40,100,230,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(x - cell * 0.5, y - cell * 0.5, cell, cell);
      const core = ctx.createRadialGradient(x, y, 0, x, y, cell * 0.26 * heat);
      core.addColorStop(0, `rgba(255,255,255,${0.5 + 0.45 * heat})`);
      core.addColorStop(0.28, `rgba(190,225,255,${0.22 * heat})`);
      core.addColorStop(1, 'rgba(120,180,255,0)');
      ctx.fillStyle = core;
      ctx.fillRect(x - cell * 0.3, y - cell * 0.3, cell * 0.6, cell * 0.6);
    }
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
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
  grad.addColorStop(0.0, '#96a0b2');
  grad.addColorStop(0.34, '#6e7789'); // этап 4: небо СИЛЬНО темнее — под стекло, не под хром
  grad.addColorStop(0.42, '#39404e');
  // Ниже 0.5 — зона, которую отражают БОКОВЫЕ грани. Спад делаем резче и глубже:
  // референс (raw1/видео) — почти чёрное глянцевое стекло по бокам, светлое только
  // сверху. Пологий спад давал «серые» бока и съедал контраст между верхом и боком.
  grad.addColorStop(0.5, '#171c26');
  grad.addColorStop(0.6, '#080b12');
  grad.addColorStop(0.72, '#05080e');
  grad.addColorStop(1.0, '#010208');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Яркое «key»-пятно у зенита (спереди-справа) — усиливает блик на топах.
  const key = ctx.createRadialGradient(W * 0.64, H * 0.12, 0, W * 0.64, H * 0.12, H * 0.6);
  key.addColorStop(0, 'rgba(255,255,255,0.72)');
  key.addColorStop(0.5, 'rgba(226,236,255,0.12)');
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
// ГЕОМЕТРИЯ: ОДИН БОЛЬШОЙ КУБ, грань которого подразбита на 4×4 ячейки.
//
// Строим только ПОВЕРХНОСТНЫЕ ячейки (внутренние 2×2×2 не видны никогда и в
// сцену не попадают): 4³ − 2³ = 56 боксов. Каждая ячейка знает НОРМАЛЬ своей
// грани — вдоль неё она выдвигается/утапливается, вдоль неё же её двигают луп
// и интерактив. Силуэт при этом остаётся силуэтом одного большого куба, а
// рельеф — «скульптурой» на его верхней половине, как в референсе.
//
// Раскладка рельефа авторская (снята с ref_top_cluster / ref_bottom_cluster):
// нижняя треть заподлицо — сплошные стеклянные грани со швами; верх сложный.
// ---------------------------------------------------------------------------
interface CubeCell {
  i: number;
  j: number;
  k: number;
}

/** Индексы материалов BoxGeometry: 0:+X 1:−X 2:+Y 3:−Y 4:+Z 5:−Z. */
const FACE_PX = 0,
  FACE_PY = 2,
  FACE_PZ = 4;

/**
 * Нормали трёх видимых граней — ОБЩИЕ синглтоны, а не новые Vector3 на ячейку:
 * по ним сравнивают «та же грань?» и сборка щитов, и группировка сдвигов лупа
 * (сравнение по ссылке). Мутировать их нельзя — только читать.
 */
const N_PX = Object.freeze(new THREE.Vector3(1, 0, 0)) as THREE.Vector3;
const N_PY = Object.freeze(new THREE.Vector3(0, 1, 0)) as THREE.Vector3;
const N_PZ = Object.freeze(new THREE.Vector3(0, 0, 1)) as THREE.Vector3;

/**
 * Ячейка оболочки: позиция в сетке, нормаль грани, вылет вдоль неё и то, какая
 * из шести граней бокса получает «панельный» (матовый) материал.
 */
interface ShellCell extends CubeCell {
  /** Единичная нормаль грани, на которой лежит ячейка (в системе кластера). */
  n: THREE.Vector3;
  /** Вылет вдоль нормали в долях ячейки: >0 наружу, <0 утоплена. */
  out: number;
  /** Индекс грани бокса под матовое стекло (null — вся ячейка тёмное стекло). */
  frost: number | null;
  /** Яркий белый контур по рёбрам (у выдвинутых панелей — как в референсе). */
  rim: boolean;
}

// --- Авторские карты рельефа. Значения — вылет в долях ячейки. ---
// Читаются «как на картинке»: первая строка — верхняя (или дальняя) полоса.
// F в карте FROST — на внешнюю грань кладётся МАТОВОЕ стекло (светлая панель),
// S — матовая панель на боковой стенке (видна, когда ячейка верхней грани
// поднялась и обнажила бок) — так собран крупный светлый щит у вершины куба.

// Грань +Z (передне-левая): строки j = NY-1…0 сверху вниз, столбцы i = 0…3.
const OUT_PZ = [
  [0.0, 0.55, 0.0, 0.0],
  [0.72, 0.72, 0.0, 0.3],
  [0.0, 0.0, 0.42, 0.0],
  [0.0, 0.0, 0.18, -0.2],
  [0.0, 0.0, 0.0, 0.0],
];
const FROST_PZ = ['.F..', 'FF..', '..F.', '....', '....'];

// Грань +X (передне-правая): строки j = NY-1…0, столбцы k = 3…0 (ближняя слева).
const OUT_PX = [
  [0.0, 0.0, 0.0, 0.0],
  [0.0, 0.62, 0.0, 0.0],
  [0.78, 0.78, 0.0, 0.28],
  [0.0, 0.28, 0.0, -0.14],
  [0.0, 0.0, 0.0, 0.0],
];
const FROST_PX = ['....', '.F..', 'FF..', '....', '....'];

// Грань +Y (верхняя): строки k = 0…3 (дальняя сверху), столбцы i = 0…3.
const OUT_PY = [
  [0.0, 0.0, 0.0, 0.0],
  [0.0, 0.74, 0.0, 0.0],
  [0.44, 0.74, 0.0, -0.18],
  [0.0, 0.0, 0.3, 0.0],
];
const FROST_PY = ['....', '.S..', '.S..', '..F.'];

/**
 * Вылет и тип панели для ячейки на конкретной грани.
 * Возвращает null, если ячейка этой грани не касается.
 */
function faceSpec(
  i: number,
  j: number,
  k: number,
  face: 'px' | 'py' | 'pz',
): { out: number; frost: string } | null {
  const lastH = N - 1;
  const lastV = NY - 1;
  if (face === 'pz') {
    if (k !== lastH) return null;
    return { out: OUT_PZ[lastV - j][i], frost: FROST_PZ[lastV - j][i] };
  }
  if (face === 'px') {
    if (i !== lastH) return null;
    return { out: OUT_PX[lastV - j][lastH - k], frost: FROST_PX[lastV - j][lastH - k] };
  }
  if (j !== lastV) return null;
  return { out: OUT_PY[k][i], frost: FROST_PY[k][i] };
}

/**
 * Оболочка большого куба. Оставляем только ячейки, касающиеся ТРЁХ видимых
 * граней (+X, +Y, +Z): камера изометрическая и неподвижная, задние 27 ячеек не
 * видно ни разу — а внутренний светящийся слой их и так закрывает. Силуэт
 * (шестиугольник) при этом полный: его образует внешняя граница объединения
 * именно этих трёх граней.
 */
function buildShell(): ShellCell[] {
  const lastH = N - 1;
  const lastV = NY - 1;
  const cells: ShellCell[] = [];
  for (let i = 0; i < N; i++)
    for (let j = 0; j < NY; j++)
      for (let k = 0; k < N; k++) {
        if (i !== lastH && j !== lastV && k !== lastH) continue;
        const cand = [
          { f: 'py' as const, n: N_PY, s: faceSpec(i, j, k, 'py') },
          { f: 'px' as const, n: N_PX, s: faceSpec(i, j, k, 'px') },
          { f: 'pz' as const, n: N_PZ, s: faceSpec(i, j, k, 'pz') },
        ].filter((c) => c.s !== null);
        // Ячейка на ребре принадлежит двум граням — берём ту, где рельеф сильнее
        // (иначе выступ, заданный на одной карте, «съедался» бы нулём соседней).
        let best = cand[0];
        for (const c of cand) if (Math.abs(c.s!.out) > Math.abs(best.s!.out)) best = c;
        const spec = best.s!;
        let frost: number | null = null;
        if (spec.frost === 'F')
          frost = best.f === 'py' ? FACE_PY : best.f === 'px' ? FACE_PX : FACE_PZ;
        else if (spec.frost === 'S') frost = FACE_PZ; // бок поднятой верхней ячейки
        cells.push({
          i,
          j,
          k,
          n: best.n,
          out: spec.out,
          frost,
          rim: spec.out > 0.02,
        });
      }
  return cells;
}

// ---------------------------------------------------------------------------
// Блоки (piece): ячейка оболочки в world-координатах + нормаль её грани.
// Размер у всех одинаковый (ребро ячейки) — «слэбов» больше нет: крупные
// светлые щиты референса собираются не размером блока, а матовым материалом
// на его внешней грани и вылетом вдоль нормали.
// ---------------------------------------------------------------------------
interface PieceDesc {
  base: THREE.Vector3; // центр блока в системе кластера (в покое, УЖЕ с вылетом)
  size: THREE.Vector3; // размеры в world units
  normal: THREE.Vector3; // нормаль грани: вдоль неё ходят луп и интерактив
  frost: number | null; // индекс грани бокса под матовое стекло
  rim: boolean; // яркий белый контур по периметру внешней грани
  outFace: number; // индекс грани BoxGeometry, смотрящей наружу
  out: number; // вылет в долях ячейки (для расписания сдвигов)
}

function buildPieces(cells: ShellCell[]): PieceDesc[] {
  const c0 = (N - 1) / 2;
  const c0y = (NY - 1) / 2;
  const centre = (c: ShellCell) =>
    new THREE.Vector3((c.i - c0) * STEP, (c.j - c0y) * STEP, (c.k - c0) * STEP).addScaledVector(
      c.n,
      c.out * STEP,
    );
  const outFaceOf = (n: THREE.Vector3) => (n.y > 0 ? FACE_PY : n.x > 0 ? FACE_PX : FACE_PZ);

  // Крупные светлые щиты референса — ЦЕЛЬНЫЕ пластины, а не два состыкованных
  // квадрата: между ними нет ни шва, ни второй обводки. Поэтому соседние
  // матовые ячейки с одинаковым вылетом на одной грани сливаем в один блок 2×1.
  const key = (c: ShellCell) => `${c.i},${c.j},${c.k}`;
  const byKey = new Map(cells.map((c) => [key(c), c]));
  const used = new Set<string>();
  const pieces: PieceDesc[] = [];

  for (const c of cells) {
    if (used.has(key(c))) continue;
    let mate: ShellCell | undefined;
    let axis: 'i' | 'k' | null = null;
    if (c.frost !== null) {
      // ищем соседа вдоль горизонтали ТОЙ ЖЕ грани
      // обе стороны: порядок обхода сетки иначе «съедает» пару (сосед уже занят)
      const ax: 'i' | 'k' = c.n === N_PX ? 'k' : 'i';
      const dirs: ['i' | 'k', number][] = [
        [ax, 1],
        [ax, -1],
      ];
      for (const [ax, d] of dirs) {
        const nb = byKey.get(ax === 'i' ? `${c.i + d},${c.j},${c.k}` : `${c.i},${c.j},${c.k + d}`);
        if (
          nb &&
          !used.has(key(nb)) &&
          nb.frost === c.frost &&
          nb.n === c.n &&
          Math.abs(nb.out - c.out) < 1e-6
        ) {
          mate = nb;
          axis = ax;
          break;
        }
      }
    }
    if (mate && axis) {
      used.add(key(c));
      used.add(key(mate));
      const base = centre(c).add(centre(mate)).multiplyScalar(0.5);
      pieces.push({
        base,
        size: new THREE.Vector3(
          axis === 'i' ? STEP + CUBE : CUBE,
          CUBE,
          axis === 'k' ? STEP + CUBE : CUBE,
        ),
        normal: c.n,
        frost: c.frost,
        rim: c.rim,
        outFace: outFaceOf(c.n),
        out: c.out,
      });
      continue;
    }
    used.add(key(c));
    pieces.push({
      base: centre(c),
      size: new THREE.Vector3(CUBE, CUBE, CUBE),
      normal: c.n,
      frost: c.frost,
      rim: c.rim,
      outFace: outFaceOf(c.n),
      out: c.out,
    });
  }
  return pieces;
}

// ---------------------------------------------------------------------------
// Расписание сдвигов: детерминированное, бесшовное (в t=0 и t=LOOP смещения=0).
// ГЛАВНОЕ ОТЛИЧИЕ ОТ ПРЕЖНЕЙ ВЕРСИИ: блок ходит не вдоль мировой оси, а вдоль
// НОРМАЛИ СВОЕЙ ГРАНИ — ровно как панели на видео-референсе, которые выезжают
// из большого куба «наружу» и возвращаются обратно. Поэтому в Mover лежит только
// СКАЛЯРНАЯ дистанция, а направление берётся у каждого блока своё.
// ---------------------------------------------------------------------------
interface Mover {
  idx: number[];
  /** Знаковая дистанция вдоль нормали блока (world units). */
  dist: number;
  tOut: number;
  dOut: number;
  tBack: number;
  dBack: number;
}

function buildMovers(
  pieces: PieceDesc[],
  rng: () => number,
): { movers: Mover[]; pieceMover: (number | null)[] } {
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
    const n0 = pieces[seed].normal;
    const near: number[] = [];
    for (let i = 0; i < pieces.length; i++) {
      if (i === seed || pieceMover[i] !== null) continue;
      // соседей берём ТОЛЬКО с той же грани: группа должна ехать в одну сторону
      if (pieces[i].normal !== n0) continue;
      if (pieces[i].base.distanceTo(base0) < STEP * 1.55) near.push(i);
    }
    near.sort(() => rng() - 0.5);
    const extra = Math.floor(rng() * 3); // группа до 3 блоков
    for (const i of near) {
      if (group.length - 1 >= extra) break;
      group.push(i);
    }

    // Уже выдвинутая панель охотнее УТАПЛИВАЕТСЯ обратно в грань, заподлицо
    // лежащая — выезжает наружу: так рельеф всё время перекладывается, а куб
    // не «распухает» от того, что все панели поехали в одну сторону.
    const amp = (0.34 + rng() * 0.42) * STEP;
    const dist = pieces[seed].out > 0.2 ? (rng() < 0.72 ? -amp : amp) : amp;
    const dOut = 1.0 + rng() * 0.5; // ~1.0–1.5s
    const dBack = 1.0 + rng() * 0.5;
    const margin = 0.4;
    const hold = 0.8 + rng() * 2.2;
    const total = dOut + hold + dBack;
    const tOut = margin + rng() * (LOOP - total - 2 * margin);
    const tBack = tOut + dOut + hold;

    const mi = movers.push({ idx: group, dist, tOut, dOut, tBack, dBack }) - 1;
    for (const i of group) pieceMover[i] = mi;
  }

  return { movers, pieceMover };
}

/** Фаза сдвига 0…1 (0 в t=0 и t=LOOP → цикл бесшовен). */
function moverPhase(m: Mover, tLoop: number): number {
  if (tLoop >= m.tOut && tLoop < m.tOut + m.dOut) return easeInOutCubic((tLoop - m.tOut) / m.dOut);
  if (tLoop >= m.tOut + m.dOut && tLoop < m.tBack) return 1;
  if (tLoop >= m.tBack && tLoop < m.tBack + m.dBack)
    return easeInOutCubic(1 - (tLoop - m.tBack) / m.dBack);
  return 0;
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
  // Сквозь стекло видно размытый по roughness внутренний слой — полное
  // разрешение буфера преломления там не читается, а RT у него с MSAA×4 и
  // мип-цепочкой. 0.6 экономит и память, и время первого кадра.
  renderer.transmissionResolutionScale = 0.6;
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
  const hemi = new THREE.HemisphereLight(0x3c4048, 0x01040a, 0.08); // нейтральное небо → топы без синевы
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xf8faff, 1.5); // этап 4: стекло, не металл — key вдвое тише
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
  /**
   * Рамка по периметру ОДНОЙ грани единичного бокса (индексы как у BoxGeometry).
   * Именно она даёт тонкую белую обводку панели из референса; полный
   * EdgesGeometry давал бы «проволочный кубик» с яркой линией посередине выступа.
   */
  const faceOutlineGeo = (face: number): THREE.BufferGeometry => {
    const h = CUBE / 2;
    const ax = face >> 1; // 0:X 1:Y 2:Z
    const sign = face % 2 === 0 ? h : -h;
    const u = (ax + 1) % 3;
    const v = (ax + 2) % 3;
    const corner = (su: number, sv: number) => {
      const c = [0, 0, 0];
      c[ax] = sign;
      c[u] = su * h;
      c[v] = sv * h;
      return c;
    };
    const q = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
    const pos: number[] = [];
    for (let i = 0; i < 4; i++) pos.push(...q[i], ...q[(i + 1) % 4]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  };
  const outlineGeos = [0, 1, 2, 3, 4, 5].map(faceOutlineGeo);
  const boxEdgeGeo = new THREE.EdgesGeometry(boxGeo);
  const grainTex = makeGrainTexture();
  // HDR-эмиттер №1: контур выдвинутых панелей и внешний силуэт большого куба —
  // та самая тонкая белая обводка референса. Цвет ×RIM_HDR > 1.0 → проходит
  // порог bloom. Ячейки заподлицо рёбер НЕ получают: их границу рисует шов.
  // Волосяная белая линия по границе ячейки — сетка швов референса. LDR
  // (множитель 1.0), порог bloom не берёт: светится не она, а свет в шве.
  const seamLineMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(RIM_COLOR),
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  // Слабая «формообразующая» обводка выступов: ниже порога bloom, не блумит.
  const formMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(RIM_COLOR),
    transparent: true,
    opacity: 0.13,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const rimMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(RIM_COLOR).multiplyScalar(RIM_HDR),
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });

  const cells = buildShell();
  const pieces = buildPieces(cells);

  await chunk('geometry');

  // ---- 4. меши блоков (батчами, с отдачей потока между батчами) -----------
  // МАТЕРИАЛ — ТЁМНОЕ СТЕКЛО (MeshPhysicalMaterial + transmission), а не металл:
  // клиент отклонил «хром». three рендерит прозрачные материалы отдельным проходом
  // в transmission-таргет, куда попадает ТОЛЬКО непрозрачная геометрия — именно
  // поэтому светящийся внутренний слой (см. seamLayer) виден СКВОЗЬ грани
  // размытым по roughness: свет читается как идущий изнутри объёма, а не
  // нарисованный поверх. attenuationColor/Distance гасят проходящий свет в
  // глубокую синь, так что двойная толщина уходит почти в чёрное.
  interface PieceObj {
    group: THREE.Group;
    base: THREE.Vector3;
    half: THREE.Vector3;
    offset: THREE.Vector3;
    normal: THREE.Vector3;
  }
  const pieceObjs: PieceObj[] = [];
  const bodyMats: THREE.MeshPhysicalMaterial[] = [];
  /** Стекло: слот для лесенки деградации (transmission → 0 на слабых GPU). */
  const glassMats: THREE.MeshPhysicalMaterial[] = [];

  const GLASS_COLOR = 0x070a12; // почти чёрный сине-графитовый
  const FROST_COLOR = 0x939cab; // светлая матовая панель (главный светлый акцент)
  const ATTEN_COLOR = 0x0d1f52; // синева в толще стекла

  const makeGlass = (): THREE.MeshPhysicalMaterial => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(GLASS_COLOR).multiplyScalar(0.85 + rng() * 0.3),
      metalness: 0.1,
      roughness: 0.13 + rng() * 0.14,
      roughnessMap: grainTex,
      transmission: 0.8,
      thickness: 0.95,
      ior: 1.5,
      attenuationColor: new THREE.Color(ATTEN_COLOR),
      attenuationDistance: 2.1,
      specularIntensity: 0.66,
      envMapIntensity: 0.48 + rng() * 0.08,
    });
    m.userData.transmission = m.transmission;
    m.userData.envMapIntensity = m.envMapIntensity;
    bodyMats.push(m);
    glassMats.push(m);
    return m;
  };
  // Матовое стекло: сильно шероховатое, почти непрозрачное, светлое — те самые
  // серые «наждачные» щиты референса. Зерно (grainTex) отрабатывает на полную.
  const makeFrost = (): THREE.MeshPhysicalMaterial => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(FROST_COLOR).multiplyScalar(0.9 + rng() * 0.3),
      metalness: 0.0,
      roughness: 0.46 + rng() * 0.26,
      roughnessMap: grainTex,
      bumpMap: grainTex,
      bumpScale: 0.16,
      transmission: 0.26,
      thickness: 0.5,
      ior: 1.45,
      attenuationColor: new THREE.Color(0x2a3550),
      attenuationDistance: 0.9,
      specularIntensity: 0.6,
      envMapIntensity: 1.05 + rng() * 0.2,
    });
    m.userData.transmission = m.transmission;
    m.userData.envMapIntensity = m.envMapIntensity;
    bodyMats.push(m);
    glassMats.push(m);
    return m;
  };

  const BATCH = 12;
  for (let start = 0; start < pieces.length; start += BATCH) {
    for (const p of pieces.slice(start, start + BATCH)) {
      let matArg: THREE.Material | THREE.Material[];
      if (p.frost === null) {
        matArg = makeGlass();
      } else {
        // Панель = бокс, у которого ВНЕШНЯЯ грань матовая, а бока остаются
        // тёмным стеклом: в референсе у светлых щитов видно тёмную «толщину».
        const glass = makeGlass();
        const arr: THREE.Material[] = [glass, glass, glass, glass, glass, glass];
        arr[p.frost] = makeFrost();
        matArg = arr;
      }

      const g = new THREE.Group();
      g.position.copy(p.base);
      g.scale.copy(p.size); // единичный бокс → размер блока (щит = слэб 2×1)
      const mesh = new THREE.Mesh(boxGeo, matArg);
      g.add(mesh);
      // Швы читаются двумя материалами: тусклый — по всем ячейкам (подразбивка
      // граней), яркий белый — по периметру выдвинутых панелей (контур в референсе).
      // Рёбра — ТОЛЬКО у выдвинутых панелей (тонкий белый контур референса).
      // У ячеек заподлицо граница читается самим швом: тёмная канавка шириной
      // GAP, на дне которой светится внутренний слой. Белая обводка каждой
      // ячейки превращала куб в проволочную сетку — в референсе её нет.
      if (p.rim) {
        g.add(new THREE.LineSegments(boxEdgeGeo, formMat));
        g.add(new THREE.LineSegments(outlineGeos[p.frost ?? p.outFace], rimMat));
      } else {
        g.add(new THREE.LineSegments(outlineGeos[p.outFace], seamLineMat));
      }
      container.add(g);
      pieceObjs.push({
        group: g,
        base: p.base,
        half: p.size.clone().multiplyScalar(0.5),
        offset: new THREE.Vector3(),
        normal: p.normal,
      });
    }
    await chunk('meshes');
  }

  // ---- 4b. СВЕТ ИЗНУТРИ: непрозрачный слой под самой поверхностью ----------
  // Куб чуть меньше внешней поверхности оболочки, с эмиссионной картой-сеткой.
  // Ячейки его закрывают, наружу свет пробивается только сквозь ШВЫ (щель GAP)
  // и «колодцы» под выдвинутыми панелями. Он же — единственное, что попадает в
  // transmission-таргет за стеклом, поэтому сквозь грани видно именно его.
  // Блок не кубический (4×5×4), поэтому карт света две: для боковых граней
  // (по горизонтали 4 ячейки, по вертикали 5) и для верхней/нижней (4×4).
  // Порядок групп BoxGeometry: 0:+X 1:−X 2:+Y 3:−Y 4:+Z 5:−Z; у боковых граней
  // UV идут вдоль (Z,Y) и (X,Y), у горизонтальных — вдоль (X,Z).
  const halfH = SURF - SEAM_SINK;
  const halfV = SURF_Y - SEAM_SINK;
  const seamTexSide = makeSeamTexture(N, NY, halfH, halfV);
  const seamTexTop = makeSeamTexture(N, N, halfH, halfH);
  const makeSeamMat = (map: THREE.Texture) =>
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 1,
      metalness: 0,
      emissive: new THREE.Color(SEAM_COLOR),
      emissiveMap: map,
      emissiveIntensity: SEAM_HDR,
    });
  const seamMat = makeSeamMat(seamTexSide);
  const seamMatTop = makeSeamMat(seamTexTop);
  const seamMats = [seamMat, seamMatTop];
  const seamGeo = new THREE.BoxGeometry(1, 1, 1);
  const seamLayer = new THREE.Mesh(seamGeo, [
    seamMat,
    seamMat,
    seamMatTop,
    seamMatTop,
    seamMat,
    seamMat,
  ]);
  seamLayer.scale.set(halfH * 2, halfV * 2, halfH * 2);
  container.add(seamLayer);

  // Внешний силуэт большого куба — тонкая яркая линия по 12 рёбрам. В референсе
  // силуэт очерчен чётко и ярко, тогда как швы внутри граней еле намечены; из
  // одних только рёбер ячеек такого разделения не получить. Чуть больше куба,
  // чтобы не z-файтить с гранями крайних ячеек; задние рёбра закрывает
  // непрозрачный внутренний слой.
  const silhouette = new THREE.LineSegments(new THREE.EdgesGeometry(seamGeo), rimMat);
  silhouette.scale.set(SURF * 2 * 1.002, SURF_Y * 2 * 1.002, SURF * 2 * 1.002);
  container.add(silhouette);

  await chunk('seamlayer');

  // ---- 5. блики (два пула HDR-спрайтов) -----------------------------------
  // В референсе звёзды сидят НЕ на случайных вершинах, а строго на ПЕРЕСЕЧЕНИЯХ
  // ШВОВ — там, где свет изнутри собирается в 4-лучевую вспышку. Считаем узлы
  // сетки на трёх видимых гранях большого куба.
  const camDir = isoDir.clone();
  const vertsWorld: THREE.Vector3[] = [];
  {
    const seenV = new Set<string>();
    const at = (n: number) => (n - N / 2) * STEP;
    const atY = (n: number) => (n - NY / 2) * STEP;
    const push = (v: THREE.Vector3) => {
      if (v.clone().dot(camDir) < 0.2) return;
      const kk = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
      if (seenV.has(kk)) return;
      seenV.add(kk);
      vertsWorld.push(v);
    };
    for (let a = 0; a <= N; a++) {
      for (let b = 0; b <= NY; b++) {
        push(new THREE.Vector3(SURF, atY(b), at(a))); // грань +X
        push(new THREE.Vector3(at(a), atY(b), SURF)); // грань +Z
      }
      for (let b = 0; b <= N; b++) push(new THREE.Vector3(at(a), SURF_Y, at(b))); // грань +Y
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
    scaleMin: 0.34,
    scaleRange: 0.4,
    heroChance: 0.22,
    heroBonus: 0.7,
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
  const heroCount = Math.min(14, Math.max(8, Math.floor(vertsWorld.length * 0.17)));
  const pinCount = Math.min(34, Math.max(16, Math.floor(vertsWorld.length * 0.45)));
  addPool(heroCount, starTex, new THREE.Color(STAR_COLOR).multiplyScalar(STAR_HDR), heroCfg);
  addPool(pinCount, pinTex, new THREE.Color(PIN_COLOR).multiplyScalar(PIN_HDR), pinCfg);

  // --- фолбэк-ореолы (включаются только когда bloom выключен лесенкой) ---
  const haloGroup = new THREE.Group();
  haloGroup.visible = false;
  container.add(haloGroup);
  let haloTex: THREE.Texture | null = null;
  const haloSprites: THREE.Sprite[] = [];
  let fakeGlow = false;
  let transmissionOn = opts.transmission ?? true;
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
        rimMat.color.set(RIM_COLOR).multiplyScalar(q.bloom ? RIM_HDR : 1.0);
        // seamLineMat/formMat уже в LDR — демоутить нечего.
        // Светящиеся швы: без bloom эмиссия >1 просто выжигается ACES в белую
        // сетку — опускаем её в LDR, свет изнутри остаётся, ореола нет.
        for (const sm of seamMats) sm.emissiveIntensity = q.bloom ? SEAM_HDR : 1.0;
        for (let i = 0; i < glints.length; i++) {
          const isHero = i < heroCount;
          const c = isHero ? STAR_COLOR : PIN_COLOR;
          const k = q.bloom ? (isHero ? STAR_HDR : PIN_HDR) : 1.0;
          (glints[i].sprite.material as THREE.SpriteMaterial).color.set(c).multiplyScalar(k);
        }
      }
      if (q.transmission !== undefined && q.transmission !== transmissionOn) {
        transmissionOn = q.transmission;
        for (const m of glassMats) {
          m.transmission = transmissionOn ? (m.userData.transmission as number) : 0;
          // Без преломления грань теряет весь проходящий свет и проваливается
          // в чёрное — компенсируем отражением окружения.
          m.envMapIntensity = (m.userData.envMapIntensity as number) * (transmissionOn ? 1 : 1.45);
          m.needsUpdate = true; // transmission 0↔>0 меняет дефайны шейдера
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
      for (const og of outlineGeos) og.dispose();
      boxEdgeGeo.dispose();
      formMat.dispose();
      seamLineMat.dispose();
      rimMat.dispose();
      seamGeo.dispose();
      (silhouette.geometry as THREE.BufferGeometry).dispose();
      seamTexSide.dispose();
      seamTexTop.dispose();
      for (const sm of seamMats) sm.dispose();
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
      // Сдвиг лупа — ВДОЛЬ НОРМАЛИ ГРАНИ блока (панель выезжает из куба наружу).
      if (mi === null) tmp.set(0, 0, 0);
      else tmp.copy(po.normal).multiplyScalar(moverPhase(movers[mi], tLoop) * movers[mi].dist);
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
      // Преломление стоит ЦЕЛОГО повторного рендера сцены в transmission-таргет
      // (three, ещё и с MSAA×4 и мип-цепочкой). Снимаем его раньше блума: без
      // блума сцена рассыпается визуально сильнее, чем без «стеклянности».
      applies: () => transmissionOn,
      apply: () => handle.setQuality({ transmission: false }),
      label: 'transmission выключен (непрозрачное тёмное стекло)',
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
      edgeMat: rimMat,
      seamMat,
      seamLayer,
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
