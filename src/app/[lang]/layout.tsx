import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Geologica, Montserrat } from 'next/font/google';
import localFont from 'next/font/local';
import '../globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TickerBar from '@/components/layout/TickerBar';
import WhatsAppWidget from '@/components/layout/WhatsAppWidget';
import { translations } from '@/i18n';
import type { Lang } from '@/i18n';
import { buildOrgJsonLd, isLang, SITE_URL } from '@/i18n/seo';
import { getMetals } from '@/lib/metals';

/**
 * Дисплейные заголовки — Bebas Neue Cyrillic (файл заказчика).
 * Официальный Bebas Neue кириллицы не содержит вовсе, поэтому берём
 * кириллическую адаптацию и раздаём локально: подмножество latin+cyrillic
 * в woff2 — 16 КБ вместо 72 КБ исходного ttf.
 *
 * Начертание одно (Regular). adjustFontFallback отключён: Next по умолчанию
 * подбирает метрики системного фолбэка, а у сверхузкого капса подстановка
 * даёт заметный скачок ширины при подмене.
 */
const bebas = localFont({
  src: '../../fonts/bebas-neue-cyrillic.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '400',
  style: 'normal',
  adjustFontFallback: false,
  fallback: ['Oswald', 'Arial Narrow', 'sans-serif'],
});

// Основной текст (Geologica из макета)
const geologica = Geologica({
  weight: ['100', '200', '300', '400', '500', '600'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

// Текст карточек и футера (Montserrat из макета)
const montserrat = Montserrat({
  weight: ['300', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-card',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export function generateStaticParams() {
  return [{ lang: 'ru' }, { lang: 'en' }];
}

// Любой язык вне списка выше → 404 (не рендерим динамически).
export const dynamicParams = false;

// Атрибут <html lang> совпадает с кодом локали в URL.
const HTML_LANG: Record<Lang, string> = { ru: 'ru', en: 'en' };

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  if (!isLang(params.lang)) notFound();
  const lang = params.lang;
  const t = translations[lang];
  const metals = await getMetals();

  return (
    <html lang={HTML_LANG[lang]}>
      <body className={`${bebas.variable} ${geologica.variable} ${montserrat.variable} font-sans`}>
        {/* JSON-LD Organization: собирается из констант, ввода пользователя нет */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildOrgJsonLd(lang) }}
        />
        {/* Полоса котировок над шапкой: скроллится вместе со страницей,
            шапка ниже остаётся sticky. Данные запечены на сервере (кеш 24ч),
            поэтому цены видны с первого кадра; без ключа полоса не рендерится. */}
        <TickerBar t={t.metals} langCode={lang} data={metals} />
        <Header nav={t.nav} lang={lang} />
        <main className="min-h-screen">{children}</main>
        <Footer nav={t.nav} footer={t.footer} address={t.contactsPage.addressText} lang={lang} />
        <WhatsAppWidget ariaLabel={t.whatsapp.ariaLabel} />
      </body>
    </html>
  );
}
