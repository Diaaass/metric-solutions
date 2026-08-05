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

// Кеш на 12 часов: ~60 обращений к источнику в месяц — укладывается в бесплатный тариф metals.dev (100/мес).
const REVALIDATE_SECONDS = 12 * 60 * 60;

/**
 * Котировки metals.dev для серверного рендера (тикер в layout).
 * Fetch кешируется Next на 12 часов (ISR), поэтому цены попадают в первый же
 * HTML-кадр без клиентского запроса и сдвига вёрстки. Без METALS_API_KEY
 * возвращает {available:false} — полоса просто не рендерится.
 *
 * Запрос всегда один и тот же (unit=toz); промышленные металлы приводятся
 * к цене за тонну арифметически, без дополнительных обращений к API.
 */
export async function getMetals(): Promise<MetalsData> {
  const apiKey = process.env.METALS_API_KEY;

  if (!apiKey) {
    return { available: false };
  }

  try {
    const url = `https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=USD&unit=toz`;
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });

    if (!res.ok) {
      return { available: false };
    }

    const data: unknown = await res.json();
    if (!data || typeof data !== 'object') {
      return { available: false };
    }

    const body = data as {
      currency?: string;
      timestamp?: string;
      metals?: Record<string, number>;
    };

    const source = body.metals ?? {};
    const metals: MetalQuote[] = METAL_KEYS.filter((key) => typeof source[key] === 'number').map(
      (key) => {
        const unit = UNIT_BY_METAL[key];
        return { key, unit, price: toMarketUnit(source[key] as number, unit) };
      },
    );

    if (metals.length === 0) {
      return { available: false };
    }

    return {
      available: true,
      currency: body.currency ?? 'USD',
      timestamp: body.timestamp ?? new Date().toISOString(),
      metals,
    };
  } catch {
    return { available: false };
  }
}
