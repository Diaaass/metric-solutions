import React from 'react';
import Container from '@/components/ui/Container';
import ConsultationForm from '@/components/forms/ConsultationForm';
import { services } from '@/data/services';
import { TestTube, CheckCircle2 } from 'lucide-react';

const service = services.find(s => s.slug === 'ore-research')!;

export default function OreResearchPage() {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-secondary-900 to-primary-700 text-white py-20">
        <Container>
          <div className="flex items-center gap-4 mb-6 animate-fade-in-up">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
              <TestTube className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">{service.title}</h1>
          </div>
          <p className="text-xl text-secondary-200 max-w-3xl animate-fade-in-up delay-200">
            {service.description}
          </p>
        </Container>
      </section>

      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 dot-grid-bg pointer-events-none" />
        <Container className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="prose prose-lg max-w-none mb-12 animate-fade-in">
                <h2 className="text-3xl font-bold mb-6">Почему важно исследовать руду?</h2>
                <p className="text-secondary-700 leading-relaxed mb-6">
                  Детальное изучение рудного сырья — это основа для разработки эффективной технологии
                  переработки. Знание минералогического состава, форм нахождения ценных компонентов и
                  технологических свойств руды позволяет выбрать оптимальные методы обогащения и
                  параметры процесса.
                </p>
                <p className="text-secondary-700 leading-relaxed mb-6">
                  Наши исследования включают комплекс современных аналитических методов и
                  технологических испытаний, которые дают полную картину поведения руды в процессе
                  обогащения.
                </p>
              </div>

              <div className="mb-12 animate-fade-in delay-100">
                <h3 className="text-2xl font-bold mb-6">Виды исследований</h3>
                <div className="space-y-3">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 bg-secondary-50 p-4 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
                      <span className="text-secondary-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary-50 p-8 rounded-xl animate-fade-in delay-200">
                <h3 className="text-2xl font-bold mb-6">Что вы получите</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-primary-600 font-bold text-xl">✓</span>
                      <span className="text-secondary-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 animate-fade-in-up delay-200">
                <ConsultationForm />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
