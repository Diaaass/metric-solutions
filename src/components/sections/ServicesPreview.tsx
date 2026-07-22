import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import TechBackdrop from '@/components/ui/TechBackdrop';
import type { Translation } from '@/i18n';

export default function ServicesPreview({
  t,
  banner,
  base,
}: {
  t: Translation['homeDirections'];
  banner: Translation['ctaBanner'];
  base: string;
}) {
  return (
    <section className="relative overflow-hidden bg-ink-950 section-padding">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      <TechBackdrop />
      <Container>
        <div className="relative">
          <p className="eyebrow mb-4 animate-fade-in">{t.eyebrow}</p>
          <h2 className="max-w-2xl mb-12 animate-fade-in">{t.title}</h2>

          {/* 6 карточек 2×3 (344×216 в макете) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12">
            {t.cards.map((card, i) => (
              <div
                key={i}
                className="card min-h-[200px] animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 70}ms` }}
              >
                <h3 className="font-card !text-base font-bold mb-5">{card.title}</h3>
                <p className="font-card text-[15px] font-medium text-white/95 leading-snug">
                  {card.text}
                </p>
              </div>
            ))}
          </div>

          {/* CTA-баннер с фото производства (rounded-30, рамка #01549e, свечение) */}
          <div className="relative mt-16 animate-fade-in">
            <div
              className="pointer-events-none absolute -inset-6 rounded-[30px] bg-blue-grad opacity-50 blur-[80px]"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-[30px] border-4 border-[#01549e]">
              <Image
                src="/cta-banner.webp"
                alt=""
                width={1400}
                height={576}
                sizes="(min-width: 1280px) 1216px, 100vw"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-ink-950/30" aria-hidden="true" />
              <div className="relative flex flex-col md:flex-row md:items-center gap-6 px-8 md:px-14 py-8 md:py-7">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="!text-xl md:!text-2xl font-medium tracking-wide mb-1.5">
                    {banner.title}
                  </h3>
                  <p className="text-sm md:text-base font-extralight text-white tracking-wide leading-snug">
                    {banner.subtitle}
                  </p>
                </div>
                <Link
                  href={`${base}/contacts`}
                  className="inline-flex items-center justify-center rounded-[30px] bg-blue-grad px-8 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 flex-shrink-0"
                >
                  {banner.btn}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
