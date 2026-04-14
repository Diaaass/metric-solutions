import React from 'react';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import { projects } from '@/data/projects';
import { Calendar, Building2, Tag } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-secondary-900 to-primary-700 text-white py-20">
        <Container>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">Наши проекты</h1>
          <p className="text-xl text-secondary-200 max-w-3xl animate-fade-in-up delay-200">
            Успешно реализованные проекты для ведущих горно-обогатительных предприятий
          </p>
        </Container>
      </section>

      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 dot-grid-bg pointer-events-none" />
        <Container className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, i) => (
              <Card key={project.id} className={`animate-fade-in-up delay-${(i + 1) * 100}`}>
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
                  <h3 className="font-semibold mb-3">Результаты:</h3>
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

          <div className="mt-16 bg-primary-50 p-8 md:p-12 rounded-xl text-center animate-fade-in delay-300">
            <h2 className="text-3xl font-bold mb-4">Хотите такие же результаты?</h2>
            <p className="text-lg text-secondary-700 mb-8 max-w-2xl mx-auto">
              Обсудим ваш проект и найдем оптимальное решение для повышения эффективности производства
            </p>
            <Link href="/contacts" className="btn-primary inline-block">
              Связаться с нами
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
