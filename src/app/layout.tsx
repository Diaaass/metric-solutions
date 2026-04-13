import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Metric Solution - Геометаллургия и обогащение руд',
  description: 'Профессиональные решения в области геометаллургии, баланса металлов и исследования руд для обогатительных фабрик и горно-металлургических комбинатов',
  keywords: 'геометаллургия, баланс металлов, исследование руды, обогащение руд, металлургия',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
