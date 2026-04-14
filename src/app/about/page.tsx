import React from 'react';
import Container from '@/components/ui/Container';
import { Target, Users, Award, TrendingUp } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-secondary-900 to-primary-700 text-white py-20">
        <Container>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">О компании</h1>
          <p className="text-xl text-secondary-200 max-w-3xl animate-fade-in-up delay-200">
            Metric Solution — ведущая консалтинговая компания в области геометаллургии и обогащения полезных ископаемых
          </p>
        </Container>
      </section>

      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 dot-grid-bg pointer-events-none" />
        <Container className="relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none mb-12 animate-fade-in">
              <p className="text-lg text-secondary-700 leading-relaxed mb-6">
                Мы специализируемся на предоставлении комплексных решений для горно-обогатительных предприятий,
                исследовательских институтов и горно-металлургических комбинатов. Наша команда объединяет ведущих
                специалистов в области геологии, обогащения и металлургии.
              </p>
              <p className="text-lg text-secondary-700 leading-relaxed mb-6">
                За годы работы мы реализовали десятки проектов, помогая нашим клиентам оптимизировать
                технологические процессы, повысить извлечение ценных компонентов и снизить производственные затраты.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {[
                { Icon: Target, title: 'Наша миссия', text: 'Повышение эффективности горно-обогатительных предприятий через внедрение передовых геометаллургических подходов и технологий.' },
                { Icon: TrendingUp, title: 'Наше видение', text: 'Стать признанным лидером в области геометаллургического консалтинга в СНГ и международном рынке.' },
                { Icon: Users, title: 'Наша команда', text: 'Команда высококвалифицированных специалистов с многолетним опытом работы на ведущих горно-обогатительных предприятиях.' },
                { Icon: Award, title: 'Качество', text: 'Строгий контроль качества на всех этапах выполнения работ. Применение современных методов исследований и анализа.' },
              ].map(({ Icon, title, text }, i) => (
                <div key={i} className={`bg-secondary-50 p-6 rounded-xl animate-fade-in-up delay-${(i + 1) * 100}`}>
                  <Icon className="h-10 w-10 text-primary-600 mb-4" />
                  <h3 className="text-xl font-bold mb-3">{title}</h3>
                  <p className="text-secondary-700">{text}</p>
                </div>
              ))}
            </div>

            <div className="bg-primary-50 p-8 rounded-xl animate-fade-in delay-200">
              <h2 className="text-2xl font-bold mb-6">Почему выбирают нас</h2>
              <ul className="space-y-4">
                {[
                  { title: 'Комплексный подход:', text: 'Учитываем геологические, минералогические и металлургические факторы' },
                  { title: 'Практический опыт:', text: 'Специалисты с опытом работы на производстве' },
                  { title: 'Современное оборудование:', text: 'Партнерство с ведущими лабораториями' },
                  { title: 'Гарантия результата:', text: 'Подтвержденная эффективность наших рекомендаций' },
                ].map(({ title, text }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-primary-600 font-bold text-xl mt-1">✓</span>
                    <div>
                      <strong className="text-secondary-900">{title}</strong>
                      <span className="text-secondary-700"> {text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
