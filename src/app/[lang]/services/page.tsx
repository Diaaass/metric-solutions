import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Container from '@/components/ui/Container';
import { FlaskConical } from 'lucide-react';
import { translations } from '@/i18n';
import { buildMetadata, isLang } from '@/i18n/seo';

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  if (!isLang(params.lang)) return {};
  return buildMetadata(params.lang, 'services');
}

export default function ServicesPage({ params }: Props) {
  if (!isLang(params.lang)) notFound();
  const t = translations[params.lang].servicesPage;

  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      {/* Свечение по центру, как в макете */}
      <div
        className="pointer-events-none absolute left-1/2 top-[30%] h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-accent-500/10 blur-[160px]"
        aria-hidden="true"
      />

      <Container>
        <div className="relative pt-14 md:pt-20 pb-8">
          <p className="text-lg md:text-xl font-thin text-white tracking-[-0.03em] mb-4 animate-fade-in">
            {t.breadcrumb}
          </p>
          <h2 className="!text-3xl md:!text-[34px] mb-5 animate-fade-in-up">{t.title}</h2>
          <p className="max-w-xl text-lg md:text-xl font-thin text-white leading-snug tracking-[-0.03em] animate-fade-in-up delay-100">
            {t.subtitle}
          </p>
        </div>

        {/* 3 направления: иконка + заголовок + текст, в ряд на lg, стопкой на мобильном */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-x-10 lg:gap-x-16 gap-y-16 pb-24 pt-8">
          {t.items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center animate-fade-in-up"
              style={{ animationDelay: `${(i + 1) * 80}ms` }}
            >
              <FlaskConical
                className="h-14 w-14 text-accent-400 drop-shadow-icon mb-5"
                strokeWidth={1.4}
                aria-hidden="true"
              />
              <h3 className="!text-xl mb-3 tracking-tight">{item.title}</h3>
              <p className="max-w-md text-[15px] font-extralight text-white/95 leading-relaxed tracking-tight">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
