'use client';

import React from 'react';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getServiceIcon } from '@/lib/serviceIcons';

// Приоритетные для продвижения направления (бриф §15)
const FEATURED_SLUGS = [
  'geometallurgy',
  'mineral-processing',
  'hydrometallurgy',
  'laboratory',
  'pilot-testing',
  'consulting',
];

export default function ServicesPreview() {
  const { lang } = useLanguage();
  const featured = FEATURED_SLUGS.map((slug) =>
    lang.servicesData.find((s) => s.slug === slug),
  ).filter((s): s is (typeof lang.servicesData)[number] => Boolean(s));

  return (
    <section className="section-padding bg-secondary-50 bg-grid">
      <Container>
        <div className="max-w-2xl mb-12 animate-fade-in">
          <p className="eyebrow mb-4">{lang.servicesPreview.eyebrow}</p>
          <h2 className="font-bold mb-4">{lang.servicesPreview.title}</h2>
          <p className="text-lg text-secondary-600">{lang.servicesPreview.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-secondary-200 border border-secondary-200 rounded-lg overflow-hidden">
          {featured.map((service, index) => {
            const Icon = getServiceIcon(service.icon);
            return (
              <Link
                key={service.id}
                href="/services"
                className="group relative bg-white p-7 transition-colors duration-200 hover:bg-white animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-md bg-primary-50 flex items-center justify-center text-primary-700 group-hover:bg-accent-500 group-hover:text-white transition-colors duration-200">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-xs text-secondary-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-primary-900">{service.title}</h3>
                <p className="text-sm text-secondary-600 leading-relaxed">{service.description}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 animate-fade-in">
          <Button href="/services" variant="outline">
            {lang.servicesPreview.allBtn}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Container>
    </section>
  );
}
