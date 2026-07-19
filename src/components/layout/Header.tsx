'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Container from '@/components/ui/Container';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'kz', label: 'ҚАЗ' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { lang, langCode, setLang } = useLanguage();
  const pathname = usePathname();

  const navigation = [
    { name: lang.nav.home, href: '/' },
    { name: lang.nav.about, href: '/about' },
    { name: lang.nav.services, href: '/services' },
    { name: lang.nav.solutions, href: '/solutions' },
    { name: lang.nav.contacts, href: '/contacts' },
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-950/85 backdrop-blur-md">
      <Container>
        <div className="flex items-center justify-between h-[72px]">
          <Link href="/" className="flex items-center" aria-label="Metric Solutions — на главную">
            <Image
              src="/logo-figma.svg"
              alt="Metric Solutions"
              width={64}
              height={66}
              priority
              className="h-12 w-auto"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-10" aria-label="Основная навигация">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-xs font-extralight tracking-[0.05em] transition-colors duration-200 ${
                    active
                      ? 'text-white border-b border-accent-500 pb-1'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-1 rounded-full border border-white/15 p-0.5">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                aria-pressed={langCode === code}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
                  langCode === code ? 'bg-blue-grad text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-white hover:bg-white/10"
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-white/10" aria-label="Мобильная навигация">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`block py-3 font-light transition-colors duration-200 ${
                    active ? 'text-accent-400' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            <div className="flex items-center gap-1 rounded-full border border-white/15 p-0.5 w-fit mt-3">
              {LANGS.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  aria-pressed={langCode === code}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                    langCode === code ? 'bg-blue-grad text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </Container>
    </header>
  );
}
