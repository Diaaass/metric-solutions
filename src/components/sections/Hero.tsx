import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import Container from '@/components/ui/Container';
import TechBackdrop from '@/components/ui/TechBackdrop';
import HeroVisual from '@/components/sections/HeroVisual';
import type { Translation } from '@/i18n';

export default function Hero({ t, base }: { t: Translation['hero']; base: string }) {
  return (
    <section className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      {/* Технический фон из макета: подсвеченные ячейки сетки + тонкие дуги */}
      <TechBackdrop cells />
      {/* Анимация появления логотипа в правой части экрана (HeroVisual).
          Блок декоративный — в шапке уже есть логотип со ссылкой и подписью.

          Левая граница колонки — calc(50% + 260px): контейнер текста центрирован
          (max-w-7xl), самая длинная строка заголовка кончается около 50% + 252px
          независимо от ширины окна; 260px даёт зазор и запас на вариации рендера
          шрифта. Камень прижат к ЛЕВОМУ краю колонки (justify-start) — то есть
          всегда вплотную к тексту; на широких экранах колонка растёт, и он
          растёт вместе с ней до max-w, а не уезжает к правому краю окна. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-[calc(50%+260px)] right-4 hidden items-center justify-start sm:right-6 lg:right-8 xl:flex"
        aria-hidden="true"
      >
        <div className="relative w-full max-w-[780px]">
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500/10 blur-[140px]" />
          <HeroVisual />
        </div>
      </div>

      <Container>
        <div className="relative py-16 md:py-20 lg:py-24 max-w-3xl lg:max-w-4xl">
          <p className="eyebrow mb-8 animate-fade-in-up">{t.eyebrow}</p>

          <h1 className="mb-8 animate-fade-in-up delay-100 tracking-[-0.03em]">
            {t.title} <span className="text-grad">{t.titleAccent}</span>
          </h1>

          <p className="max-w-xl text-lg md:text-xl font-thin text-white leading-snug tracking-[-0.03em] mb-10 animate-fade-in-up delay-200">
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

          {/* Опорный факт: 2 собственных мобильных решения */}
          <div className="mt-14 flex flex-wrap gap-x-16 gap-y-8 animate-fade-in delay-400">
            <div className="flex items-start gap-4 max-w-[320px]">
              <CheckCircle2
                className="h-8 w-8 shrink-0 self-center text-accent-400 drop-shadow-icon"
                aria-hidden="true"
              />
              <span className="font-display text-7xl font-normal leading-none text-white">
                {t.stat1Value}
              </span>
              <span className="text-sm font-extralight text-white leading-snug pt-2">
                {t.stat1Label}
                <br />
                <span className="text-grad font-normal">{t.stat1LabelAccent}</span>
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
