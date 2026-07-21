import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Globe } from 'lucide-react';
import Container from '@/components/ui/Container';
import HeroCubes from '@/components/hero/HeroCubes';
import type { Translation } from '@/i18n';

// Декоративные каркасные кубики из макета (80x80, координаты на холсте 1440x1061).
// Позиционируются в % от hero-области, очень приглушённые, только на lg+.
const DECO_CUBES: { left: number; top: number; size: number }[] = [
  { left: 81.7, top: 24, size: 80 },
  { left: 36.7, top: 16, size: 80 },
  { left: 31.1, top: 24, size: 80 },
  { left: 14.4, top: 70, size: 80 },
  { left: 25.6, top: 77, size: 80 },
  { left: 59.2, top: 77, size: 80 },
];

function DecoCube({ left, top, size }: { left: number; top: number; size: number }) {
  return (
    <svg
      className="absolute text-accent-400/[0.10]"
      style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden="true"
    >
      <path d="M50 8 L85 28 L85 68 L50 88 L15 68 L15 28 Z" />
      <path d="M50 48 L50 8 M50 48 L15 68 M50 48 L85 68" />
    </svg>
  );
}

export default function Hero({ t, base }: { t: Translation['hero']; base: string }) {
  return (
    <section className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      {/* Декоративные каркасные кубики (как в макете) */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
        {DECO_CUBES.map((c, i) => (
          <DecoCube key={i} {...c} />
        ))}
      </div>
      {/* Свечение за 3D-объектом */}
      <div
        className="pointer-events-none absolute right-[-8%] top-[-10%] h-[640px] w-[640px] rounded-full bg-accent-500/25 blur-[140px]"
        aria-hidden="true"
      />

      {/* 3D-кластер справа сверху (как в макете — наезжает на верх).
          Внутри: статичный постер (LCP) + ленивая three-сцена с кроссфейдом. */}
      <div
        className="pointer-events-none absolute right-[-2%] top-[-6%] hidden w-[52%] lg:block"
        aria-hidden="true"
      >
        <HeroCubes />
      </div>

      <Container>
        <div className="relative py-16 md:py-20 lg:py-24 max-w-3xl lg:max-w-4xl">
          <p className="eyebrow mb-8 animate-fade-in-up">{t.eyebrow}</p>

          <h1 className="mb-8 animate-fade-in-up delay-100 tracking-[-0.03em]">
            {t.title} <span className="text-grad">{t.titleAccent}</span>
          </h1>

          <p className="max-w-xl text-lg md:text-xl font-extralight text-white leading-snug tracking-tight mb-10 animate-fade-in-up delay-200">
            {t.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 animate-fade-in-up delay-300">
            <Link href={`${base}/contacts`} className="btn-primary min-w-[280px]">
              {t.btnContact}
            </Link>
            <p className="text-[13px] font-extralight text-white/90 leading-snug max-w-[260px]">
              {t.tagline}
            </p>
          </div>

          {/* Опорные факты (как в макете: иконка + 2 / ЦА СНГ) */}
          <div className="mt-14 flex flex-wrap gap-x-16 gap-y-8 animate-fade-in delay-400">
            <div className="flex items-start gap-4 max-w-[320px]">
              <CheckCircle2
                className="h-8 w-8 shrink-0 self-center text-accent-400 drop-shadow-icon"
                aria-hidden="true"
              />
              <span className="font-display text-7xl font-bold leading-none text-white">
                {t.stat1Value}
              </span>
              <span className="text-sm font-extralight text-white leading-snug pt-2">
                {t.stat1Label}
                <br />
                <span className="text-grad font-normal">{t.stat1LabelAccent}</span>
              </span>
            </div>
            <div className="flex items-start gap-4 max-w-[320px]">
              <Globe
                className="h-8 w-8 shrink-0 self-center text-accent-400 drop-shadow-icon"
                aria-hidden="true"
              />
              <span className="font-display text-3xl font-bold uppercase leading-[1.05] text-white pt-1 whitespace-pre-line">
                {t.stat2Value.replace(' ', '\n')}
              </span>
              <span className="text-sm font-extralight text-white leading-snug pt-2">
                {t.stat2Label}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
