import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Container from '@/components/ui/Container';
import { translations } from '@/i18n';
import { buildMetadata, isLang } from '@/i18n/seo';

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  if (!isLang(params.lang)) return {};
  return buildMetadata(params.lang, 'privacy');
}

export default function PrivacyPage({ params }: Props) {
  if (!isLang(params.lang)) notFound();
  const t = translations[params.lang].privacyPage;

  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />

      <Container>
        <div className="relative pt-14 md:pt-20 pb-8">
          <p className="text-lg md:text-xl font-thin text-white tracking-[-0.03em] mb-4 animate-fade-in">
            {t.breadcrumb}
          </p>
          <h1 className="!text-3xl md:!text-5xl mb-3 animate-fade-in-up">{t.title}</h1>
          <p className="text-sm font-light text-white/60 mb-8 animate-fade-in-up delay-100">
            {t.updatedAt}
          </p>
          <p className="max-w-3xl text-base md:text-lg font-thin text-white leading-relaxed tracking-[-0.03em] animate-fade-in-up delay-100">
            {t.intro}
          </p>
        </div>

        <div className="relative max-w-3xl space-y-10 pb-24 pt-4">
          {t.sections.map((section) => (
            <section key={section.title} className="animate-fade-in-up">
              <h2 className="!text-xl md:!text-2xl mb-4 tracking-tight">{section.title}</h2>
              <div className="space-y-4">
                {section.paragraphs.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-[15px] md:text-base font-extralight text-white/95 leading-relaxed tracking-tight"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
