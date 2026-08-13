import type { MetadataRoute } from 'next';
import { SERVICE_SLUGS } from '@/i18n/seo';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://metricsolutions.kz';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    '',
    '/about',
    '/services',
    '/solutions',
    '/contacts',
    '/privacy',
    ...SERVICE_SLUGS.map((slug) => `/services/${slug}`),
  ];

  return routes.flatMap((path) => {
    const ruUrl = `${BASE_URL}${path}`;
    const enUrl = `${BASE_URL}/en${path}`;
    const priority = path === '' ? 1 : 0.7;
    const languages = { ru: ruUrl, en: enUrl, 'x-default': ruUrl };

    return [
      {
        url: ruUrl,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority,
        alternates: { languages },
      },
      {
        url: enUrl,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority,
        alternates: { languages },
      },
    ];
  });
}
