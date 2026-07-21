import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Container from '@/components/ui/Container';
import {
  Shield,
  Users,
  Lock,
  Lightbulb,
  Send,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { translations } from '@/i18n';
import { buildMetadata, isLang } from '@/i18n/seo';

const icons: Record<string, LucideIcon> = {
  Shield,
  Users,
  Lock,
  Lightbulb,
  Send,
  CheckCircle2,
  Clock,
};

type ValueItem = { icon: string; title: string; text: string };

function ValueBlock({ item, big }: { item: ValueItem; big?: boolean }) {
  const Icon = icons[item.icon] ?? Shield;
  return (
    <div className="flex flex-col items-center text-center">
      <Icon
        className={`${big ? 'h-16 w-16' : 'h-10 w-10'} text-accent-400 drop-shadow-icon mb-6`}
        strokeWidth={1.4}
      />
      <h3 className="!text-xl mb-3 tracking-tight">{item.title}</h3>
      <p className="max-w-xs text-[15px] font-extralight text-white leading-relaxed tracking-tight">
        {item.text}
      </p>
    </div>
  );
}

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  if (!isLang(params.lang)) return {};
  return buildMetadata(params.lang, 'about');
}

export default function AboutPage({ params }: Props) {
  if (!isLang(params.lang)) notFound();
  const t = translations[params.lang].aboutPage;

  // Раскладка из макета: 2 больших + 2 больших, затем 3 в ряд
  const bigValues = t.values.slice(0, 4);
  const smallValues = t.values.slice(4);

  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-[26%] h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-accent-500/10 blur-[150px]"
        aria-hidden="true"
      />

      <Container>
        <div className="relative pt-14 md:pt-20 pb-10">
          <p className="text-lg md:text-xl font-extralight text-white tracking-tight mb-4 animate-fade-in">
            {t.breadcrumb}
          </p>
          <h2 className="!text-3xl md:!text-[34px] max-w-2xl mb-8 animate-fade-in-up">{t.title}</h2>
          <p className="max-w-xl text-lg md:text-xl font-extralight text-white leading-relaxed animate-fade-in-up delay-100">
            <span className="text-grad font-medium">{t.brand}</span>
            {t.intro}
          </p>
        </div>

        {/* Ценности: 2×2 крупные */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-x-24 gap-y-16 max-w-3xl mx-auto pt-10 pb-16">
          {bigValues.map((item, i) => (
            <div
              key={i}
              className="animate-fade-in-up"
              style={{ animationDelay: `${(i + 1) * 80}ms` }}
            >
              <ValueBlock item={item} big />
            </div>
          ))}
        </div>

        {/* Разделительная линия + 3 в ряд (миссия/профессионализм/ответственность) */}
        <div className="relative border-t border-[rgba(26,92,255,0.35)] max-w-5xl mx-auto" />
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-14 max-w-5xl mx-auto pt-16 pb-24">
          {smallValues.map((item, i) => (
            <div
              key={i}
              className="animate-fade-in-up"
              style={{ animationDelay: `${(i + 1) * 80}ms` }}
            >
              <ValueBlock item={item} />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
