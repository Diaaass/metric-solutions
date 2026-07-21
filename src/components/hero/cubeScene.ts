import * as THREE from 'three';

/**
 * Процедурная изометрическая сцена из кубов для hero (Фаза 2).
 * Vanilla three.js (без react-three-fiber). Фабрика createScene() создаёт
 * рендерер поверх переданного <canvas>, строит кластер тёмно-синих «стеклянных»
 * кубов, мигающие 4-лучевые блики и детерминированный бесшовный цикл сдвигов
 * групп кубов на один шаг сетки вдоль изо-осей.
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
const SEED = 20260721; // фикс-сид: стабильный кластер и расписание сдвигов
const CUBE = 1; // ребро куба (world units)
const GAP = 0.04; // микро-зазор между кубами, чтобы читались рёбра
const STEP = CUBE + GAP; // шаг сетки
const LOOP = 15; // период бесшовного цикла сдвигов, сек

// ---------------------------------------------------------------------------
// Текстура 4-лучевой звезды-блика (мягкое свечение + острые лучи).
// ---------------------------------------------------------------------------
function makeStarTexture(): THREE.Texture {
  const S = 128;
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = S;
  const ctx = cnv.getContext('2d')!;
  const c = S / 2;

  // мягкое радиальное свечение (голубое, с широким bloom-ореолом)
  const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
  glow.addColorStop(0, 'rgba(175,218,255,0.98)');
  glow.addColorStop(0.1, 'rgba(95,170,255,0.72)');
  glow.addColorStop(0.28, 'rgba(30,115,238,0.3)');
  glow.addColorStop(0.6, 'rgba(16,72,185,0.09)');
  glow.addColorStop(1, 'rgba(10,40,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  // лучи звезды: рисуем через градиент-полоски (аддитивно поверх)
  const drawRay = (angle: number, len: number, width: number) => {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, 'rgba(220,240,255,0.95)');
    g.addColorStop(0.5, 'rgba(120,190,255,0.35)');
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
  // 4 длинных луча (крест) + 4 коротких (диагонали)
  for (let i = 0; i < 4; i++) drawRay((i * Math.PI) / 2, c * 0.95, 2.2);
  for (let i = 0; i < 4; i++) drawRay((i * Math.PI) / 2 + Math.PI / 4, c * 0.5, 1.4);

  // яркое ядро
  const core = ctx.createRadialGradient(c, c, 0, c, c, S * 0.06);
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
// Геометрия кластера: два «лобных» эллипсоида (верхний крупнее) с талией.
// ---------------------------------------------------------------------------
interface CubeCell {
  i: number;
  j: number;
  k: number;
}

function buildCells(rng: () => number): CubeCell[] {
  const cells: CubeCell[] = [];
  const present = new Set<string>();
  const key = (i: number, j: number, k: number) => `${i},${j},${k}`;

  // верхний лобик (больше) + нижний (меньше), сдвинуты по Y, между ними талия
  const lobes = [
    { cx: 0, cy: 2.1, cz: 0, rx: 2.3, ry: 2.0, rz: 2.3 }, // верхний
    { cx: 0.2, cy: -2.4, cz: -0.2, rx: 1.7, ry: 1.7, rz: 1.7 }, // нижний
  ];

  for (let i = -4; i <= 4; i++) {
    for (let j = -5; j <= 5; j++) {
      for (let k = -4; k <= 4; k++) {
        let inside = false;
        for (const l of lobes) {
          const dx = (i - l.cx) / l.rx;
          const dy = (j - l.cy) / l.ry;
          const dz = (k - l.cz) / l.rz;
          const d = dx * dx + dy * dy + dz * dz;
          // мягкая граница: срез + немного шума → неровный ступенчатый силуэт
          if (d <= 1 - 0.18 + rng() * 0.36) {
            inside = true;
            break;
          }
        }
        if (inside) {
          cells.push({ i, j, k });
          present.add(key(i, j, k));
        }
      }
    }
  }

  // Отбрасываем полностью внутренние кубы (все 6 соседей есть) — они невидимы,
  // экономим draw calls и заодно получаем «пустоты» при сдвигах.
  const visible = cells.filter(({ i, j, k }) => {
    return !(
      present.has(key(i + 1, j, k)) &&
      present.has(key(i - 1, j, k)) &&
      present.has(key(i, j + 1, k)) &&
      present.has(key(i, j - 1, k)) &&
      present.has(key(i, j, k + 1)) &&
      present.has(key(i, j, k - 1))
    );
  });
  return visible;
}

// ---------------------------------------------------------------------------
// Расписание сдвигов: детерминированное, бесшовное (в t=0 и t=LOOP смещения=0).
// ---------------------------------------------------------------------------
interface Mover {
  cubeIdx: number[]; // индексы кубов группы
  axis: THREE.Vector3; // направление сдвига (world), длина = STEP
  tOut: number; // старт «разъезда»
  dOut: number; // длительность разъезда
  tBack: number; // старт возврата
  dBack: number; // длительность возврата
}

function buildMovers(
  cells: CubeCell[],
  rng: () => number,
): { movers: Mover[]; cubeMover: (number | null)[] } {
  const axes = [
    new THREE.Vector3(STEP, 0, 0),
    new THREE.Vector3(-STEP, 0, 0),
    new THREE.Vector3(0, STEP, 0),
    new THREE.Vector3(0, -STEP, 0),
    new THREE.Vector3(0, 0, STEP),
    new THREE.Vector3(0, 0, -STEP),
  ];
  const cellKey = new Map<string, number>();
  cells.forEach((c, idx) => cellKey.set(`${c.i},${c.j},${c.k}`, idx));

  const cubeMover: (number | null)[] = new Array(cells.length).fill(null);
  const movers: Mover[] = [];
  const EVENTS = 13;

  for (let e = 0; e < EVENTS; e++) {
    // выбираем свободный «семя»-куб
    let seed = -1;
    for (let tries = 0; tries < 40; tries++) {
      const cand = Math.floor(rng() * cells.length);
      if (cubeMover[cand] === null) {
        seed = cand;
        break;
      }
    }
    if (seed < 0) break;

    // группа: семя + до 3 свободных соседей по сетке
    const group = [seed];
    const c0 = cells[seed];
    const neighborOffsets = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];
    const shuffled = neighborOffsets.sort(() => rng() - 0.5);
    const groupSize = 1 + Math.floor(rng() * 3); // 1..3 доп.
    for (const [oi, oj, ok] of shuffled) {
      if (group.length - 1 >= groupSize) break;
      const idx = cellKey.get(`${c0.i + oi},${c0.j + oj},${c0.k + ok}`);
      if (idx !== undefined && cubeMover[idx] === null) group.push(idx);
    }

    const axis = axes[Math.floor(rng() * axes.length)];
    const dOut = 1.0 + rng() * 0.5; // ~1.0–1.5s
    const dBack = 1.0 + rng() * 0.5;
    const margin = 0.4;
    // размещаем out и back так, чтобы весь round-trip уместился в (0, LOOP)
    const hold = 0.8 + rng() * 2.2;
    const total = dOut + hold + dBack;
    const tOut = margin + rng() * (LOOP - total - 2 * margin);
    const tBack = tOut + dOut + hold;

    const mover: Mover = { cubeIdx: group, axis, tOut, dOut, tBack, dBack };
    const mi = movers.push(mover) - 1;
    for (const idx of group) cubeMover[idx] = mi;
  }

  return { movers, cubeMover };
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
// Блики: пул спрайтов-звёзд, мигают на вершинах фронтальных рёбер.
// ---------------------------------------------------------------------------
interface Glint {
  sprite: THREE.Sprite;
  vertexIdx: number;
  age: number;
  life: number;
  delay: number;
  maxScale: number;
}

export function createScene(
  canvas: HTMLCanvasElement,
  opts: SceneOptions = {},
): SceneHandle | null {
  const rng = mulberry32(SEED);

  // --- renderer (с проверкой WebGL) ---
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

  const scene = new THREE.Scene();
  const container = new THREE.Group();
  scene.add(container);

  // --- камера: истинная изометрия (ортографическая) ---
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
  const isoDir = new THREE.Vector3(1, 0.82, 1).normalize(); // чуть приплюснуто сверху
  camera.position.copy(isoDir.clone().multiplyScalar(60));
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);

  // --- свет: сильный верхний key даёт светлые ВЕРХНИЕ грани и тёмные бока ---
  const hemi = new THREE.HemisphereLight(0x3a5a7e, 0x02060d, 0.6); // холодный мягкий fill
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xeef4ff, 3.05); // почти сверху → светлый верх кубов
  key.position.set(2.5, 11, 4.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x2f63ff, 0.7); // синий контровой (стеклянный край)
  rim.position.set(-7, -1, -5);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0x0b1a30, 0.4));

  // --- материалы/геометрия кубов ---
  const boxGeo = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
  const edgeGeo = new THREE.EdgesGeometry(boxGeo);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x394e68, // navy-графит: верх ловит свет (светло-серый), бока уходят в тень
    metalness: 0.32,
    roughness: 0.5,
    emissive: 0x050e1a,
  });
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x9fc4ef,
    transparent: true,
    opacity: 0.38,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const cells = buildCells(rng);

  // центрируем кластер
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

  interface CubeObj {
    group: THREE.Group;
    base: THREE.Vector3;
  }
  const cubes: CubeObj[] = [];
  for (const c of cells) {
    const g = new THREE.Group();
    const base = new THREE.Vector3((c.i - cx) * STEP, (c.j - cy) * STEP, (c.k - cz) * STEP);
    g.position.copy(base);
    const mesh = new THREE.Mesh(boxGeo, bodyMat);
    g.add(mesh);
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    g.add(edges);
    container.add(g);
    cubes.push({ group: g, base });
  }

  // --- вершины фронтальных рёбер для бликов ---
  const camDir = isoDir.clone(); // направление на камеру от центра
  const vertsWorld: THREE.Vector3[] = [];
  const corners = [
    [-0.5, -0.5, -0.5],
    [0.5, -0.5, -0.5],
    [-0.5, 0.5, -0.5],
    [0.5, 0.5, -0.5],
    [-0.5, -0.5, 0.5],
    [0.5, -0.5, 0.5],
    [-0.5, 0.5, 0.5],
    [0.5, 0.5, 0.5],
  ];
  const seenV = new Set<string>();
  for (const cube of cubes) {
    for (const [ox, oy, oz] of corners) {
      const v = new THREE.Vector3(
        cube.base.x + ox * CUBE,
        cube.base.y + oy * CUBE,
        cube.base.z + oz * CUBE,
      );
      // только фронтальные вершины (обращённые к камере)
      if (v.clone().dot(camDir) < 0.2) continue;
      const kk = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
      if (seenV.has(kk)) continue;
      seenV.add(kk);
      vertsWorld.push(v);
    }
  }

  // --- пул бликов ---
  const starTex = makeStarTexture();
  const glints: Glint[] = [];
  const GLINT_COUNT = Math.min(38, Math.max(18, Math.floor(vertsWorld.length * 0.5)));
  const spawnGlint = (gl: Glint, initial: boolean) => {
    gl.vertexIdx = Math.floor(rng() * vertsWorld.length);
    gl.age = 0;
    gl.life = 0.7 + rng() * 1.1; // 0.7–1.8s
    gl.delay = initial ? rng() * 1.8 : 0.1 + rng() * 1.4;
    // разброс размеров: много мелких + изредка крупная «геройская» звезда
    gl.maxScale = 0.6 + rng() * 1.0 + (rng() < 0.18 ? 1.0 : 0);
    gl.sprite.position.copy(vertsWorld[gl.vertexIdx]);
  };
  for (let i = 0; i < GLINT_COUNT; i++) {
    const mat = new THREE.SpriteMaterial({
      map: starTex,
      color: 0x9fd0ff,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      opacity: 0,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.setScalar(0.001);
    container.add(sprite);
    const gl: Glint = { sprite, vertexIdx: 0, age: 0, life: 1, delay: 0, maxScale: 1 };
    spawnGlint(gl, true);
    glints.push(gl);
  }

  // --- дымка свечения за кластером (фейковый bloom-ambient) ---
  const hazeMat = new THREE.SpriteMaterial({
    map: makeHazeTexture(),
    color: 0x1e5bd6,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    opacity: 0.62,
  });
  const haze = new THREE.Sprite(hazeMat);
  haze.scale.setScalar(12);
  haze.position.set(0, 0, -2);
  container.add(haze);

  // --- подгонка ортокамеры под кластер (только по кубам, без дымки/бликов) ---
  const bbox = new THREE.Box3();
  const half = CUBE / 2;
  const corner = new THREE.Vector3();
  for (const cube of cubes) {
    bbox.expandByPoint(corner.set(cube.base.x - half, cube.base.y - half, cube.base.z - half));
    bbox.expandByPoint(corner.set(cube.base.x + half, cube.base.y + half, cube.base.z + half));
  }
  const sphere = bbox.getBoundingSphere(new THREE.Sphere());
  const fit = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const aspect = w / h;
    // запас под сдвиги кубов (до одного шага сетки наружу)
    const R = sphere.radius + STEP * 0.8;
    let halfH = R;
    let halfW = R;
    if (aspect >= 1) halfW = R * aspect;
    else halfH = R / aspect;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  fit();

  // --- цикл анимации ---
  // Своё накопление времени с ограничением dt: пауза/возврат и троттлинг вкладки
  // не дают «прыжка» по времени (сдвиги кубов остаются плавными).
  let simTime = 0;
  let lastNow = performance.now();
  let raf = 0;
  let paused = false;
  let ready = false;
  const tmp = new THREE.Vector3();
  const { movers, cubeMover } = buildMovers(cells, rng);

  const update = (dt: number) => {
    simTime += dt;
    const t = simTime;
    const tLoop = t % LOOP;

    // общий bob + лёгкое «дыхание»
    container.position.y = Math.sin((t / 7) * Math.PI * 2) * 0.18;
    const breath = 1 + Math.sin((t / 9) * Math.PI * 2) * 0.012;
    container.scale.setScalar(breath);

    // сдвиги кубов
    for (let i = 0; i < cubes.length; i++) {
      const mi = cubeMover[i];
      if (mi === null) continue;
      moverOffset(movers[mi], tLoop, tmp);
      cubes[i].group.position.copy(cubes[i].base).add(tmp);
    }

    // блики
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
      // огибающая с плато: быстрый рост → держим ярко → плавное гашение
      // (больше звёзд одновременно «горят» ярко, как в референсе)
      let env: number;
      if (p < 0.18) env = easeInOutCubic(p / 0.18);
      else if (p > 0.72) env = easeInOutCubic(Math.max(0, (1 - p) / 0.28));
      else env = 1;
      mat.opacity = env;
      gl.sprite.scale.setScalar(0.12 + env * gl.maxScale);
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
    if (dt > 0.1) dt = 0.1; // кламп (после паузы/троттлинга)
    update(dt);
    raf = requestAnimationFrame(loop);
  };

  // ResizeObserver → пересчёт камеры/рендерера
  const ro = new ResizeObserver(() => fit());
  ro.observe(canvas);

  loop();

  return {
    setPaused(p: boolean) {
      if (p === paused) return;
      paused = p;
      if (!p) {
        lastNow = performance.now(); // без скачка dt при возобновлении
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
    advance(dt: number) {
      update(dt);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      boxGeo.dispose();
      edgeGeo.dispose();
      bodyMat.dispose();
      edgeMat.dispose();
      starTex.dispose();
      hazeMat.map?.dispose();
      hazeMat.dispose();
      for (const gl of glints) (gl.sprite.material as THREE.SpriteMaterial).dispose();
      renderer.dispose();
    },
  };
}
