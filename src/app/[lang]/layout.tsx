import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Oswald, Geologica, Montserrat } from 'next/font/google';
import '../globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TickerBar from '@/components/layout/TickerBar';
import WhatsAppWidget from '@/components/layout/WhatsAppWidget';
import { translations } from '@/i18n';
import type { Lang } from '@/i18n';
import { isLang, SITE_URL } from '@/i18n/seo';
import { getMetals } from '@/lib/metals';

// Узкий гротеск-капс с кириллицей — дисплейные заголовки (аналог Bebas Neue из макета)
const oswald = Oswald({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
  display: 'swap',
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
  return [{ lang: 'ru' }, { lang: 'kz' }];
}

// Любой язык вне списка выше → 404 (не рендерим динамически).
export const dynamicParams = false;

// Атрибут <html lang>: kz → kk (ISO 639-1 для казахского), ru → ru.
const HTML_LANG: Record<Lang, string> = { ru: 'ru', kz: 'kk' };

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
      <body className={`${oswald.variable} ${geologica.variable} ${montserrat.variable} font-sans`}>
        {/* Полоса котировок над шапкой: скроллится вместе со страницей,
            шапка ниже остаётся sticky. Данные запечены на сервере (кеш 12ч),
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
