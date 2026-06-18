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

  // Источник не подключён или данных нет — секция не показывается.
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
    <section className="section-padding bg-secondary-50 border-y border-secondary-200">
      <Container>
        <div className="max-w-2xl mb-10">
          <p className="eyebrow mb-4">{t.eyebrow}</p>
          <h2 className="font-bold mb-3">{t.title}</h2>
          <p className="text-lg text-secondary-600">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-secondary-200 border border-secondary-200 rounded-lg overflow-hidden">
          {data.metals.map((m) => (
            <div key={m.key} className="bg-white p-6">
              <div className="text-sm font-medium text-secondary-500 mb-2">{t.names[m.key]}</div>
              <div className="font-mono text-2xl font-semibold text-primary-900 tabular-nums">
                {priceFmt.format(m.price)}
              </div>
              <div className="font-mono text-xs text-secondary-400 mt-1">
                {data.currency ?? 'USD'}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-xs text-secondary-400">
          {updated && (
            <>
              {t.updatedLabel}: {updated} · {t.sourceLabel}: metals.dev ·{' '}
            </>
          )}
          {t.disclaimer}
        </p>
      </Container>
    </section>
  );
}
