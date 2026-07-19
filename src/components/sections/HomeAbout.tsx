'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import { CheckCircle, History, CheckSquare, type LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const icons: Record<string, LucideIcon> = {
  CheckCircle,
  History,
  CheckSquare,
};

export default function HomeAbout() {
  const { lang } = useLanguage();
  const t = lang.homeAbout;

  return (
    <section className="relative overflow-hidden bg-ink-950 section-padding">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      <Container>
        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          {/* Текст */}
          <div className="lg:col-span-3">
            <p className="eyebrow mb-4 animate-fade-in">{t.eyebrow}</p>
            <h2 className="mb-8 max-w-xl animate-fade-in">{t.title}</h2>
            <p className="text-lg md:text-xl font-extralight text-white leading-relaxed max-w-xl animate-fade-in delay-100">
              <span className="text-grad font-medium">{t.brand}</span>
              {t.intro}
            </p>
          </div>

          {/* 3 узкие карточки (как в макете) */}
          <div className="lg:col-span-2 grid grid-cols-3 gap-4 animate-fade-in-up delay-200">
            {t.cards.map((card, i) => {
              const Icon = icons[card.icon] ?? CheckCircle;
              return (
                <div
                  key={i}
                  className="card !p-4 flex flex-col items-center text-center min-h-[270px]"
                >
                  <Icon
                    className="h-7 w-7 text-accent-400 drop-shadow-icon mt-2 mb-5"
                    strokeWidth={1.7}
                  />
                  <h3 className="!text-[13px] font-medium tracking-wide mb-4 leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs font-extralight text-white/90 leading-relaxed tracking-wide">
                    {card.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
