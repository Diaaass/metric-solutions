'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// Визуал показывается только от xl (контейнер в Hero и так hidden xl:flex,
// но гейт через matchMedia не даёт мобильному браузеру скачивать видео).
const DESKTOP_QUERY = '(min-width: 1280px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Через сколько проверяем, тронулся ли ролик с места (мс).
const PLAYBACK_CHECK_MS = 900;

type Mode = 'hidden' | 'poster' | 'video';

/**
 * Подписка на MediaQueryList с фолбэком для старых Safari (≤13), где нет
 * addEventListener — только устаревший addListener. Без фолбэка эффект
 * кидал бы TypeError и ронял весь клиентский рендер.
 */
function subscribeMedia(mql: MediaQueryList, onChange: () => void): () => void {
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }
  mql.addListener(onChange);
  return () => mql.removeListener(onChange);
}

/**
 * Правая часть hero: анимация появления кристалла (2 с, проигрывается один раз
 * и замирает на финальном кадре).
 *
 * Ролик — с настоящим альфа-каналом (фон прозрачный, чёрный выключен ещё при
 * кодировании): mix-blend-mode на видео/канвасе Chromium композитит ненадёжно,
 * а прозрачное видео рендерится нативно везде. Два источника:
 * - logo-reveal.webm — VP9 + альфа (Chrome, Firefox, Edge; quicktime они не
 *   играют и пропускают первый source);
 * - logo-reveal.mov — HEVC + альфа (Safari выбирает его первым).
 *
 * Фолбэк — logo-crystal.png, финальный кадр этого же ролика с альфой. Он
 * показывается при prefers-reduced-motion и когда автоплей запрещён, поэтому
 * кристалл в hero виден всегда: отличается только наличие движения.
 */
export default function HeroVisual() {
  const [mode, setMode] = useState<Mode>('hidden');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);

    const update = () => {
      if (!desktop.matches) setMode('hidden');
      else setMode(reduced.matches ? 'poster' : 'video');
    };
    update();

    const unsubscribeDesktop = subscribeMedia(desktop, update);
    const unsubscribeReduced = subscribeMedia(reduced, update);
    return () => {
      unsubscribeDesktop();
      unsubscribeReduced();
    };
  }, []);

  useEffect(() => {
    if (mode !== 'video') return;
    const video = videoRef.current;
    if (!video) return;

    // Подстраховка автоплея: элемент монтируется после гидрации, и в отдельных
    // окружениях атрибут autoPlay к этому моменту уже не срабатывает.
    // Ошибку промиса намеренно глотаем: браузер отклоняет play() и когда
    // прерывает собственный автоплей (AbortError) — по ней судить о запрете
    // нельзя, иначе рабочий ролик подменялся бы картинкой.
    void video.play().catch(() => {});

    // Судим по факту: если ролик так и не сдвинулся — автоплей запрещён.
    const timer = setTimeout(() => {
      if (video.paused && video.currentTime === 0) setMode('poster');
    }, PLAYBACK_CHECK_MS);

    return () => clearTimeout(timer);
  }, [mode]);

  if (mode === 'hidden') return null;

  if (mode === 'poster') {
    return (
      <Image
        src="/logo-crystal.png"
        alt=""
        width={720}
        height={802}
        priority
        className="relative h-auto w-full"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className="relative h-auto w-full"
      autoPlay
      muted
      playsInline
      preload="auto"
      poster="/logo-crystal.png"
      aria-hidden="true"
    >
      {/* Safari: HEVC с альфой; Chrome/Firefox не играют quicktime и идут дальше */}
      <source src="/logo-reveal.mov" type='video/quicktime; codecs="hvc1"' />
      {/* Chrome/Firefox/Edge: VP9 с альфой */}
      <source src="/logo-reveal.webm" type="video/webm" />
    </video>
  );
}
