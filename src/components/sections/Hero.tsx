'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Hero() {
  const { lang } = useLanguage();

  return (
    <section className="bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary-900 text-white">
      <Container>
        <div className="py-24 md:py-36">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-fade-in-up">
              {lang.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-secondary-100 mb-10 animate-fade-in-up delay-200">
              {lang.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
              <Button href="/services" variant="primary" className="inline-flex items-center gap-2">
                {lang.hero.btnServices}
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button
                href="/contacts"
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-secondary-900"
              >
                {lang.hero.btnContact}
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
