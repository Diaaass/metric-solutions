import React from 'react';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import { teamMembers } from '@/data/team';
import { User } from 'lucide-react';

export default function TeamPage() {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-br from-secondary-900 to-primary-700 text-white py-20">
        <Container>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">Наша команда</h1>
          <p className="text-xl text-secondary-200 max-w-3xl animate-fade-in-up delay-200">
            Профессионалы с многолетним опытом работы в области геометаллургии и обогащения полезных ископаемых
          </p>
        </Container>
      </section>

      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 dot-grid-bg pointer-events-none" />
        <Container className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {teamMembers.map((member, i) => (
              <Card key={member.id} className={`animate-fade-in-up delay-${(i + 1) * 100}`}>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                      <User className="h-16 w-16 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-2xl font-bold mb-1">{member.name}</h2>
                    <p className="text-primary-600 font-semibold mb-4">{member.position}</p>
                    <p className="text-secondary-700 mb-6 leading-relaxed">{member.bio}</p>
                    <div>
                      <h3 className="font-semibold mb-3 text-sm uppercase text-secondary-500">Экспертиза:</h3>
                      <div className="flex flex-wrap gap-2">
                        {member.expertise.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="bg-primary-50 p-8 md:p-12 rounded-xl text-center animate-fade-in delay-300">
            <h2 className="text-3xl font-bold mb-4">Хотите присоединиться к команде?</h2>
            <p className="text-lg text-secondary-700 mb-8 max-w-2xl mx-auto">
              Мы всегда ищем талантливых специалистов в области геометаллургии и обогащения полезных ископаемых
            </p>
            <Link href="/contacts" className="btn-primary inline-block">
              Отправить резюме
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
