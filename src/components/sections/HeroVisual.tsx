'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// Визуал показывается только от xl (контейнер в Hero и так hidden xl:flex,
// но гейт через matchMedia не даёт мобильному браузеру скачивать видео).
const DESKTOP_QUERY = '(min-width: 1280px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

type Mode = 'hidden' | 'static' | 'video';

/**
 * Правая часть hero: анимация появления логотипа (2 с, проигрывается один раз
 * и замирает на финальном кадре).
 *
 * Ролик — с настоящим альфа-каналом (фон прозрачный, чёрный выключен ещё при
 * кодировании): mix-blend-mode на видео/канвасе Chromium композитит ненадёжно,
 * а прозрачное видео рендерится нативно везде. Два источника:
 * - logo-reveal.webm — VP9 + альфа (Chrome, Firefox, Edge; quicktime они не
 *   играют и пропускают первый source);
 * - logo-reveal.mov — HEVC + альфа (Safari выбирает его первым).
 *
 * prefers-reduced-motion — статичный SVG-логотип, как было до анимации.
 * До монтирования (и на SSR) не рендерим ничего: элемент декоративный.
 */
export default function HeroVisual() {
  const [mode, setMode] = useState<Mode>('hidden');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);

    const update = () => {
      if (!desktop.matches) setMode('hidden');
      else setMode(reduced.matches ? 'static' : 'video');
    };
    update();

    desktop.addEventListener('change', update);
    reduced.addEventListener('change', update);
    return () => {
      desktop.removeEventListener('change', update);
      reduced.removeEventListener('change', update);
    };
  }, []);

  // Подстраховка автоплея: элемент монтируется после гидрации, и в отдельных
  // окружениях атрибут autoPlay к этому моменту уже не срабатывает.
  useEffect(() => {
    if (mode !== 'video') return;
    videoRef.current?.play().catch(() => {
      /* автоплей запрещён — останется первый кадр (цельный камень) */
    });
  }, [mode]);

  if (mode === 'hidden') return null;

  if (mode === 'static') {
    return (
      <Image
        src="/logo-figma.svg"
        alt=""
        width={120}
        height={170}
        priority
        className="relative h-auto w-full drop-shadow-[0_0_70px_rgba(0,136,255,0.45)]"
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
      aria-hidden="true"
    >
      {/* Safari: HEVC с альфой; Chrome/Firefox не играют quicktime и идут дальше */}
      <source src="/logo-reveal.mov" type='video/quicktime; codecs="hvc1"' />
      {/* Chrome/Firefox/Edge: VP9 с альфой */}
      <source src="/logo-reveal.webm" type="video/webm" />
    </video>
  );
}
