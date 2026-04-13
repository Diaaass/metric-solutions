import React from 'react';
import Container from '@/components/ui/Container';
import ConsultationForm from '@/components/forms/ConsultationForm';

export default function CTA() {
  return (
    <section className="section-padding bg-white">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Готовы повысить эффективность вашего производства?
            </h2>
            <p className="text-lg text-secondary-600 mb-6">
              Наши эксперты помогут оптимизировать технологические процессы, снизить потери ценных компонентов и повысить рентабельность производства.
            </p>
            <ul className="space-y-3 text-secondary-700">
              <li className="flex items-start gap-3">
                <span className="text-primary-600 font-bold text-xl">✓</span>
                <span>Индивидуальный подход к каждому проекту</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-600 font-bold text-xl">✓</span>
                <span>Команда опытных специалистов</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-600 font-bold text-xl">✓</span>
                <span>Современные методы исследований</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-600 font-bold text-xl">✓</span>
                <span>Гарантия качества результатов</span>
              </li>
            </ul>
          </div>
          <div>
            <ConsultationForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
