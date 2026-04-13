import React from 'react';
import Container from '@/components/ui/Container';
import ConsultationForm from '@/components/forms/ConsultationForm';
import { Scale, CheckCircle2 } from 'lucide-react';

export default function MetalBalancePage() {
  const features = [
    'Составление материальных балансов по металлам',
    'Аудит технологических показателей',
    'Выявление потерь ценных компонентов',
    'Контроль качества аналитических данных',
    'Оптимизация схем опробования'
  ];

  const benefits = [
    'Повышение точности учета металлов',
    'Снижение потерь ценных компонентов',
    'Улучшение экономических показателей производства',
    'Контроль эффективности технологических процессов'
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary-900 to-primary-900 text-white py-20">
        <Container>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
              <Scale className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Баланс металлов</h1>
          </div>
          <p className="text-xl text-secondary-200 max-w-3xl">
            Точный учет и контроль распределения ценных компонентов на всех этапах 
            технологического процесса обогащения
          </p>
        </Container>
      </section>

      {/* Main Content */}
      <section className="section-padding">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="prose prose-lg max-w-none mb-12">
                <h2 className="text-3xl font-bold mb-6">Зачем нужен баланс металлов?</h2>
                <p className="text-secondary-700 leading-relaxed mb-6">
                  Материальный баланс по металлам — это основной инструмент контроля эффективности 
                  технологического процесса обогащения. Он позволяет отслеживать распределение ценных 
                  компонентов по всем продуктам технологической схемы и выявлять источники потерь.
                </p>
                <p className="text-secondary-700 leading-relaxed mb-6">
                  Правильно составленный баланс металлов обеспечивает контроль качества аналитических 
                  работ, помогает оптимизировать технологические режимы и повысить общее извлечение 
                  ценных компонентов.
                </p>
              </div>

              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-6">Что мы предлагаем</h3>
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 bg-secondary-50 p-4 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
                      <span className="text-secondary-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary-50 p-8 rounded-xl">
                <h3 className="text-2xl font-bold mb-6">Результаты для вашего предприятия</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-primary-600 font-bold text-xl">✓</span>
                      <span className="text-secondary-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ConsultationForm />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
