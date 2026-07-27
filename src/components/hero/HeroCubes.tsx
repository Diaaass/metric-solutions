'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SceneHandle } from './cubeScene';
import type { InteractionsHandle } from './cubeInteractions';

/**
 * Клиентская обёртка hero-кубов (Фаза 2 + интерактив этапа 2).
 *
 * - Статичный постер /hero-3d.webp остаётся в SSR-разметке как LCP.
 * - three-сцена грузится ЛЕНИВО (dynamic import) когда браузер простаивает
 *   (requestIdleCallback) → three НЕ попадает в initial-бандл страницы.
 * - Когда сцена отрисовала первый кадр — кроссфейд: постер гаснет, канвас
 *   проявляется, и подключается интерактив (наклон/репульсия/волны).
 * - Фолбэки: prefers-reduced-motion / нет WebGL / < lg → остаётся статичный постер
 *   (интерактив и его чанк в этом случае вообще не грузятся).
 * - Пауза рендера, когда вкладка скрыта (visibilitychange), блок вне вьюпорта
 *   (IntersectionObserver) или пользователь нажал кнопку паузы (WCAG 2.2.2).
 *
 * Слушатели указателя вешает контроллер интерактива — на СЕКЦИЮ hero, потому что
 * сам блок визуала pointer-events-none (ссылки/текст слева должны работать).
 * Единственный элемент с pointer-events-auto внутри блока — кнопка паузы.
 */

/** Выбор пользователя живёт в рамках вкладки — сессии достаточно. */
const PAUSE_KEY = 'heroCubesPaused';

export default function HeroCubes({
  pauseLabel,
  playLabel,
}: {
  pauseLabel: string;
  playLabel: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const interactRef = useRef<InteractionsHandle | null>(null);
  const userPausedRef = useRef(false);
  const applyPauseRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);

  const togglePause = useCallback(() => {
    const next = !userPausedRef.current;
    userPausedRef.current = next;
    setPaused(next);
    try {
      sessionStorage.setItem(PAUSE_KEY, next ? '1' : '0');
    } catch {
      /* приватный режим без storage — выбор просто не переживёт перезагрузку */
    }
    interactRef.current?.setActive(!next); // на паузе ввод игнорируется
    applyPauseRef.current();
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let creating = false;
    let idleId: number | null = null;
    let inView = true; // hero над сгибом → по умолчанию видим

    try {
      if (sessionStorage.getItem(PAUSE_KEY) === '1') {
        userPausedRef.current = true;
        setPaused(true);
      }
    } catch {
      /* storage недоступен — стартуем с воспроизведения */
    }

    interface IdleApi {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
      setTimeout: (cb: () => void, ms: number) => number;
      clearTimeout: (id: number) => void;
    }
    const iw = window as unknown as IdleApi;

    const applyPause = () => {
      sceneRef.current?.setPaused(document.hidden || !inView || userPausedRef.current);
    };
    applyPauseRef.current = applyPause;

    const create = async () => {
      if (sceneRef.current || creating || cancelled) return;
      creating = true;
      try {
        // Оба модуля лежат в одном async-чанке — интерактив грузится вместе со сценой.
        const [{ createScene }, { attachInteractions }] = await Promise.all([
          import('./cubeScene'),
          import('./cubeInteractions'),
        ]);
        if (cancelled) return;
        const debug = location.search.includes('cubesdebug');
        // Сборка сцены асинхронная (куски + yield к браузеру + прекомпил шейдеров):
        // главный поток не блокируется, кроссфейд ждёт готовности первого кадра.
        const handle = await createScene(canvas, {
          capture: debug, // preserveDrawingBuffer только для дебаг-захвата
          onReady: () => {
            if (!cancelled) setReady(true);
          },
        });
        if (!handle) return; // нет WebGL → остаётся постер
        if (cancelled) {
          handle.dispose();
          return;
        }
        sceneRef.current = handle;
        // Указатель слушаем на всей секции hero, а не на канвасе: блок визуала
        // pointer-events-none, да и наклон должен реагировать на движение слева.
        const section = canvas.closest('section');
        if (section) {
          const interactions = attachInteractions(handle, section as HTMLElement, canvas);
          interactions.setActive(!userPausedRef.current);
          interactRef.current = interactions;
        }
        if (debug) {
          (window as unknown as { __hero?: SceneHandle }).__hero = handle;
        }
        applyPause(); // выставить корректное состояние паузы сразу
      } catch {
        // тихо остаёмся на постере
      } finally {
        creating = false;
      }
    };

    const cancelIdle = () => {
      if (idleId == null) return;
      if (iw.cancelIdleCallback) iw.cancelIdleCallback(idleId);
      else iw.clearTimeout(idleId);
      idleId = null;
    };

    const scheduleCreate = () => {
      if (idleId != null || sceneRef.current) return;
      const run = () => {
        idleId = null;
        create();
      };
      if (iw.requestIdleCallback) idleId = iw.requestIdleCallback(run, { timeout: 2500 });
      else idleId = iw.setTimeout(run, 300);
    };

    // Грузим сцену только на lg+ (десктоп). Если сейчас узко — ждём расширения.
    const mql = window.matchMedia('(min-width: 1024px)');
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        inView = entry.isIntersecting;
        if (inView && mql.matches) scheduleCreate();
        applyPause();
      },
      { rootMargin: '200px 0px', threshold: 0 },
    );

    const start = () => {
      if (!mql.matches) return;
      io.observe(canvas);
      scheduleCreate(); // hero над сгибом — не ждём скролла, грузим на idle
    };

    const onMql = () => {
      if (mql.matches) start();
    };
    mql.addEventListener('change', onMql);
    start();

    const onVisibility = () => applyPause();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      cancelIdle();
      io.disconnect();
      mql.removeEventListener('change', onMql);
      document.removeEventListener('visibilitychange', onVisibility);
      interactRef.current?.dispose();
      interactRef.current = null;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <>
      {/* Постер = LCP; в SSR присутствует, кроссфейдится при готовности сцены */}
      <Image
        src="/hero-3d.webp"
        alt=""
        width={1200}
        height={1600}
        priority
        sizes="(min-width: 1024px) 26vw, 0px"
        className={`h-auto w-full object-contain transition-opacity duration-700 ${
          ready ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-700 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* WCAG 2.2.2: любую автоанимацию дольше 5с можно остановить.
          Появляется только когда сцена реально живёт (на постере паузить нечего). */}
      {ready && (
        <button
          type="button"
          onClick={togglePause}
          aria-pressed={paused}
          aria-label={paused ? playLabel : pauseLabel}
          title={paused ? playLabel : pauseLabel}
          // right-7 (а не right-2): блок визуала выступает на 1% за правый край
          // секции, а у секции overflow-hidden — иначе кнопку подрезало бы.
          className="pointer-events-auto absolute bottom-3 right-7 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-ink-950/60 text-white/60 backdrop-blur-sm transition-colors hover:border-white/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        >
          {paused ? (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d="M4.5 2.5v11l9-5.5-9-5.5z" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
              <path d="M4 2.5h3v11H4v-11zm5 0h3v11H9v-11z" />
            </svg>
          )}
        </button>
      )}
    </>
  );
}
