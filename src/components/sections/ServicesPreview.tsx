import React from 'react';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import { Microscope, Scale, TestTube, ArrowRight } from 'lucide-react';

const iconMap = {
  'Microscope': Microscope,
  'Scale': Scale,
  'TestTube': TestTube,
};

export default function ServicesPreview() {
  const services = [
    {
      icon: 'Microscope',
      title: 'Геометаллургия',
      description: 'Комплексное изучение геологических и металлургических характеристик для оптимизации процессов обогащения',
      href: '/services/geometallurgy'
    },
    {
      icon: 'Scale',
      title: 'Баланс металлов',
      description: 'Точный учет и контроль распределения ценных компонентов на всех этапах технологического процесса',
      href: '/services/metal-balance'
    },
    {
      icon: 'TestTube',
      title: 'Исследование руды',
      description: 'Детальное изучение вещественного состава, минералогии и технологических свойств рудного сырья',
      href: '/services/ore-research'
    }
  ];

  return (
    <section className="section-padding bg-secondary-50">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Наши услуги</h2>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            Предоставляем полный спектр услуг по геометаллургическому сопровождению горно-обогатительных предприятий
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon as keyof typeof iconMap];
            return (
              <Card key={index} className="hover:scale-105 transition-transform duration-300">
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <div className="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-7 w-7 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-secondary-600 mb-6 flex-grow">{service.description}</p>
                  <Link 
                    href={service.href}
                    className="text-primary-600 font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all"
                  >
                    Подробнее
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
