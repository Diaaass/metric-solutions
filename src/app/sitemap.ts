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
    ...SERVICE_SLUGS.map((slug) => `/services/${slug}`),
  ];

  return routes.flatMap((path) => {
    const ruUrl = `${BASE_URL}${path}`;
    const kzUrl = `${BASE_URL}/kz${path}`;
    const priority = path === '' ? 1 : 0.7;
    const languages = { ru: ruUrl, kk: kzUrl, 'x-default': ruUrl };

    return [
      {
        url: ruUrl,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority,
        alternates: { languages },
      },
      {
        url: kzUrl,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority,
        alternates: { languages },
      },
    ];
  });
}
