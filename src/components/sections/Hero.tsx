'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Hero() {
  const { lang } = useLanguage();

  return (
    <section className="relative bg-white border-b border-secondary-200">
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
      <Container>
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center py-16 md:py-24">
          {/* Текст */}
          <div className="lg:col-span-7">
            <p className="eyebrow mb-6 animate-fade-in-up">{lang.hero.eyebrow}</p>
            <h1 className="mb-6 animate-fade-in-up delay-100">{lang.hero.title}</h1>
            <p className="text-lg text-secondary-600 mb-9 max-w-xl leading-relaxed animate-fade-in-up delay-200">
              {lang.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up delay-300">
              <Button href="/services" variant="primary">
                {lang.hero.btnServices}
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button href="/contacts" variant="outline">
                {lang.hero.btnContact}
              </Button>
            </div>
          </div>

          {/* Navy-панель с ключевыми фактами */}
          <div className="lg:col-span-5 animate-fade-in delay-200">
            <div className="relative overflow-hidden rounded-2xl bg-primary-900 text-white p-8 shadow-elevated">
              <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
              <div className="relative">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-300 mb-6">
                  Metric Solutions
                </p>
                <div className="space-y-6">
                  <div className="flex items-baseline gap-4 border-b border-white/10 pb-5">
                    <span className="font-mono text-4xl font-semibold text-white tabular-nums">
                      {lang.hero.stat1Value}
                    </span>
                    <span className="text-sm text-secondary-300 leading-snug">
                      {lang.hero.stat1Label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-4xl font-semibold text-white tabular-nums">
                      {lang.hero.stat2Value}
                    </span>
                    <span className="text-sm text-secondary-300 leading-snug">
                      {lang.hero.stat2Label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
