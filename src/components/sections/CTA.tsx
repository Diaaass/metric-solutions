'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import ConsultationForm from '@/components/forms/ConsultationForm';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CTA() {
  const { lang } = useLanguage();

  return (
    <section className="section-padding bg-white relative overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {lang.cta.title}
            </h2>
            <p className="text-lg text-secondary-600 mb-6">
              {lang.cta.subtitle}
            </p>
            <ul className="space-y-3 text-secondary-700">
              {lang.cta.points.map((item, i) => (
                <li key={i} className={`flex items-start gap-3 animate-fade-in delay-${(i + 1) * 100}`}>
                  <span className="text-primary-600 font-bold text-xl">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-fade-in-up delay-200">
            <ConsultationForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
