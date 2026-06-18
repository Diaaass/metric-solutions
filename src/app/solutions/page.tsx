'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { Container as ContainerIcon, Cog, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const solutionIcons: Record<string, LucideIcon> = {
  nomadlab: ContainerIcon,
  'nomad-pilot-plant': Cog,
};

export default function SolutionsPage() {
  const { lang } = useLanguage();
  const t = lang.solutionsPage;

  return (
    <div className="bg-white">
      <section className="relative bg-secondary-50 border-b border-secondary-200">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <Container>
          <div className="relative py-16 md:py-24 max-w-3xl">
            <p className="eyebrow mb-5 animate-fade-in-up">{t.heroEyebrow}</p>
            <h1 className="mb-6 animate-fade-in-up delay-100">{t.heroTitle}</h1>
            <p className="text-lg md:text-xl text-secondary-600 leading-relaxed animate-fade-in-up delay-200">
              {t.heroSubtitle}
            </p>
          </div>
        </Container>
      </section>

      <section className="section-padding bg-secondary-50 bg-grid">
        <Container>
          <p className="text-lg text-secondary-700 max-w-3xl mb-12 animate-fade-in">{t.intro}</p>

          <div className="space-y-8">
            {t.items.map((item, i) => {
              const Icon = solutionIcons[item.slug] ?? Cog;
              return (
                <article
                  key={item.slug}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white border border-secondary-200 rounded-lg p-8 md:p-10 animate-fade-in-up"
                  style={{ animationDelay: `${(i + 1) * 100}ms` }}
                >
                  <div className="lg:col-span-1">
                    <div className="w-16 h-16 rounded-lg bg-primary-900 text-accent-400 flex items-center justify-center mb-5">
                      <Icon className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary-900 mb-1">{item.name}</h2>
                    <p className="font-mono text-sm text-accent-600">{item.tagline}</p>
                  </div>
                  <div className="lg:col-span-2">
                    <p className="text-secondary-700 leading-relaxed mb-6">{item.description}</p>
                    <ul className="space-y-3">
                      {item.points.map((point, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800">
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </span>
                          <span className="text-secondary-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-16 bg-primary-900 text-white p-8 md:p-12 rounded-lg text-center animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t.ctaTitle}</h2>
            <p className="text-lg text-secondary-300 mb-8 max-w-2xl mx-auto">{t.ctaText}</p>
            <Button href="/contacts" variant="primary">
              {t.contactBtn}
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
