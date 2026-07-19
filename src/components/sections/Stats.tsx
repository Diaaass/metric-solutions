'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Stats() {
  const { lang } = useLanguage();
  const t = lang.results;

  return (
    <section className="relative overflow-hidden bg-ink-950 section-padding">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      <Container>
        <div className="relative">
          <p className="eyebrow mb-4 animate-fade-in">{t.eyebrow}</p>
          <h2 className="max-w-2xl mb-12 animate-fade-in">{t.title}</h2>

          {/* Единый glow-контейнер с 4 показателями (1139×237 в макете) */}
          <div className="card !p-0 animate-fade-in-up delay-100">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 px-6 py-12 md:px-12">
              {t.items.map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center px-2">
                  <div className="font-display text-6xl md:text-7xl font-bold text-grad leading-none mb-5">
                    {stat.value}
                  </div>
                  <div className="font-card text-sm md:text-base font-medium text-white leading-snug max-w-[210px]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
