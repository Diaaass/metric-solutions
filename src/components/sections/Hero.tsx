import React from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { ChevronRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary-900 text-white">
      <Container>
        <div className="py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Профессиональные решения в области геометаллургии
            </h1>
            <p className="text-xl md:text-2xl text-secondary-200 mb-8">
              Повышаем эффективность обогащения руд через комплексный подход к геологии и металлургии
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button href="/services" variant="primary" className="inline-flex items-center gap-2">
                Наши услуги
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button href="/contacts" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-secondary-900">
                Связаться с нами
              </Button>
            </div>
          </div>
        </div>
      </Container>
      
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-40 w-96 h-96 bg-primary-600 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
}
