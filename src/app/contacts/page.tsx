import React from 'react';
import Container from '@/components/ui/Container';
import ConsultationForm from '@/components/forms/ConsultationForm';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactsPage() {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-secondary-900 to-primary-700 text-white py-20">
        <Container>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">Контакты</h1>
          <p className="text-xl text-secondary-200 max-w-3xl animate-fade-in-up delay-200">
            Свяжитесь с нами для обсуждения вашего проекта
          </p>
        </Container>
      </section>

      <section className="section-padding">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="animate-fade-in-up delay-100">
              <h2 className="text-3xl font-bold mb-8">Как с нами связаться</h2>

              <div className="space-y-6 mb-12">
                {[
                  { Icon: Mail, label: 'Email', content: <a href="mailto:info@metricsolution.com" className="text-primary-600 hover:text-primary-700">info@metricsolution.com</a> },
                  { Icon: Phone, label: 'Телефон', content: <a href="tel:+77172000000" className="text-primary-600 hover:text-primary-700">+7 (717) 200-00-00</a> },
                  { Icon: MapPin, label: 'Адрес', content: <p className="text-secondary-700">г. Астана, Казахстан</p> },
                  { Icon: Clock, label: 'Время работы', content: <p className="text-secondary-700">Пн-Пт: 9:00 - 18:00<br />Сб-Вс: Выходной</p> },
                ].map(({ Icon, label, content }, i) => (
                  <div key={i} className={`flex items-start gap-4 animate-fade-in-up delay-${(i + 1) * 100}`}>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{label}</h3>
                      {content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-secondary-50 p-6 rounded-xl animate-fade-in delay-400">
                <h3 className="font-semibold mb-3">Важная информация</h3>
                <ul className="space-y-2 text-sm text-secondary-700">
                  {[
                    'Среднее время ответа на запрос — 24 часа',
                    'Первичная консультация — бесплатно',
                    'Возможен выезд специалистов на объект',
                    'Работаем со всеми регионами СНГ',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="animate-fade-in-up delay-200">
              <ConsultationForm />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
