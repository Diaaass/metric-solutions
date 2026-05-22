'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import { Calendar, Building2, Tag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProjectsPage() {
  const { lang } = useLanguage();
  const t = lang.projectsPage;

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

      <section className="section-padding bg-secondary-50">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {lang.projectsData.map((project, i) => (
              <Card
                key={project.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              >
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-secondary-500 mb-3">
                    <Tag className="h-4 w-4" />
                    <span>{project.category}</span>
                    <span>•</span>
                    <Calendar className="h-4 w-4" />
                    <span>{project.year}</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{project.title}</h2>
                  <div className="flex items-center gap-2 text-secondary-600 mb-4">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">{project.client}</span>
                  </div>
                </div>

                <p className="text-secondary-700 mb-6">{project.description}</p>

                <div className="border-t border-secondary-200 pt-6">
                  <h3 className="font-semibold mb-3">{t.resultsLabel}</h3>
                  <ul className="space-y-2">
                    {project.results.map((result, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-secondary-700">
                        <span className="text-primary-600 font-bold">✓</span>
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
