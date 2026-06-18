'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Stats() {
  const { lang } = useLanguage();

  return (
    <section className="bg-white">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-secondary-200 border-y border-secondary-200">
          {lang.stats.items.map((stat, index) => (
            <div
              key={index}
              className="bg-white py-10 px-4 sm:px-8 animate-fade-in-up"
              style={{ animationDelay: `${(index + 1) * 80}ms` }}
            >
              <div className="font-mono text-4xl md:text-5xl font-semibold text-primary-900 mb-2 tabular-nums">
                {stat.value}
              </div>
              <div className="text-sm text-secondary-600 leading-snug">{stat.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
