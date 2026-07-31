import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Hero from '@/components/sections/Hero';
import HomeAbout from '@/components/sections/HomeAbout';
import ServicesPreview from '@/components/sections/ServicesPreview';
import { translations } from '@/i18n';
import { buildMetadata, isLang } from '@/i18n/seo';

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  if (!isLang(params.lang)) return {};
  return buildMetadata(params.lang, 'home');
}

export default function Home({ params }: Props) {
  if (!isLang(params.lang)) notFound();
  const lang = params.lang;
  const t = translations[lang];
  const base = lang === 'kz' ? '/kz' : '';

  return (
    <>
      <Hero t={t.hero} base={base} />
      <HomeAbout t={t.homeAbout} />
      <ServicesPreview t={t.homeServices} banner={t.ctaBanner} base={base} />
    </>
  );
}
