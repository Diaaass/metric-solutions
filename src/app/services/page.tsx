'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Microscope, Scale, TestTube } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const iconMap = {
  Microscope,
  Scale,
  TestTube,
};

export default function ServicesPage() {
  const { lang } = useLanguage();
  const t = lang.servicesPage;

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

      <section className="section-padding">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {lang.servicesData.map((service, i) => {
              const Icon = iconMap[service.icon as keyof typeof iconMap];
              return (
                <Card key={service.id} className={`animate-fade-in-up delay-${(i + 1) * 100}`}>
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="h-8 w-8 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">{service.title}</h2>
                    <p className="text-secondary-600 mb-6">{service.description}</p>
                  </div>
                  <Button href={`/services/${service.slug}`} variant="primary" className="w-full">
                    {t.detailsBtn}
                  </Button>
                </Card>
              );
            })}
          </div>

          <div className="bg-primary-50 p-8 md:p-12 rounded-xl text-center animate-fade-in delay-300">
            <h2 className="text-3xl font-bold mb-4">{t.notFoundTitle}</h2>
            <p className="text-lg text-secondary-700 mb-8 max-w-2xl mx-auto">
              {t.notFoundText}
            </p>
            <Button href="/contacts" variant="primary">
              {t.contactBtn}
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
