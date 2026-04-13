import React from 'react';
import Container from '@/components/ui/Container';

export default function Stats() {
  const stats = [
    { value: '15+', label: 'Лет опыта' },
    { value: '50+', label: 'Завершенных проектов' },
    { value: '30+', label: 'Довольных клиентов' },
    { value: '95%', label: 'Повторных обращений' },
  ];

  return (
    <section className="section-padding bg-primary-600 text-white">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-primary-100 text-sm md:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
