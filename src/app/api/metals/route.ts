import { NextResponse } from 'next/server';

// Металлы, которые показываем (ключи соответствуют полям ответа metals.dev)
const METAL_KEYS = ['gold', 'silver', 'copper', 'zinc', 'aluminum'] as const;
type MetalKey = (typeof METAL_KEYS)[number];

// Кеш на 12 часов: ~60 обращений к источнику в месяц — укладывается в бесплатный тариф metals.dev (100/мес).
const REVALIDATE_SECONDS = 12 * 60 * 60;

type MetalQuote = { key: MetalKey; price: number };

type MetalsResponse =
  | { available: false }
  | {
      available: true;
      currency: string;
      unit: string;
      timestamp: string;
      metals: MetalQuote[];
    };

export async function GET(): Promise<NextResponse<MetalsResponse>> {
  const apiKey = process.env.METALS_API_KEY;

  // Без ключа секция на сайте просто скрывается — сайт не ломается.
  if (!apiKey) {
    return NextResponse.json({ available: false });
  }

  try {
    const url = `https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=USD&unit=toz`;
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });

    if (!res.ok) {
      return NextResponse.json({ available: false });
    }

    const data: unknown = await res.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ available: false });
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
      return NextResponse.json({ available: false });
    }

    return NextResponse.json({
      available: true,
      currency: body.currency ?? 'USD',
      unit: body.unit ?? 'toz',
      timestamp: body.timestamp ?? new Date().toISOString(),
      metals,
    });
  } catch {
    return NextResponse.json({ available: false });
  }
}
