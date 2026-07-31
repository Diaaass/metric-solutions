'use client';

import React, { useEffect, useState } from 'react';
import type { Lang, Translation } from '@/i18n';

type MetalKey = 'gold' | 'silver' | 'copper' | 'zinc' | 'aluminum';
type MetalQuote = { key: MetalKey; price: number };
type MetalsData = {
  available: boolean;
  currency?: string;
  timestamp?: string;
  metals?: MetalQuote[];
};

/** Символы элементов из таблицы Менделеева вместо названий металлов. */
const SYMBOLS: Record<MetalKey, string> = {
  gold: 'Au',
  silver: 'Ag',
  copper: 'Cu',
  zinc: 'Zn',
  aluminum: 'Al',
};

/**
 * Узкая полоса с котировками над шапкой.
 * Данные — тот же /api/metals (metals.dev). Без METALS_API_KEY роут отдаёт
 * {available:false}, и полоса не рендерится вовсе — сдвига вёрстки нет.
 */
export default function TickerBar({ t, langCode }: { t: Translation['metals']; langCode: Lang }) {
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
  const priceFmt = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const currency = data.currency ?? 'USD';

  return (
    <div
      className="border-b border-white/5 bg-ink-900/95"
      aria-label={t.eyebrow}
      title={t.disclaimer}
    >
      {/* Одна строка; на узких экранах — горизонтальная прокрутка внутри полосы.
          relative обязателен: иначе абсолютные .sr-only не обрезаются контейнером
          и растягивают горизонтальный скролл всей страницы. */}
      <div className="relative mx-auto flex h-10 max-w-7xl items-center gap-5 overflow-x-auto whitespace-nowrap px-4 text-xs sm:px-6 lg:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {data.metals.map((m, i) => (
          <React.Fragment key={m.key}>
            {i > 0 && (
              <span className="text-white/20" aria-hidden="true">
                ·
              </span>
            )}
            <span className="flex shrink-0 items-baseline gap-1.5" title={t.names[m.key]}>
              <span
                className="font-display text-sm font-semibold tracking-wide text-accent-300"
                aria-hidden="true"
              >
                {SYMBOLS[m.key]}
              </span>
              {/* Скринридеру — полное название металла вместо символа */}
              <span className="sr-only">{t.names[m.key]}</span>
              <span className="font-light tabular-nums text-white">{priceFmt.format(m.price)}</span>
              <span className="text-[10px] font-light uppercase tracking-wide text-white/40">
                {currency}
              </span>
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
