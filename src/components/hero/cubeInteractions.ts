import * as THREE from 'three';
import { damp3, dampE } from 'maath/easing';
import { GRID_STEP, type CubePiece, type InteractDebug, type SceneHandle } from './cubeScene';

/**
 * Интерактив hero-кластера (этап 2): «комбо без подсветки».
 *
 *   1. НАКЛОН — вся сцена (tiltGroup) доворачивается за курсором (±5° по Y, ±2.5°
 *      по X) + параллакс ±8px; сглаживание maath damp3/dampE (smoothTime 0.2s),
 *      уход курсора с секции → плавный возврат к нейтрали.
 *   2. РЕПУЛЬСИЯ — луч курсора бьётся в невидимую плоскость на средней глубине
 *      кластера; точку ведёт двухступенчатая цепочка следования («тяжёлый»
 *      курсор с инерцией), блоки в радиусе 2 клеток отъезжают ОТ неё вдоль
 *      ДОМИНАНТНОЙ изо-оси (не по произвольному вектору — сохраняем кубическую
 *      пластику), амплитуда ≤0.42 клетки с smoothstep-затуханием к краю.
 *   3. ВОЛНА ОТ КЛИКА/ТАПА — радиальный фронт (5 клеток/с) с гауссовым окном:
 *      блок получает импульс 0.25 клетки вдоль своей доминантной оси ОТ точки
 *      клика. Пул до 3 волн, при наложении — взвешенное усреднение (не сумма).
 *   4. IDLE-АВТОВОЛНА — после 3с без ввода волны идут сами раз в 3–4с
 *      (оживляет «мёртвый» экран; это же поведение = амбиент для тача).
 *   5. ТАЧ (hover: none) — вместо слежения за курсором медленный автодрейф
 *      наклона (±2°, период 12с); тап = обычная волна.
 *
 * ВСЁ считается РОВНО ОДИН РАЗ ЗА КАДР в scene.onFrame: обработчики событий
 * только запоминают координаты (passive, без чтения layout), рейкаст — один на
 * кадр, векторы переиспользуются (в горячем пути нет аллокаций).
 *
 * Результат пишется в piece.offset — АДДИТИВНЫЙ слот поверх базы и фонового
 * лупа (см. cubeScene): бесшовность 15-секундного цикла не нарушается, в покое
 * все офсеты строго нулевые.
 */

// --- наклон -----------------------------------------------------------------
const DEG = Math.PI / 180;
const TILT_MAX_Y = 5 * DEG; // спека: ±4–6° по горизонтали курсора
const TILT_MAX_X = 2.5 * DEG; // спека: ±2–3° по вертикали
const TILT_PARALLAX_PX = 8; // спека: ±6–10px (переводится в world по кадру камеры)
const TILT_SMOOTH = 0.2; // smoothTime damp/dampE, сек (λ≈5, e-folding ~200мс)
const DRIFT_AMP = 2 * DEG; // тач: автодрейф ±2°
const DRIFT_PERIOD = 12; // тач: период дрейфа, сек

// --- репульсия --------------------------------------------------------------
const REPEL_RADIUS = 2 * GRID_STEP; // спека: ~1.6–2.2 юнита сетки
const REPEL_AMP = 0.42 * GRID_STEP; // спека: ≤0.5 шага сетки
const REPEL_SMOOTH = 0.3; // smoothTime damp3, сек (отклик ~300мс)
const FOLLOW_LERP = 0.08; // цепочка следования, ступень 1 (за кадр при 60fps)
const FOLLOW_ACCEL = 0.05; // ступень 2: ускорение к первой точке
const FOLLOW_DAMP = 0.05; // ступень 2: демпфирование скорости (vel *= 0.95)

// --- волны ------------------------------------------------------------------
const WAVE_SPEED = 5 * GRID_STEP; // спека: ~5 клеток/с
const WAVE_WIDTH = 0.9 * GRID_STEP; // ширина гауссова окна фронта
const WAVE_AMP = 0.25 * GRID_STEP; // импульс блока
const WAVE_POOL = 3; // максимум одновременных волн
const WAVE_EPS = 0.004; // окно ниже — вклад игнорируем
const OFFSET_CLAMP = 0.7 * GRID_STEP; // потолок |репульсия + волны| (монолит читается)

// --- idle -------------------------------------------------------------------
const IDLE_AFTER = 3; // сек без ввода → включается автоволна
const IDLE_MIN = 3; // период автоволн: 3–4с
const IDLE_RANGE = 1;

/** Детерминированный ГПСЧ (mulberry32) — автоволны воспроизводимы в тестах. */
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

