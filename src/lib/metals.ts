// Металлы, которые показываем (ключи соответствуют полям ответа metals.dev)
const METAL_KEYS = ['gold', 'silver', 'copper', 'zinc', 'aluminum'] as const;

export type MetalKey = (typeof METAL_KEYS)[number];

/** Единица измерения цены: тройская унция (драгметаллы) или метрическая тонна (промышленные). */
export type MetalUnit = 'toz' | 'mt';

export type MetalQuote = { key: MetalKey; price: number; unit: MetalUnit };

export type MetalsData =
  | { available: false }
  | {
      available: true;
      currency: string;
      timestamp: string;
      metals: MetalQuote[];
    };

/** Тройских унций в метрической тонне: 1 000 000 г / 31,1034768 г. */
const TOZ_PER_TONNE = 32150.7466;

/**
 * Биржевая единица котировки по металлу. metals.dev отдаёт всё в запрошенной
 * единице (у нас toz), но рынок котирует драгметаллы за унцию, а промышленные
 * металлы (LME) — за метрическую тонну. Цена меди «0,46 USD» за унцию
 * бессмысленна для клиента, поэтому промышленные металлы пересчитываем.
 */
const UNIT_BY_METAL: Record<MetalKey, MetalUnit> = {
  gold: 'toz',
  silver: 'toz',
  copper: 'mt',
  zinc: 'mt',
  aluminum: 'mt',
};

/**
 * Приводит цену из тройских унций к биржевой единице металла.
 * Дополнительных обращений к API не требует — пересчёт чисто арифметический.
 */
function toMarketUnit(pricePerToz: number, unit: MetalUnit): number {
  // Тонна: округляем до целых долларов — дробные центы на таком масштабе шум.
  return unit === 'mt' ? Math.round(pricePerToz * TOZ_PER_TONNE) : pricePerToz;
}

// Кеш на 24 часа: ~30 обращений к источнику в месяц + сборки — с запасом
// укладывается в бесплатный тариф metals.dev (100/мес).
const REVALIDATE_SECONDS = 24 * 60 * 60;

/**
 * Фиксированные цены-заглушки. Используются:
 * - в dev по умолчанию — дев-сервер и сборки не должны жечь месячную квоту
 *   metals.dev (именно так она и была исчерпана: каждый перезапуск `next dev`
 *   сбрасывает кеш fetch); живые данные локально — METALS_LIVE=1;
 * - на проде как фолбэк при недоступном API (исчерпанная квота, нет ключа,
 *   сбой сети) — полоса котировок не должна исчезать со страницы; данные и так
 *   помечены дисклеймером «справочный характер». Когда API оживает, живые цены
 *   возвращаются сами (кеш fetch — сутки).
 */
const FALLBACK_DATA: MetalsData = {
  available: true,
  currency: 'USD',
  timestamp: '2026-01-01T00:00:00Z',
  metals: [
    { key: 'gold', unit: 'toz', price: 4235.5 },
    { key: 'silver', unit: 'toz', price: 52.4 },
    { key: 'copper', unit: 'mt', price: 14850 },
    { key: 'zinc', unit: 'mt', price: 2860 },
    { key: 'aluminum', unit: 'mt', price: 2540 },
  ],
};

/**
 * Котировки metals.dev для серверного рендера (тикер в layout).
 * Fetch кешируется Next на 24 часа (ISR), поэтому цены попадают в первый же
 * HTML-кадр без клиентского запроса и сдвига вёрстки.
 *
 * Функция всегда возвращает данные: живые при доступном API, иначе
 * FALLBACK_DATA — полоса котировок никогда не пропадает со страницы.
 *
 * Запрос всегда один и тот же (unit=toz); промышленные металлы приводятся
 * к цене за тонну арифметически, без дополнительных обращений к API.
 */
export async function getMetals(): Promise<MetalsData> {
  const apiKey = process.env.METALS_API_KEY;

  // В dev по умолчанию заглушка: квота API — только для прода (или METALS_LIVE=1).
  if (process.env.NODE_ENV === 'development' && process.env.METALS_LIVE !== '1') {
    return FALLBACK_DATA;
  }

  if (!apiKey) {
    return FALLBACK_DATA;
  }

  try {
    const url = `https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=USD&unit=toz`;
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });

    if (!res.ok) {
      return FALLBACK_DATA;
    }

    const data: unknown = await res.json();
    if (!data || typeof data !== 'object') {
      return FALLBACK_DATA;
    }

    const body = data as {
      status?: string;
      currency?: string;
      timestamp?: string;
      metals?: Record<string, number>;
    };

    // metals.dev отдаёт ошибки (исчерпанная квота, неверный ключ) телом с
    // HTTP 200 — надёжный признак успеха только body.status === 'success'.
    if (body.status !== 'success') {
      return FALLBACK_DATA;
    }

    const source = body.metals ?? {};
    const metals: MetalQuote[] = METAL_KEYS.filter((key) => typeof source[key] === 'number').map(
      (key) => {
        const unit = UNIT_BY_METAL[key];
        return { key, unit, price: toMarketUnit(source[key] as number, unit) };
      },
    );

    if (metals.length === 0) {
      return FALLBACK_DATA;
    }

    return {
      available: true,
      currency: body.currency ?? 'USD',
      timestamp: body.timestamp ?? new Date().toISOString(),
      metals,
    };
  } catch {
    return FALLBACK_DATA;
  }
}
