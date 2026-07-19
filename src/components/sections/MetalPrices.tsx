'use client';

import React, { useEffect, useState } from 'react';
import Container from '@/components/ui/Container';
import { useLanguage } from '@/contexts/LanguageContext';

type MetalKey = 'gold' | 'silver' | 'copper' | 'zinc' | 'aluminum';
type MetalQuote = { key: MetalKey; price: number };
type MetalsData = {
  available: boolean;
  currency?: string;
  timestamp?: string;
  metals?: MetalQuote[];
};

export default function MetalPrices() {
  const { lang, langCode } = useLanguage();
  const t = lang.metals;
  const [data, setData] = useState<MetalsData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/metals', { signal: controller.signal })
      .then((r) => r.json())
      .then((d: MetalsData) => setData(d))
      .catch(() => setData({ available: false }));
    return () => controller.abort();
  }, []);

  if (!data || !data.available || !data.metals?.length) return null;

  const locale = langCode === 'kz' ? 'kk-KZ' : 'ru-RU';
  const priceFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  let updated = '';
  if (data.timestamp) {
    const parsed = new Date(data.timestamp);
    if (!Number.isNaN(parsed.getTime())) {
      updated = parsed.toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  return (
    <section className="section-padding bg-ink-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark opacity-40" aria-hidden="true" />
      <Container>
        <div className="relative">
          <p className="eyebrow mb-4">{t.eyebrow}</p>
          <h2 className="mb-3">{t.title}</h2>
          <p className="text-lg text-secondary-300 max-w-2xl mb-10">{t.subtitle}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.metals.map((m) => (
              <div key={m.key} className="card !p-6">
                <div className="text-sm font-medium text-secondary-400 mb-2">{t.names[m.key]}</div>
                <div className="font-display text-3xl font-bold text-white tabular-nums">
                  {priceFmt.format(m.price)}
                </div>
                <div className="text-xs text-accent-500 mt-1">{data.currency ?? 'USD'}</div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-secondary-500">
            {updated && (
              <>
                {t.updatedLabel}: {updated} · {t.sourceLabel}: metals.dev ·{' '}
              </>
            )}
            {t.disclaimer}
          </p>
        </div>
      </Container>
    </section>
  );
}
