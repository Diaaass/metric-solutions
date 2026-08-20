import React from 'react';
import type { Lang, Translation } from '@/i18n';
import type { MetalKey, MetalsData, MetalUnit } from '@/lib/metals';

/** Символы элементов из таблицы Менделеева вместо названий металлов. */
const SYMBOLS: Record<MetalKey, string> = {
  gold: 'Au',
  silver: 'Ag',
  copper: 'Cu',
  zinc: 'Zn',
  aluminum: 'Al',
};

/**
 * Узкая полоса с котировками над шапкой. Серверный компонент: данные приходят
 * из layout (getMetals с 12-часовым кешем), поэтому цены есть в первом же
 * HTML-кадре — без клиентского запроса и прыжка вёрстки. Без ключа API
 * данные {available:false}, и полоса не рендерится вовсе.
 */
export default function TickerBar({
  t,
  langCode,
  data,
}: {
  t: Translation['metals'];
  langCode: Lang;
  data: MetalsData;
}) {
  if (!data.available || data.metals.length === 0) return null;

  const locale = langCode === 'en' ? 'en-US' : 'ru-RU';
  // Унция — с центами (Au ≈ 4 235,50), тонна — целыми долларами (Cu ≈ 14 850).
  const priceFmt: Record<MetalUnit, Intl.NumberFormat> = {
    toz: new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    mt: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
  };

  return (
    <div
      className="relative border-b border-white/5 bg-ink-900/95"
      aria-label={t.eyebrow}
      title={t.disclaimer}
    >
      {/* Контейнер тот же, что у шапки (container-custom: max-w-7xl + те же
          горизонтальные паддинги), и от md раскладка тоже justify-between —
          крайние котировки встают ровно под логотипом и переключателем языка.
          Без этого цены сбивались в левый угол, а справа зияла пустота, из-за
          чего полоса читалась как не выровненная с навбаром.
          Уже md строка переносится: пять металлов в 375 px не влезают, и раньше
          Zn с Al просто уходили за край при скрытом скроллбаре — это и выглядело
          как «срезанная» вёрстка. Перенос ничего не прячет.
          relative обязателен: иначе абсолютные .sr-only не обрезаются контейнером
          и растягивают горизонтальный скролл всей страницы. */}
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 overflow-x-visible whitespace-nowrap px-4 py-2 text-xs sm:px-6 md:h-10 md:flex-nowrap md:justify-between md:gap-5 md:overflow-x-auto md:py-0 lg:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {data.metals.map((m) => (
          <React.Fragment key={m.key}>
            {/* Разделители не нужны: от md котировки разнесены justify-between,
                до md — переносом строки. Точка между ними стала бы отдельным
                flex-элементом и разъехалась бы вместе с ценами. */}
            <span className="flex shrink-0 items-baseline gap-1.5" title={t.names[m.key]}>
              <span
                className="font-display text-sm font-normal tracking-wide text-accent-300"
                aria-hidden="true"
              >
                {SYMBOLS[m.key]}
              </span>
              {/* Скринридеру — полное название металла вместо символа */}
              <span className="sr-only">{t.names[m.key]}</span>
              <span className="font-light tabular-nums text-white">
                {priceFmt[m.unit].format(m.price)}
              </span>
              {/* Единица измерения: без uppercase — иначе «$/т» превратится в «$/Т» */}
              <span className="text-[10px] font-light tracking-wide text-white/40">
                {t.units[m.unit]}
              </span>
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
