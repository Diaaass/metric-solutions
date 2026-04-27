'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Stats() {
  const { lang } = useLanguage();

  return (
    <section className="section-padding bg-primary-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 dot-grid-bg-white pointer-events-none" />
      <Container className="relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {lang.stats.items.map((stat, index) => (
            <div key={index} className={`text-center animate-fade-in-up delay-${(index + 1) * 100}`}>
              <div className="text-4xl md:text-5xl font-bold mb-2 font-serif">{stat.value}</div>
              <div className="text-primary-100 text-sm md:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
