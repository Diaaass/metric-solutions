'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import ConsultationForm from '@/components/forms/ConsultationForm';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CTA() {
  const { lang } = useLanguage();

  return (
    <section className="section-padding bg-white">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="animate-fade-in-up">
            <p className="eyebrow mb-4">{lang.cta.eyebrow}</p>
            <h2 className="font-bold mb-6">{lang.cta.title}</h2>
            <p className="text-lg text-secondary-600 mb-8">{lang.cta.subtitle}</p>
            <ul className="space-y-4">
              {lang.cta.points.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 animate-fade-in"
                  style={{ animationDelay: `${(i + 1) * 100}ms` }}
                >
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <span className="text-secondary-700">{item}</span>
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
