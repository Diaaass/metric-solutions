import React from 'react';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { services } from '@/data/services';
import { Microscope, Scale, TestTube, ArrowRight } from 'lucide-react';

const iconMap = {
  'Microscope': Microscope,
  'Scale': Scale,
  'TestTube': TestTube,
};

export default function ServicesPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary-900 to-primary-900 text-white py-20">
        <Container>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Наши услуги</h1>
          <p className="text-xl text-secondary-200 max-w-3xl">
            Полный спектр геометаллургических услуг для оптимизации процессов обогащения и переработки руд
          </p>
        </Container>
      </section>

      {/* Services Grid */}
      <section className="section-padding">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {services.map((service) => {
              const Icon = iconMap[service.icon as keyof typeof iconMap];
              return (
                <Card key={service.id} className="hover:scale-105 transition-transform duration-300">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="h-8 w-8 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">{service.title}</h2>
                    <p className="text-secondary-600 mb-6">{service.description}</p>
                  </div>
                  <Button href={`/services/${service.slug}`} variant="primary" className="w-full">
                    Подробнее
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="bg-primary-50 p-8 md:p-12 rounded-xl text-center">
            <h2 className="text-3xl font-bold mb-4">Не нашли нужную услугу?</h2>
            <p className="text-lg text-secondary-700 mb-8 max-w-2xl mx-auto">
              Мы предлагаем индивидуальные решения для каждого клиента. Свяжитесь с нами для обсуждения вашего проекта.
            </p>
            <Button href="/contacts" variant="primary">
              Связаться с нами
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
