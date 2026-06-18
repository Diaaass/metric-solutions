import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { LanguageProvider } from '@/contexts/LanguageContext';

const plexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-plex-mono',
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
      <body className={`${plexSans.variable} ${plexMono.variable} font-sans`}>
        <LanguageProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