const smoothstep01 = (x: number): number => x * x * (3 - 2 * x);

interface Wave {
  origin: THREE.Vector3;
  t0: number;
  /** Дальше этого расстояния блоков нет → фронт прошёл, волна гасится. */
  reach: number;
  active: boolean;
}

export interface InteractionsHandle {
  /**
   * false — интерактив «замораживается» (кнопка паузы): новый ввод игнорируется,
   * офсеты и наклон остаются как есть (кадр стоит, сцена всё равно не рендерится).
   */
  setActive: (active: boolean) => void;
  dispose: () => void;
}

export function attachInteractions(
  scene: SceneHandle,
  section: HTMLElement,
  canvas: HTMLCanvasElement,
): InteractionsHandle {
  const pieces = scene.pieces;
  const n = pieces.length;
  const camera = scene.camera;
  const cluster = scene.cluster;
  const tiltGroup = scene.tiltGroup;
  const measure = !!scene.debug; // инструментовка только в дебаг-режиме

  // --- переиспользуемые векторы (в кадре НОЛЬ аллокаций) --------------------
  const ndc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane();
  const camFwd = new THREE.Vector3();
  const camRight = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  const clusterWorld = new THREE.Vector3();
  const hit = new THREE.Vector3();
  const follow1 = new THREE.Vector3();
  const follow2 = new THREE.Vector3();
  const followVel = new THREE.Vector3();
  const away = new THREE.Vector3();
  const target = new THREE.Vector3();
  const acc = new THREE.Vector3();
  const waveAcc = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const tiltEuler = new THREE.Euler();
  const tiltPos = new THREE.Vector3();
  const repel: THREE.Vector3[] = new Array(n);
  for (let i = 0; i < n; i++) repel[i] = new THREE.Vector3();

  camera.updateMatrixWorld();
  camera.getWorldDirection(camFwd); // взгляд камеры → нормаль плоскости кластера
  camRight.setFromMatrixColumn(camera.matrixWorld, 0);
  camUp.setFromMatrixColumn(camera.matrixWorld, 1);

  // Фронтальные блоки — источники idle-волн (волна с изнанки не читается).
  const frontIdx: number[] = [];
  for (let i = 0; i < n; i++) {
    if (pieces[i].base.dot(camFwd) < -0.2) frontIdx.push(i);
  }
  if (!frontIdx.length) for (let i = 0; i < n; i++) frontIdx.push(i);

  const waves: Wave[] = [];
  for (let i = 0; i < WAVE_POOL; i++) {
    waves.push({ origin: new THREE.Vector3(), t0: 0, reach: 0, active: false });
  }

  const rng = mulberry32(0x5eed2026);

  // --- состояние ------------------------------------------------------------
  // Тач → автодрейф вместо слежения за курсором. ?cubestouch=1 включает ту же
  // ветку на десктопе: иначе тач-поведение нечем проверить в headless-прогоне
  // (matchMedia там всегда hover:hover). На боевом трафике флага нет, поведение
  // определяет только медиазапрос.
  const coarse =
    window.matchMedia('(hover: none)').matches || location.search.includes('cubestouch');
  let enabled = true; // debug: полное отключение (проверка бесшовности лупа)
  let active = true; // кнопка паузы
  let drift = coarse; // автодрейф наклона
  let clock = 0; // собственное время интерактива (не трогает simTime сцены)
  let lastInput = -IDLE_AFTER; // «давно не было ввода» на старте → idle-волны сразу
  let nextIdle = 0;
  let costMs = 0;

  let ptrX = 0; // клиентские координаты последнего pointermove (без чтения layout)
  let ptrY = 0;
  let hasPointer = false;
  let followInit = false;
  let downX = 0;
  let downY = 0;
  let downPending = false;
  let synthetic = false; // debug: координаты заданы напрямую в NDC

  // Нормализованные координаты кадра (обновляются раз в кадр):
  let tiltNX = 0; // [-1,1] по секции, x вправо
  let tiltNY = 0; // [-1,1] по секции, y ВНИЗ
  let rayNX = 0; // NDC канваса, x вправо
  let rayNY = 0; // NDC канваса, y ВВЕРХ

  // --- кэш прямоугольников: layout читаем максимум раз в кадр, и только «грязным» ---
  let rectsDirty = true;
  let secL = 0;
  let secT = 0;
  let secW = 1;
  let secH = 1;
  let cnvL = 0;
  let cnvT = 0;
  let cnvW = 1;
  let cnvH = 1;
  let parallaxWorld = 0;

  const readRects = () => {
    const s = section.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    secL = s.left;
    secT = s.top;
    secW = s.width || 1;
    secH = s.height || 1;
    cnvL = c.left;
    cnvT = c.top;
    cnvW = c.width || 1;
    cnvH = c.height || 1;
    // ±TILT_PARALLAX_PX экранных пикселей → world units текущего кадра камеры
    parallaxWorld = (TILT_PARALLAX_PX * (camera.right - camera.left)) / cnvW;
    rectsDirty = false;
  };

  const markDirty = () => {
    rectsDirty = true;
  };

  readRects(); // стартовое состояние — дальше только по «грязному» флагу

  // --- события: ТОЛЬКО запоминаем, вся работа — в кадре ---------------------
  const onMove = (e: PointerEvent) => {
    if (!active) return;
    ptrX = e.clientX;
    ptrY = e.clientY;
    hasPointer = true;
    synthetic = false;
    lastInput = clock;
  };

  const onLeave = () => {
    hasPointer = false;
    followInit = false;
  };

  const onDown = (e: PointerEvent) => {
    if (!active) return;
    // Клик по кнопке паузы (или любой ссылке) — это управление, а не «тык в кластер»:
    // волну не пускаем, иначе пауза замораживала бы сцену прямо посреди волны.
    const el = e.target as Element | null;
    if (el && typeof el.closest === 'function' && el.closest('a,button')) return;
    ptrX = e.clientX;
    ptrY = e.clientY;
    downX = e.clientX;
    downY = e.clientY;
    downPending = true;
    synthetic = false;
    lastInput = clock;
    if (!coarse) hasPointer = true;
  };

  const onUp = () => {
    if (coarse) {
      hasPointer = false;
      followInit = false;
    }
  };

  section.addEventListener('pointermove', onMove, { passive: true });
  section.addEventListener('pointerdown', onDown, { passive: true });
  section.addEventListener('pointerup', onUp, { passive: true });
  section.addEventListener('pointercancel', onUp, { passive: true });
  section.addEventListener('pointerleave', onLeave, { passive: true });
  window.addEventListener('scroll', markDirty, { passive: true });
  window.addEventListener('resize', markDirty, { passive: true });
  const ro = new ResizeObserver(markDirty);
  ro.observe(section);

  // --- волны ----------------------------------------------------------------
  const spawnWave = (origin: THREE.Vector3) => {
    let slot = waves.find((w) => !w.active);
    if (!slot) {
      slot = waves[0];
      for (const w of waves) if (w.t0 < slot.t0) slot = w; // вытесняем самую старую
    }
    let reach = 0;
    for (let i = 0; i < n; i++) {
      const d = pieces[i].base.distanceTo(origin);
      if (d > reach) reach = d;
    }
    slot.origin.copy(origin);
    slot.t0 = clock;
    slot.reach = reach;
    slot.active = true;
  };

  /** Точка луча (NDC → плоскость кластера) в ЛОКАЛЬНЫХ координатах кластера. */
  const rayToCluster = (nx: number, ny: number, out: THREE.Vector3): boolean => {
    cluster.updateWorldMatrix(true, false);
    cluster.getWorldPosition(clusterWorld);
    plane.setFromNormalAndCoplanarPoint(camFwd, clusterWorld);
    ndc.set(nx, ny);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(plane, out)) return false;
    cluster.worldToLocal(out);
    return true;
  };

  /**
   * Смещение amp вдоль НОРМАЛИ ГРАНИ блока.
   *
   * До этапа 4 блоки были свободными кубиками кластера и отъезжали вдоль
   * доминантной мировой оси вектора «от курсора». Теперь блок — ячейка грани
   * большого куба, и единственное движение, которое не ломает силуэт, — вдоль
   * нормали этой грани (ровно как панели в референсе). Поэтому вектор v лишь
   * ЗАДАЁТ ЗНАК: панель уезжает от курсора наружу или утапливается внутрь.
   * Если v почти в плоскости грани (курсор прямо напротив), знак берём наружу.
   */
  const alongNormal = (
    piece: CubePiece,
    v: THREE.Vector3,
    amp: number,
    out: THREE.Vector3,
    outwardOnly = false,
  ) => {
    const s = outwardOnly ? 1 : v.dot(piece.normal) < -1e-3 ? -1 : 1;
    out.copy(piece.normal).multiplyScalar(amp * s);
  };

  const clearOffsets = () => {
    for (let i = 0; i < n; i++) {
      repel[i].set(0, 0, 0);
      pieces[i].offset.set(0, 0, 0);
    }
    for (const w of waves) w.active = false;
    tiltGroup.rotation.set(0, 0, 0);
    tiltGroup.position.set(0, 0, 0);
    follow1.set(0, 0, 0);
    follow2.set(0, 0, 0);
    followVel.set(0, 0, 0);
    followInit = false;
  };

  // --- кадр -----------------------------------------------------------------
  const frame = (_t: number, dt: number) => {
    if (!enabled) return;
    const t0 = measure ? performance.now() : 0;
    clock += dt;
    // Шагов «кадров при 60fps» в этом dt — цепочка следования настроена на 60fps
    // и через f остаётся независимой от частоты обновления.
    const f = Math.min(dt * 60, 3);

    if (!synthetic) {
      if (rectsDirty) readRects();
      if (hasPointer) {
        tiltNX = Math.max(-1, Math.min(1, ((ptrX - secL) / secW) * 2 - 1));
        tiltNY = Math.max(-1, Math.min(1, ((ptrY - secT) / secH) * 2 - 1));
        rayNX = ((ptrX - cnvL) / cnvW) * 2 - 1;
        rayNY = -(((ptrY - cnvT) / cnvH) * 2 - 1);
      }
    }

    // 1. НАКЛОН + ПАРАЛЛАКС ---------------------------------------------------
    if (drift) {
      const ph = (clock / DRIFT_PERIOD) * Math.PI * 2;
      tiltEuler.set(Math.cos(ph) * DRIFT_AMP * 0.5, Math.sin(ph) * DRIFT_AMP, 0);
      tiltPos.set(0, 0, 0);
    } else if (hasPointer) {
      tiltEuler.set(-tiltNY * TILT_MAX_X, tiltNX * TILT_MAX_Y, 0);
      tiltPos
        .copy(camRight)
        .multiplyScalar(tiltNX * parallaxWorld)
        .addScaledVector(camUp, -tiltNY * parallaxWorld);
    } else {
      tiltEuler.set(0, 0, 0);
      tiltPos.set(0, 0, 0);
    }
    dampE(tiltGroup.rotation, tiltEuler, TILT_SMOOTH, dt);
    damp3(tiltGroup.position, tiltPos, TILT_SMOOTH, dt);

    // 2. ТОЧКА КУРСОРА В КЛАСТЕРЕ + ЦЕПОЧКА СЛЕДОВАНИЯ ------------------------
    const repelOn = hasPointer && !coarse;
    if (repelOn && rayToCluster(rayNX, rayNY, hit)) {
      if (!followInit) {
        follow1.copy(hit);
        follow2.copy(hit);
        followVel.set(0, 0, 0);
        followInit = true;
      } else {
        follow1.lerp(hit, 1 - Math.pow(1 - FOLLOW_LERP, f));
        tmp
          .copy(follow1)
          .sub(follow2)
          .multiplyScalar(FOLLOW_ACCEL * f);
        followVel.add(tmp).multiplyScalar(Math.pow(1 - FOLLOW_DAMP, f));
        follow2.addScaledVector(followVel, f);
      }
    }

    // 3. ВОЛНА ПО КЛИКУ / ТАПУ ------------------------------------------------
    if (downPending) {
      downPending = false;
      if (rectsDirty) readRects();
      // клик засчитываем только по блоку визуала (по остальной секции — нет)
      if (downX >= cnvL && downX <= cnvL + cnvW && downY >= cnvT && downY <= cnvT + cnvH) {
        const nx = ((downX - cnvL) / cnvW) * 2 - 1;
        const ny = -(((downY - cnvT) / cnvH) * 2 - 1);
        if (rayToCluster(nx, ny, tmp)) spawnWave(tmp);
      }
    }

    // 4. IDLE-АВТОВОЛНА -------------------------------------------------------
    if (clock - lastInput > IDLE_AFTER && clock >= nextIdle) {
      const idx = frontIdx[Math.floor(rng() * frontIdx.length)];
      spawnWave(pieces[idx].base);
      nextIdle = clock + IDLE_MIN + rng() * IDLE_RANGE;
    }

    // гасим прошедшие волны (фронт ушёл за кластер + хвост окна)
    let waveCount = 0;
    for (const w of waves) {
      if (!w.active) continue;
      if (WAVE_SPEED * (clock - w.t0) > w.reach + 3 * WAVE_WIDTH) w.active = false;
      else waveCount++;
    }

    // 5. ОФСЕТЫ БЛОКОВ: репульсия (пружина) + волны (аналитика) ---------------
    for (let i = 0; i < n; i++) {
      const p = pieces[i];

      target.set(0, 0, 0);
      if (repelOn && followInit) {
        away.copy(p.base).sub(follow2);
        const dist = away.length();
        if (dist < REPEL_RADIUS) {
          alongNormal(p, away, REPEL_AMP * smoothstep01(1 - dist / REPEL_RADIUS), target);
        }
      }
      damp3(repel[i], target, REPEL_SMOOTH, dt);
      acc.copy(repel[i]);

      if (waveCount > 0) {
        waveAcc.set(0, 0, 0);
        let wsum = 0;
        for (const w of waves) {
          if (!w.active) continue;
          away.copy(p.base).sub(w.origin);
          const rel = away.length() - WAVE_SPEED * (clock - w.t0);
          const g = Math.exp(-(rel * rel) / (WAVE_WIDTH * WAVE_WIDTH));
          if (g < WAVE_EPS) continue;
          // Волна ВСЕГДА выталкивает панель наружу: фронт пробегает по граням
          // большого куба, поднимая их, а не вминая половину внутрь.
          alongNormal(p, away, WAVE_AMP * g, tmp, true);
          waveAcc.add(tmp);
          wsum += g;
        }
        // Взвешенное усреднение (Codrops): одна волна даёт полную амплитуду окна,
        // наложение нескольких НЕ складывается в мешанину, а усредняется.
        if (wsum > 0) acc.addScaledVector(waveAcc, 1 / Math.max(1, wsum));
      }

      const len = acc.length();
      if (len > OFFSET_CLAMP) acc.multiplyScalar(OFFSET_CLAMP / len);
      p.offset.copy(acc);
    }

    if (measure) costMs = performance.now() - t0;
  };

  scene.onFrame = frame;

  // --- тест-хуки (?cubesdebug) ---------------------------------------------
  if (scene.debug) {
    const dbg: InteractDebug = {
      setPointer(nx: number, ny: number) {
        readRects(); // parallaxWorld считается от актуального кадра камеры
        synthetic = true;
        hasPointer = true;
        rayNX = nx;
        rayNY = ny;
        tiltNX = nx;
        tiltNY = -ny;
        lastInput = clock;
      },
      clearPointer() {
        hasPointer = false;
        followInit = false;
        lastInput = clock;
      },
      triggerWave(nx: number, ny: number) {
        if (rayToCluster(nx, ny, tmp)) spawnWave(tmp);
        lastInput = clock;
      },
      setEnabled(on: boolean) {
        enabled = on;
        if (!on) clearOffsets();
      },
      setDrift(on: boolean) {
        drift = on;
      },
      dump() {
        let maxOff = 0;
        const off: number[][] = [];
        for (let i = 0; i < n; i++) {
          const o = pieces[i].offset;
          maxOff = Math.max(maxOff, o.length());
          off.push([+o.x.toFixed(4), +o.y.toFixed(4), +o.z.toFixed(4)]);
        }
        return {
          clock: +clock.toFixed(3),
          cell: GRID_STEP,
          tilt: {
            rotDegX: +(tiltGroup.rotation.x / DEG).toFixed(3),
            rotDegY: +(tiltGroup.rotation.y / DEG).toFixed(3),
            pos: [
              +tiltGroup.position.x.toFixed(4),
              +tiltGroup.position.y.toFixed(4),
              +tiltGroup.position.z.toFixed(4),
            ],
          },
          pointer: { has: hasPointer, ndc: [rayNX, rayNY], synthetic },
          follow: [+follow2.x.toFixed(3), +follow2.y.toFixed(3), +follow2.z.toFixed(3)],
          waves: waves
            .filter((w) => w.active)
            .map((w) => ({
              age: +(clock - w.t0).toFixed(3),
              front: +(WAVE_SPEED * (clock - w.t0)).toFixed(3),
              origin: [+w.origin.x.toFixed(2), +w.origin.y.toFixed(2), +w.origin.z.toFixed(2)],
            })),
          maxOffsetCells: +(maxOff / GRID_STEP).toFixed(4),
          movedPieces: off.filter((o) => Math.hypot(o[0], o[1], o[2]) > 0.01).length,
          costMs: +costMs.toFixed(4),
          offsets: off,
        };
      },
    };
    scene.debug.interact = dbg;
  }

  return {
    setActive(on: boolean) {
      active = on;
      if (!on) {
        hasPointer = false;
        followInit = false;
        downPending = false;
      } else {
        lastInput = clock;
      }
    },
    dispose() {
      scene.onFrame = null;
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerdown', onDown);
      section.removeEventListener('pointerup', onUp);
      section.removeEventListener('pointercancel', onUp);
      section.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', markDirty);
      window.removeEventListener('resize', markDirty);
      ro.disconnect();
      if (scene.debug) scene.debug.interact = undefined;
    },
  };
}
