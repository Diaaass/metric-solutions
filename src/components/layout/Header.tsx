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
    <header className="bg-white/85 backdrop-blur-md border-b border-secondary-200 sticky top-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center" aria-label="Metric Solutions — на главную">
            <Image
              src="/logo.png"
              alt="Metric Solutions"
              width={216}
              height={160}
              priority
              className="h-11 w-auto md:h-12"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Основная навигация">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative text-sm font-medium tracking-wide transition-colors duration-200 ${
                    active ? 'text-primary-900' : 'text-secondary-700 hover:text-primary-900'
                  } after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:rounded-full after:bg-metal after:transition-all after:duration-200 ${
                    active ? 'after:w-full' : 'after:w-0 hover:after:w-full'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-1 rounded-md border border-secondary-200 p-0.5">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                aria-pressed={langCode === code}
                className={`px-3 py-1 rounded font-mono text-xs font-semibold transition-all duration-150 ${
                  langCode === code
                    ? 'bg-primary-900 text-white'
                    : 'text-secondary-600 hover:text-primary-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-secondary-100"
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-primary-900" />
            ) : (
              <Menu className="h-6 w-6 text-primary-900" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <nav
            className="md:hidden py-4 border-t border-secondary-200"
            aria-label="Мобильная навигация"
          >
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`block py-3 font-medium transition-colors duration-200 ${
                    active ? 'text-primary-900' : 'text-secondary-700 hover:text-primary-900'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            <div className="flex items-center gap-1 rounded-md border border-secondary-200 p-0.5 w-fit mt-3">
              {LANGS.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  aria-pressed={langCode === code}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-semibold transition-all duration-150 ${
                    langCode === code
                      ? 'bg-primary-900 text-white'
                      : 'text-secondary-600 hover:text-primary-900'
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
