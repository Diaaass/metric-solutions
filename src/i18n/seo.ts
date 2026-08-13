import type { Metadata } from 'next';
import { translations } from '@/i18n';
import type { Lang } from '@/i18n';
import type { ServiceSlug } from './types';
import { contacts } from '@/data/contacts';

/** Базовый абсолютный URL сайта (для canonical, hreflang, metadataBase, sitemap). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://metricsolutions.kz';

/** Ключевые слова добавляются только в русскую версию (см. buildMetadata). */
const RU_KEYWORDS =
  'геометаллургия, обогащение полезных ископаемых, флотация, гидрометаллургия, технологический аудит, лабораторные исследования, пилотные испытания, горно-металлургический консалтинг, NomadLab';

/**
 * Соответствие «страница → путь» для канонического русского URL (без префикса /ru).
 * Английская версия получает тот же путь с префиксом /en.
 */
export const SEO_PATHS = {
  home: '',
  about: '/about',
  services: '/services',
  solutions: '/solutions',
  contacts: '/contacts',
  privacy: '/privacy',
} as const;

export type SeoPage = keyof typeof SEO_PATHS;

/** Слаги детальных страниц направлений — источник истины для роутинга и sitemap. */
export const SERVICE_SLUGS = ['geometallurgy', 'beneficiation', 'hydrometallurgy'] as const;

/** Type guard: строка из URL является поддерживаемым языком. */
export function isLang(value: string): value is Lang {
  return value === 'ru' || value === 'en';
}

/** Type guard: строка из URL является слагом направления. */
export function isServiceSlug(value: string): value is ServiceSlug {
  return (SERVICE_SLUGS as readonly string[]).includes(value);
}

/** Абсолютный URL страницы в конкретной локали: ru — корень, en — префикс /en. */
function localizedUrl(lang: Lang, path: string): string {
  return lang === 'en' ? `${SITE_URL}/en${path}` : `${SITE_URL}${path}`;
}

/**
 * canonical + hreflang для произвольного пути (без языкового префикса):
 * ru — без префикса, en — с префиксом /en.
 */
function buildAlternates(lang: Lang, path: string): NonNullable<Metadata['alternates']> {
  const ruUrl = localizedUrl('ru', path);
  const enUrl = localizedUrl('en', path);

  return {
    canonical: localizedUrl(lang, path),
    languages: {
      ru: ruUrl,
      en: enUrl,
      'x-default': ruUrl,
    },
  };
}

/** Единая OG-картинка сайта: логотип на фирменном тёмно-синем (1200×630). */
const OG_IMAGE = { url: '/og.jpg', width: 1200, height: 630, alt: 'Metric Solutions' };

/**
 * Open Graph + Twitter Card для страницы. Относительный путь картинки
 * разрешается через metadataBase в корневом layout.
 */
function buildSocial(
  lang: Lang,
  title: string,
  description: string,
  path: string,
): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
    openGraph: {
      type: 'website',
      siteName: 'Metric Solutions',
      title,
      description,
      url: localizedUrl(lang, path),
      locale: lang === 'en' ? 'en_US' : 'ru_RU',
      alternateLocale: lang === 'en' ? ['ru_RU'] : ['en_US'],
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/**
 * Собирает объект Metadata для страницы:
 * - title/description из словаря (translations[lang].seo[page]);
 * - keywords — только для ru;
 * - canonical: ru без префикса (https://…/about), en с префиксом (https://…/en/about);
 * - alternates.languages (hreflang): ru → корень, en → /en, x-default → корень.
 */
export function buildMetadata(lang: Lang, page: SeoPage): Metadata {
  const seo = translations[lang].seo[page];
  const path = SEO_PATHS[page];

  return {
    title: seo.title,
    description: seo.description,
    ...(lang === 'ru' ? { keywords: RU_KEYWORDS } : {}),
    alternates: buildAlternates(lang, path),
    ...buildSocial(lang, seo.title, seo.description, path),
  };
}

/**
 * Metadata детальной страницы направления (/services/[slug]).
 * title/description берутся из словаря (serviceDetail.items[slug]),
 * canonical и hreflang собираются по той же схеме, что и у остальных страниц.
 */
export function buildServiceMetadata(lang: Lang, slug: ServiceSlug): Metadata {
  const item = translations[lang].serviceDetail.items[slug];
  const path = `${SEO_PATHS.services}/${slug}`;

  return {
    title: item.seoTitle,
    description: item.seoDescription,
    ...(lang === 'ru' ? { keywords: RU_KEYWORDS } : {}),
    alternates: buildAlternates(lang, path),
    ...buildSocial(lang, item.seoTitle, item.seoDescription, path),
  };
}

/**
 * JSON-LD Organization для <script type="application/ld+json"> в layout.
 * Собирается из констант (src/data/contacts.ts) — пользовательского ввода нет.
 */
export function buildOrgJsonLd(lang: Lang): string {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Metric Solutions',
    url: SITE_URL,
    logo: `${SITE_URL}/og.jpg`,
    email: contacts.email,
    telephone: contacts.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: lang === 'en' ? '10/2-36 B. Momyshuly St.' : 'ул. Б. Момышулы, 10/2-36',
      addressLocality: lang === 'en' ? 'Astana' : 'Астана',
      postalCode: '010000',
      addressCountry: 'KZ',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: contacts.email,
      telephone: contacts.phone,
      availableLanguage: ['ru', 'en'],
    },
  };

  // «<» экранируется, чтобы строка не могла закрыть тег <script>.
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}
