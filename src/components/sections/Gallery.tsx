'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Container from '@/components/ui/Container';
import type { Translation } from '@/i18n';

/**
 * Карусель галереи на главной. Файлы названы предсказуемо (gallery-N.jpg) —
 * временные фото заменяются на реальные снимки заказчика без правки кода.
 * Формат jpg: webp-кодировщика в пайплайне нет, а next/image на Vercel всё
 * равно отдаёт браузеру webp/avif через оптимизатор.
 */
const IMAGES = [
  '/gallery-1.jpg',
  '/gallery-2.jpg',
  '/gallery-3.jpg',
  '/gallery-4.jpg',
  '/gallery-5.jpg',
  '/gallery-6.jpg',
];

export default function Gallery({ t }: { t: Translation['gallery'] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Прокрутка ровно на «страницу» — ширину видимой области (2 слайда от sm,
  // 1 на мобильном). scroll-snap сам довыравнивает по границе слайда.
  const scrollByPage = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-ink-950 section-padding">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />

      <Container>
        <div className="relative">
          <div className="flex items-end justify-between gap-6 mb-10">
            <h2 className="max-w-2xl animate-fade-in">{t.title}</h2>

            {/* Кнопки листания; на мобильном остаётся свайп со snap */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => scrollByPage(-1)}
                aria-label={t.prevLabel}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-white/80 transition-colors hover:border-accent-500/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollByPage(1)}
                aria-label={t.nextLabel}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-white/80 transition-colors hover:border-accent-500/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            ref={trackRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {IMAGES.map((src, i) => (
              <div
                key={src}
                className="relative shrink-0 snap-start basis-full sm:basis-[calc(50%-12px)] overflow-hidden rounded-2xl border border-white/10 animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 60}ms` }}
              >
                <Image
                  src={src}
                  alt={t.alts[i] ?? ''}
                  width={1400}
                  height={933}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="h-[300px] w-full object-cover sm:h-[380px] lg:h-[460px]"
                />
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-3xl text-[15px] md:text-base font-extralight text-white/95 leading-relaxed tracking-tight animate-fade-in">
            {t.text}
          </p>
        </div>
      </Container>
    </section>
  );
}
