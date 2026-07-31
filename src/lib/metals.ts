// Металлы, которые показываем (ключи соответствуют полям ответа metals.dev)
const METAL_KEYS = ['gold', 'silver', 'copper', 'zinc', 'aluminum'] as const;

export type MetalKey = (typeof METAL_KEYS)[number];
export type MetalQuote = { key: MetalKey; price: number };

export type MetalsData =
  | { available: false }
  | {
      available: true;
      currency: string;
      unit: string;
      timestamp: string;
      metals: MetalQuote[];
    };

// Кеш на 12 часов: ~60 обращений к источнику в месяц — укладывается в бесплатный тариф metals.dev (100/мес).
const REVALIDATE_SECONDS = 12 * 60 * 60;

/**
 * Котировки metals.dev для серверного рендера (тикер в layout).
 * Fetch кешируется Next на 12 часов (ISR), поэтому цены попадают в первый же
 * HTML-кадр без клиентского запроса и сдвига вёрстки. Без METALS_API_KEY
 * возвращает {available:false} — полоса просто не рендерится.
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
      unit?: string;
      timestamp?: string;
      metals?: Record<string, number>;
    };

    const source = body.metals ?? {};
    const metals: MetalQuote[] = METAL_KEYS.filter((key) => typeof source[key] === 'number').map(
      (key) => ({ key, price: source[key] as number }),
    );

    if (metals.length === 0) {
      return { available: false };
    }

    return {
      available: true,
      currency: body.currency ?? 'USD',
      unit: body.unit ?? 'toz',
      timestamp: body.timestamp ?? new Date().toISOString(),
      metals,
    };
  } catch {
    return { available: false };
  }
}
