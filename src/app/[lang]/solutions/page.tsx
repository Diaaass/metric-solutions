import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Container from '@/components/ui/Container';
import {
  Container as ContainerIcon,
  Factory,
  CheckCircle,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';
import { translations } from '@/i18n';
import { buildMetadata, isLang } from '@/i18n/seo';
import { servicesBySolution } from '@/data/serviceLinks';

const solutionIcons: Record<string, LucideIcon> = {
  nomadlab: ContainerIcon,
  'nomad-pilot-plant': Factory,
  // Аудит — это не установка, а работа с чек-листом: ClipboardCheck читается
  // однозначнее, чем Gauge, который скорее про измерение показателей.
  'tech-audit': ClipboardCheck,
};

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  if (!isLang(params.lang)) return {};
  return buildMetadata(params.lang, 'solutions');
}

export default function SolutionsPage({ params }: Props) {
  if (!isLang(params.lang)) notFound();
  const lang = params.lang;
  const t = translations[lang].solutionsPage;
  const serviceItems = translations[lang].servicesPage.items;
  const detail = translations[lang].serviceDetail;
  const base = lang === 'kz' ? '/kz' : '';

  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-[24%] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-accent-500/10 blur-[150px]"
        aria-hidden="true"
      />

      <Container>
        <div className="relative pt-14 md:pt-20 pb-10">
          <p className="text-lg md:text-xl font-thin text-white tracking-[-0.03em] mb-5 animate-fade-in">
            {t.breadcrumb}
          </p>
          {/* Дисплейный заголовок с градиентными частями (как в макете) */}
          <h1 className="!text-4xl md:!text-6xl mb-6 animate-fade-in-up">
            {t.heroTitle1}
            <span className="text-grad">{t.heroTitle1Accent}</span> {t.heroTitleConjunction}
            <br />
            {t.heroTitle2} <span className="text-grad">{t.heroTitle2Accent}</span>
          </h1>
          <p className="max-w-2xl text-base md:text-lg font-thin text-white leading-relaxed tracking-[-0.03em] mb-8 animate-fade-in-up delay-100">
            {t.heroSubtitle}
          </p>
          <p className="max-w-2xl text-base md:text-lg font-thin text-white leading-relaxed tracking-[-0.03em] animate-fade-in-up delay-200">
            {t.intro}
          </p>
        </div>

        {/* Карточки решений */}
        <div className="relative space-y-10 pb-24 pt-6">
          {t.items.map((item, i) => {
            const Icon = solutionIcons[item.slug] ?? ContainerIcon;
            const relatedServices = servicesBySolution(item.slug)
              .map((slug) => serviceItems.find((service) => service.slug === slug))
              .filter((service): service is (typeof serviceItems)[number] => Boolean(service));
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

                {/* Связанные направления: ссылки на детальные страницы услуг */}
                {relatedServices.length > 0 && (
                  <div className="lg:col-span-3 border-t border-[rgba(26,92,255,0.3)] pt-6 flex flex-wrap items-center gap-x-3 gap-y-3">
                    <span className="text-sm font-light text-white/70">
                      {detail.relatedServicesTitle}:
                    </span>
                    {relatedServices.map((service) => (
                      <Link
                        key={service.slug}
                        href={`${base}/services/${service.slug}`}
                        className="inline-flex items-center rounded-full border border-[rgba(26,92,255,0.5)] px-4 py-1.5 text-sm font-light text-white
                                   transition-colors hover:border-accent-500/80 hover:text-accent-300
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
                      >
                        {service.title}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
