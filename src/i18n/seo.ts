import type { Metadata } from 'next';
import { translations } from '@/i18n';
import type { Lang } from '@/i18n';
import type { ServiceSlug } from './types';

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

/** Слаги детальных страниц направлений — источник истины для роутинга и sitemap. */
export const SERVICE_SLUGS = ['geometallurgy', 'beneficiation', 'hydrometallurgy'] as const;

/** Type guard: строка из URL является поддерживаемым языком. */
export function isLang(value: string): value is Lang {
  return value === 'ru' || value === 'kz';
}

/** Type guard: строка из URL является слагом направления. */
export function isServiceSlug(value: string): value is ServiceSlug {
  return (SERVICE_SLUGS as readonly string[]).includes(value);
}

/**
 * canonical + hreflang для произвольного пути (без языкового префикса):
 * ru — без префикса, kz — с префиксом /kz.
 */
function buildAlternates(lang: Lang, path: string): NonNullable<Metadata['alternates']> {
  const ruUrl = `${SITE_URL}${path}`;
  const kzUrl = `${SITE_URL}/kz${path}`;

  return {
    canonical: lang === 'kz' ? kzUrl : ruUrl,
    languages: {
      ru: ruUrl,
      kk: kzUrl,
      'x-default': ruUrl,
    },
  };
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

  return {
    title: seo.title,
    description: seo.description,
    ...(lang === 'ru' ? { keywords: RU_KEYWORDS } : {}),
    alternates: buildAlternates(lang, SEO_PATHS[page]),
  };
}

/**
 * Metadata детальной страницы направления (/services/[slug]).
 * title/description берутся из словаря (serviceDetail.items[slug]),
 * canonical и hreflang собираются по той же схеме, что и у остальных страниц.
 */
export function buildServiceMetadata(lang: Lang, slug: ServiceSlug): Metadata {
  const item = translations[lang].serviceDetail.items[slug];

  return {
    title: item.seoTitle,
    description: item.seoDescription,
    ...(lang === 'ru' ? { keywords: RU_KEYWORDS } : {}),
    alternates: buildAlternates(lang, `${SEO_PATHS.services}/${slug}`),
  };
}
