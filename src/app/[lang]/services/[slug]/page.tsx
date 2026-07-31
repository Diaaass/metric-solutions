import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Container from '@/components/ui/Container';
import {
  ArrowRight,
  Container as ContainerIcon,
  Factory,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react';
import { translations } from '@/i18n';
import { buildServiceMetadata, isLang, isServiceSlug, SERVICE_SLUGS } from '@/i18n/seo';
import { SOLUTIONS_BY_SERVICE } from '@/data/serviceLinks';

const solutionIcons: Record<string, LucideIcon> = {
  nomadlab: ContainerIcon,
  'nomad-pilot-plant': Factory,
};

type Props = { params: { lang: string; slug: string } };

// 3 направления на каждый язык (языки задаёт generateStaticParams в layout).
export function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

// Слаг вне списка выше → 404, динамически такие страницы не рендерим.
export const dynamicParams = false;

export function generateMetadata({ params }: Props): Metadata {
  if (!isLang(params.lang) || !isServiceSlug(params.slug)) return {};
  return buildServiceMetadata(params.lang, params.slug);
}

export default function ServiceDetailPage({ params }: Props) {
  if (!isLang(params.lang) || !isServiceSlug(params.slug)) notFound();

  const lang = params.lang;
  const slug = params.slug;
  const t = translations[lang];
  const base = lang === 'kz' ? '/kz' : '';

  const detail = t.serviceDetail.items[slug];
  const card = t.servicesPage.items.find((item) => item.slug === slug);
  if (!card) notFound();

  const relatedSlugs = SOLUTIONS_BY_SERVICE[slug];
  const relatedSolutions = t.solutionsPage.items.filter((item) => relatedSlugs.includes(item.slug));

  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-[18%] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-accent-500/10 blur-[150px]"
        aria-hidden="true"
      />

      <Container>
        {/* Шапка: хлебные крошки, заголовок, лид */}
        <div className="relative pt-14 md:pt-20 pb-10">
          <p className="text-lg md:text-xl font-thin text-white tracking-[-0.03em] mb-5 animate-fade-in">
            <Link href={`${base}/services`} className="hover:text-accent-300 transition-colors">
              {t.serviceDetail.breadcrumbPrefix}
            </Link>{' '}
            / {card.title}
          </p>

          <div className="flex items-start gap-5 mb-6 animate-fade-in-up">
            <FlaskConical
              className="h-12 w-12 shrink-0 text-accent-400 drop-shadow-icon mt-1 hidden sm:block"
              strokeWidth={1.4}
              aria-hidden="true"
            />
            <h1 className="!text-3xl md:!text-5xl">{card.title}</h1>
          </div>

          <p className="max-w-3xl text-base md:text-lg font-thin text-white leading-relaxed tracking-[-0.03em] animate-fade-in-up delay-100">
            {detail.lead}
          </p>
        </div>

        {/* Временное изображение направления (заменяется на реальное фото заказчика) */}
        <div className="relative animate-fade-in delay-200">
          <div className="overflow-hidden rounded-[30px] border border-[rgba(26,92,255,0.5)] shadow-card-glow">
            <Image
              src={`/service-${params.slug}.webp`}
              alt=""
              width={1600}
              height={900}
              priority
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="h-auto w-full"
            />
          </div>
        </div>

        {/* Развёрнутое описание */}
        <div className="relative max-w-3xl space-y-6 pt-12">
          {detail.paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-[15px] md:text-base font-extralight text-white/95 leading-relaxed tracking-tight animate-fade-in-up"
              style={{ animationDelay: `${(i + 1) * 80}ms` }}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Связанные решения */}
        <div className="relative pt-16 pb-24">
          <h2 className="mb-8 animate-fade-in">{t.serviceDetail.relatedSolutionsTitle}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {relatedSolutions.map((solution, i) => {
              const Icon = solutionIcons[solution.slug] ?? ContainerIcon;
              return (
                <Link
                  key={solution.slug}
                  href={`${base}/solutions`}
                  className="card group flex flex-col animate-fade-in-up"
                  style={{ animationDelay: `${(i + 1) * 100}ms` }}
                >
                  <Icon
                    className="h-11 w-11 text-accent-400 drop-shadow-icon mb-4"
                    strokeWidth={1.3}
                    aria-hidden="true"
                  />
                  <h3 className="!text-lg mb-1">{solution.name}</h3>
                  <p className="text-sm text-grad font-medium mb-4">{solution.tagline}</p>
                  <span className="mt-auto inline-flex items-center gap-2 text-sm font-light text-accent-300 transition-colors group-hover:text-white">
                    {t.serviceDetail.relatedSolutionsLink}
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}
