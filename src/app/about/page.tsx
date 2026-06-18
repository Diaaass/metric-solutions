'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
  const { lang } = useLanguage();
  const t = lang.about;
  const a = lang.audience;

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-secondary-50 border-b border-secondary-200">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <Container>
          <div className="relative py-16 md:py-24 max-w-3xl">
            <p className="eyebrow mb-5 animate-fade-in-up">{lang.nav.about}</p>
            <h1 className="mb-6 animate-fade-in-up delay-100">{t.heroTitle}</h1>
            <p className="text-lg md:text-xl text-secondary-600 leading-relaxed animate-fade-in-up delay-200">
              {t.heroSubtitle}
            </p>
          </div>
        </Container>
      </section>

      {/* Intro + Mission */}
      <section className="section-padding bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6 animate-fade-in">
              <p className="text-lg text-secondary-700 leading-relaxed">{t.intro1}</p>
              <p className="text-lg text-secondary-700 leading-relaxed">{t.intro2}</p>
            </div>
            <div className="animate-fade-in-up delay-100">
              <div className="border-l-2 border-accent-500 bg-secondary-50 p-6 rounded-r-lg h-full">
                <h2 className="text-xl font-bold mb-3 text-primary-900">{t.missionTitle}</h2>
                <p className="text-secondary-700 leading-relaxed">{t.missionText}</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-12 md:py-16 bg-secondary-50 border-y border-secondary-200">
        <Container>
          <p className="eyebrow mb-6">{t.valuesTitle}</p>
          <div className="flex flex-wrap gap-3">
            {t.values.map((value, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 rounded-full border border-secondary-200 bg-white px-5 py-2.5 text-sm font-medium text-secondary-800 animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent-600" />
                {value}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* Advantages */}
      <section className="section-padding bg-secondary-50 bg-grid">
        <Container>
          <h2 className="font-bold mb-10 max-w-2xl">{t.cardsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-secondary-200 border border-secondary-200 rounded-lg overflow-hidden mb-16">
            {t.cards.map(({ title, text }, i) => (
              <div
                key={i}
                className="bg-white p-7 animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
              >
                <span className="font-mono text-xs text-accent-600">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-xl font-bold mt-2 mb-3 text-primary-900">{title}</h3>
                <p className="text-secondary-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-secondary-200 p-8 md:p-10 rounded-lg animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-primary-900">{t.whyTitle}</h2>
            <ul className="space-y-4">
              {t.reasons.map(({ title, text }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <div>
                    <strong className="text-primary-900">{title}</strong>
                    <span className="text-secondary-700"> {text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Целевая аудитория + география */}
      <section className="section-padding bg-white border-t border-secondary-200">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <p className="eyebrow mb-4">{a.eyebrow}</p>
              <h2 className="font-bold mb-4">{a.title}</h2>
              <p className="text-lg text-secondary-600 mb-8 max-w-xl">{a.subtitle}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-secondary-200 border border-secondary-200 rounded-lg overflow-hidden">
                {a.clients.map((client, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-white px-5 py-4 animate-fade-in-up"
                    style={{ animationDelay: `${(i + 1) * 60}ms` }}
                  >
                    <span className="font-mono text-xs text-accent-600 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-secondary-800 font-medium">{client}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-6 h-full">
                <h3 className="text-base font-bold text-primary-900 mb-4">{a.geoTitle}</h3>
                <div className="flex flex-wrap gap-2">
                  {a.geo.map((place, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full border border-secondary-200 bg-white px-3.5 py-1.5 text-sm text-secondary-700"
                    >
                      {place}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
