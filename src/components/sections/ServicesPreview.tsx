'use client';

import React from 'react';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import { Microscope, Scale, TestTube, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const iconMap = {
  Microscope,
  Scale,
  TestTube,
};

export default function ServicesPreview() {
  const { lang } = useLanguage();

  return (
    <section className="section-padding bg-secondary-50">
      <Container>
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{lang.servicesPreview.title}</h2>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            {lang.servicesPreview.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {lang.servicesData.map((service, index) => {
            const Icon = iconMap[service.icon as keyof typeof iconMap];
            return (
              <Card
                key={service.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <div className="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-7 w-7 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-secondary-600 mb-6 flex-grow">{service.description}</p>
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-primary-600 font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    {lang.servicesPreview.learnMore}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
