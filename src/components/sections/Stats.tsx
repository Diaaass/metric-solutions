'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Stats() {
  const { lang } = useLanguage();

  return (
    <section className="section-padding bg-primary-700 text-white">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {lang.stats.items.map((stat, index) => (
            <div
              key={index}
              className="text-center animate-fade-in-up"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="text-4xl md:text-5xl font-bold mb-2 font-serif">{stat.value}</div>
              <div className="text-primary-100 text-sm md:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
