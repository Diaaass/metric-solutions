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
  t: Translation['homeServices'];
  banner: Translation['ctaBanner'];
  base: string;
}) {
  return (
    <section className="relative overflow-hidden bg-ink-950 section-padding">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      <TechBackdrop />
      <Container>
        <div className="relative">
          {/* Краткий блок услуг: изображение слева, текст и ссылка справа */}
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-14">
            <div className="overflow-hidden rounded-[30px] border border-[rgba(26,92,255,0.5)] shadow-card-glow animate-fade-in">
              <Image
                src="/service-teaser.webp"
                alt=""
                width={1600}
                height={900}
                sizes="(min-width: 1024px) 592px, 100vw"
                className="h-auto w-full"
              />
            </div>

            <div className="animate-fade-in-up delay-100">
              <p className="eyebrow mb-4">{t.eyebrow}</p>
              <h2 className="mb-5">{t.title}</h2>
              <p className="max-w-xl text-[15px] md:text-base font-extralight text-white/95 leading-relaxed tracking-tight">
                {t.text}
              </p>
              <Link href={`${base}/services`} className="btn-secondary mt-8">
                {t.btn}
              </Link>
            </div>
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
                {/* py-3, а не py-2.5: при 14px тексте это даёт ровно 44px высоты —
                    минимальный тап-таргет. С py-2.5 кнопка была 40px. */}
                <Link
                  href={`${base}/contacts`}
                  className="inline-flex items-center justify-center rounded-[30px] bg-blue-grad px-8 py-3 text-sm font-medium text-white transition-all hover:brightness-110 flex-shrink-0"
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
