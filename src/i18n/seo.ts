import type { Metadata } from 'next';
import { translations } from '@/i18n';
import type { Lang } from '@/i18n';

/** Базовый абсолютный URL сайта (для canonical, hreflang, metadataBase, sitemap). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://metricsolutions.kz';

/** Ключевые слова добавляются только в русскую версию (см. buildMetadata). */
const RU_KEYWORDS =
  'геометаллургия, обогащение полезных ископаемых, флотация, гидрометаллургия, технологический аудит, лабораторные исследования, пилотные испытания, горно-металлургический консалтинг, NomadLab';

/**
 * Соответствие «страница → путь» для канонического русского URL (без префикса /ru).
 * Казахская версия получает тот же путь с префиксом /kz.
 */
export const SEO_PATHS = {
  home: '',
  about: '/about',
  services: '/services',
  solutions: '/solutions',
  contacts: '/contacts',
} as const;

export type SeoPage = keyof typeof SEO_PATHS;

/** Type guard: строка из URL является поддерживаемым языком. */
export function isLang(value: string): value is Lang {
  return value === 'ru' || value === 'kz';
}

/**
 * Собирает объект Metadata для страницы:
 * - title/description из словаря (translations[lang].seo[page]);
 * - keywords — только для ru;
 * - canonical: ru без префикса (https://…/about), kz с префиксом (https://…/kz/about);
 * - alternates.languages (hreflang): ru → корень, kk → /kz, x-default → корень.
 */
export function buildMetadata(lang: Lang, page: SeoPage): Metadata {
  const seo = translations[lang].seo[page];
  const path = SEO_PATHS[page];

  const ruUrl = `${SITE_URL}${path}`;
  const kzUrl = `${SITE_URL}/kz${path}`;
  const canonical = lang === 'kz' ? kzUrl : ruUrl;

  return {
    title: seo.title,
    description: seo.description,
    ...(lang === 'ru' ? { keywords: RU_KEYWORDS } : {}),
    alternates: {
      canonical,
      languages: {
        ru: ruUrl,
        kk: kzUrl,
        'x-default': ruUrl,
      },
    },
  };
}
