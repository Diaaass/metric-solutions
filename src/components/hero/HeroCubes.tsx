'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { SceneHandle } from './cubeScene';

/**
 * Клиентская обёртка hero-кубов (Фаза 2).
 *
 * - Статичный постер /hero-3d.webp остаётся в SSR-разметке как LCP.
 * - three-сцена грузится ЛЕНИВО (dynamic import) когда браузер простаивает
 *   (requestIdleCallback) → three НЕ попадает в initial-бандл страницы.
 * - Когда сцена отрисовала первый кадр — кроссфейд: постер гаснет, канвас
 *   проявляется.
 * - Фолбэки: prefers-reduced-motion / нет WebGL / < lg → остаётся статичный постер.
 * - Пауза рендера, когда вкладка скрыта (visibilitychange) или блок вне
 *   вьюпорта (IntersectionObserver).
 */
export default function HeroCubes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let creating = false;
    let idleId: number | null = null;
    let inView = true; // hero над сгибом → по умолчанию видим

    interface IdleApi {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
      setTimeout: (cb: () => void, ms: number) => number;
      clearTimeout: (id: number) => void;
    }
    const iw = window as unknown as IdleApi;

    const applyPause = () => {
      sceneRef.current?.setPaused(document.hidden || !inView);
    };

    const create = async () => {
      if (sceneRef.current || creating || cancelled) return;
      creating = true;
      try {
        const { createScene } = await import('./cubeScene');
        if (cancelled) return;
        const debug = location.search.includes('cubesdebug');
        const handle = createScene(canvas, {
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
    </>
  );
}
