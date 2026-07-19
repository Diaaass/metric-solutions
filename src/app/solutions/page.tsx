'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import { Container as ContainerIcon, Factory, CheckCircle, type LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const solutionIcons: Record<string, LucideIcon> = {
  nomadlab: ContainerIcon,
  'nomad-pilot-plant': Factory,
};

export default function SolutionsPage() {
  const { lang } = useLanguage();
  const t = lang.solutionsPage;

  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-[24%] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-accent-500/10 blur-[150px]"
        aria-hidden="true"
      />

      <Container>
        <div className="relative pt-14 md:pt-20 pb-10">
          <p className="text-lg md:text-xl font-extralight text-white tracking-tight mb-5 animate-fade-in">
            {t.breadcrumb}
          </p>
          {/* Дисплейный заголовок с градиентными частями (как в макете) */}
          <h1 className="!text-4xl md:!text-6xl mb-6 animate-fade-in-up">
            {t.heroTitle1}
            <span className="text-grad">{t.heroTitle1Accent}</span> и
            <br />
            {t.heroTitle2} <span className="text-grad">{t.heroTitle2Accent}</span>
          </h1>
          <p className="max-w-2xl text-base md:text-lg font-extralight text-white leading-relaxed tracking-tight mb-8 animate-fade-in-up delay-100">
            {t.heroSubtitle}
          </p>
          <p className="max-w-2xl text-base md:text-lg font-extralight text-white leading-relaxed tracking-tight animate-fade-in-up delay-200">
            {t.intro}
          </p>
        </div>

        {/* Карточки решений */}
        <div className="relative space-y-10 pb-24 pt-6">
          {t.items.map((item, i) => {
            const Icon = solutionIcons[item.slug] ?? ContainerIcon;
            return (
              <article
                key={item.slug}
                className="card !p-8 md:!p-10 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              >
                {/* Мини-панель с иконкой и названием */}
                <div className="rounded-xl border border-[rgba(26,92,255,0.4)] bg-white/[0.02] p-6 flex flex-col items-start justify-center">
                  <Icon
                    className="h-14 w-14 text-accent-400 drop-shadow-icon mb-5"
                    strokeWidth={1.3}
                  />
                  <h2 className="!text-xl mb-1">{item.name}</h2>
                  <p className="text-sm text-grad font-medium">{item.tagline}</p>
                </div>

                {/* Описание + пункты */}
                <div className="lg:col-span-2">
                  <p className="text-[15px] font-extralight text-white leading-relaxed tracking-tight mb-6">
                    {item.description}
                  </p>
                  <ul className="space-y-3.5">
                    {item.points.map((point, j) => (
                      <li key={j} className="flex items-center gap-3">
                        <CheckCircle
                          className="h-5 w-5 flex-shrink-0 text-accent-400 drop-shadow-icon"
                          strokeWidth={1.8}
                        />
                        <span className="text-sm font-extralight text-white tracking-tight">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
