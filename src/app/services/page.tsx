'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getServiceIcon } from '@/lib/serviceIcons';

export default function ServicesPage() {
  const { lang } = useLanguage();
  const t = lang.servicesPage;

  return (
    <div className="bg-white">
      <section className="relative bg-secondary-50 border-b border-secondary-200">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <Container>
          <div className="relative py-16 md:py-24 max-w-3xl">
            <p className="eyebrow mb-5 animate-fade-in-up">{lang.nav.services}</p>
            <h1 className="mb-6 animate-fade-in-up delay-100">{t.heroTitle}</h1>
            <p className="text-lg md:text-xl text-secondary-600 leading-relaxed animate-fade-in-up delay-200">
              {t.heroSubtitle}
            </p>
          </div>
        </Container>
      </section>

      <section className="section-padding bg-secondary-50 bg-grid">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-secondary-200 border border-secondary-200 rounded-lg overflow-hidden mb-16">
            {lang.servicesData.map((service, i) => {
              const Icon = getServiceIcon(service.icon);
              return (
                <div
                  key={service.id}
                  id={service.slug}
                  className="group bg-white p-7 transition-colors duration-200 animate-fade-in-up scroll-mt-24"
                  style={{ animationDelay: `${(i + 1) * 60}ms` }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-md bg-primary-50 flex items-center justify-center text-primary-700 group-hover:bg-accent-500 group-hover:text-white transition-colors duration-200">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-xs text-secondary-400">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold mb-2 text-primary-900">{service.title}</h2>
                  <p className="text-sm text-secondary-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="bg-primary-900 text-white p-8 md:p-12 rounded-lg text-center animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t.notFoundTitle}</h2>
            <p className="text-lg text-secondary-300 mb-8 max-w-2xl mx-auto">{t.notFoundText}</p>
            <Button href="/contacts" variant="primary">
              {t.contactBtn}
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
