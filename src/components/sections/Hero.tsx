import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import Container from '@/components/ui/Container';
import TechBackdrop from '@/components/ui/TechBackdrop';
import type { Translation } from '@/i18n';

export default function Hero({ t, base }: { t: Translation['hero']; base: string }) {
  return (
    <section className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      {/* Технический фон из макета: подсвеченные ячейки сетки + тонкие дуги */}
      <TechBackdrop cells />
      {/* Логотип компании в правой части экрана (временно вместо 3D-объекта).
          Блок декоративный — в шапке уже есть логотип со ссылкой и подписью. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-7xl -translate-x-1/2 items-center justify-end px-4 sm:px-6 lg:px-8 xl:flex"
        aria-hidden="true"
      >
        <div className="relative">
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500/10 blur-[140px]" />
          <Image
            src="/logo-figma.svg"
            alt=""
            width={120}
            height={170}
            priority
            className="relative h-auto w-[240px] drop-shadow-[0_0_70px_rgba(0,136,255,0.45)] 2xl:w-[280px]"
          />
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
              <span className="font-display text-7xl font-bold leading-none text-white">
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
