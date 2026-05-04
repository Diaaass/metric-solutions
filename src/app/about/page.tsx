'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import { Target, Users, Award, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const cardIcons = [Target, TrendingUp, Users, Award];

export default function AboutPage() {
  const { lang } = useLanguage();
  const t = lang.about;

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-secondary-900 to-primary-700 text-white py-20">
        <Container>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">{t.heroTitle}</h1>
          <p className="text-xl text-secondary-200 max-w-3xl animate-fade-in-up delay-200">
            {t.heroSubtitle}
          </p>
        </Container>
      </section>

      <section className="section-padding bg-secondary-50 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid-bg pointer-events-none" />
        <Container className="relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none mb-12 animate-fade-in">
              <p className="text-lg text-secondary-700 leading-relaxed mb-6">{t.intro1}</p>
              <p className="text-lg text-secondary-700 leading-relaxed mb-6">{t.intro2}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {t.cards.map(({ title, text }, i) => {
                const Icon = cardIcons[i];
                return (
                  <div key={i} className={`bg-secondary-50 p-6 rounded-xl animate-fade-in-up delay-${(i + 1) * 100}`}>
                    <Icon className="h-10 w-10 text-primary-600 mb-4" />
                    <h3 className="text-xl font-bold mb-3">{title}</h3>
                    <p className="text-secondary-700">{text}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-primary-50 p-8 rounded-xl animate-fade-in delay-200">
              <h2 className="text-2xl font-bold mb-6">{t.whyTitle}</h2>
              <ul className="space-y-4">
                {t.reasons.map(({ title, text }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-primary-600 font-bold text-xl mt-1">✓</span>
                    <div>
                      <strong className="text-secondary-900">{title}</strong>
                      <span className="text-secondary-700"> {text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
