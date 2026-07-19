import type { Metadata } from 'next';
import { Oswald, Geologica, Montserrat } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Узкий гротеск-капс с кириллицей — дисплейные заголовки (аналог Bebas Neue из макета)
const oswald = Oswald({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
  display: 'swap',
});

// Основной текст (Geologica из макета)
const geologica = Geologica({
  weight: ['200', '300', '400', '500', '600'],
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
  title: 'Metric Solutions — геометаллургия, обогащение и гидрометаллургия',
  description:
    'Metric Solutions — инженерно-консалтинговая компания для горнодобывающей и металлургической промышленности: геометаллургия, обогащение полезных ископаемых, флотация, гидрометаллургия, лабораторные и пилотные испытания. Собственные мобильные решения NomadLab и Nomad Pilot Plant.',
  keywords:
    'геометаллургия, обогащение полезных ископаемых, флотация, гидрометаллургия, технологический аудит, лабораторные исследования, пилотные испытания, горно-металлургический консалтинг, NomadLab',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${oswald.variable} ${geologica.variable} ${montserrat.variable} font-sans`}>
        <LanguageProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
