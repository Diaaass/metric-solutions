import React from 'react';
import Container from '@/components/ui/Container';
import { Target, Users, Award, TrendingUp } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-secondary-900 to-primary-900 text-white py-20">
        <Container>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">О компании</h1>
          <p className="text-xl text-secondary-200 max-w-3xl">
            Metric Solution — ведущая консалтинговая компания в области геометаллургии и обогащения полезных ископаемых
          </p>
        </Container>
      </section>

      <section className="section-padding">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none mb-12">
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
              <div className="bg-secondary-50 p-6 rounded-xl">
                <Target className="h-10 w-10 text-primary-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">Наша миссия</h3>
                <p className="text-secondary-700">
                  Повышение эффективности горно-обогатительных предприятий через внедрение передовых 
                  геометаллургических подходов и технологий.
                </p>
              </div>

              <div className="bg-secondary-50 p-6 rounded-xl">
                <TrendingUp className="h-10 w-10 text-primary-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">Наше видение</h3>
                <p className="text-secondary-700">
                  Стать признанным лидером в области геометаллургического консалтинга в СНГ и международном рынке.
                </p>
              </div>

              <div className="bg-secondary-50 p-6 rounded-xl">
                <Users className="h-10 w-10 text-primary-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">Наша команда</h3>
                <p className="text-secondary-700">
                  Команда высококвалифицированных специалистов с многолетним опытом работы на ведущих 
                  горно-обогатительных предприятиях.
                </p>
              </div>

              <div className="bg-secondary-50 p-6 rounded-xl">
                <Award className="h-10 w-10 text-primary-600 mb-4" />
                <h3 className="text-xl font-bold mb-3">Качество</h3>
                <p className="text-secondary-700">
                  Строгий контроль качества на всех этапах выполнения работ. Применение современных 
                  методов исследований и анализа.
                </p>
              </div>
            </div>

            <div className="bg-primary-50 p-8 rounded-xl">
              <h2 className="text-2xl font-bold mb-6">Почему выбирают нас</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold text-xl mt-1">✓</span>
                  <div>
                    <strong className="text-secondary-900">Комплексный подход:</strong>
                    <span className="text-secondary-700"> Учитываем геологические, минералогические и металлургические факторы</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold text-xl mt-1">✓</span>
                  <div>
                    <strong className="text-secondary-900">Практический опыт:</strong>
                    <span className="text-secondary-700"> Специалисты с опытом работы на производстве</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold text-xl mt-1">✓</span>
                  <div>
                    <strong className="text-secondary-900">Современное оборудование:</strong>
                    <span className="text-secondary-700"> Партнерство с ведущими лабораториями</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold text-xl mt-1">✓</span>
                  <div>
                    <strong className="text-secondary-900">Гарантия результата:</strong>
                    <span className="text-secondary-700"> Подтвержденная эффективность наших рекомендаций</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
