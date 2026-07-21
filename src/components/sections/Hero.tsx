import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import type { Translation } from '@/i18n';

export default function Hero({ t, base }: { t: Translation['hero']; base: string }) {
  return (
    <section className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      {/* Свечение за 3D-объектом */}
      <div
        className="pointer-events-none absolute right-[-8%] top-[-10%] h-[640px] w-[640px] rounded-full bg-accent-500/25 blur-[140px]"
        aria-hidden="true"
      />

      {/* 3D-кластер справа сверху (как в макете — наезжает на верх) */}
      <div
        className="pointer-events-none absolute right-[-4%] top-[-12%] hidden w-[46%] lg:block"
        aria-hidden="true"
      >
        <Image
          src="/hero-3d.png"
          alt=""
          width={1200}
          height={800}
          priority
          className="h-auto w-full object-contain"
        />
      </div>

      <Container>
        <div className="relative py-16 md:py-20 lg:py-24 max-w-3xl">
          <p className="eyebrow mb-8 animate-fade-in-up">{t.eyebrow}</p>

          <h1 className="mb-8 animate-fade-in-up delay-100">
            {t.title} <span className="text-grad">{t.titleAccent}</span>
          </h1>

          <p className="max-w-xl text-lg md:text-2xl font-extralight text-white leading-snug tracking-tight mb-10 animate-fade-in-up delay-200">
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

          {/* Опорные факты (как в макете: 2 / ЦА СНГ) */}
          <div className="mt-14 flex flex-wrap gap-x-16 gap-y-8 animate-fade-in delay-400">
            <div className="flex items-start gap-4 max-w-[300px]">
              <span className="font-display text-7xl font-bold leading-none text-white">
                {t.stat1Value}
              </span>
              <span className="text-sm font-extralight text-white leading-snug pt-2">
                {t.stat1Label}
                <br />
                <span className="text-grad font-normal">{t.stat1LabelAccent}</span>
              </span>
            </div>
            <div className="flex items-start gap-4 max-w-[300px]">
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
