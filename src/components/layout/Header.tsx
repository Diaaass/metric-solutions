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
  { code: 'kz', label: 'KZ' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { lang, langCode, setLang } = useLanguage();
  const pathname = usePathname();

  const navigation = [
    { name: lang.nav.home, href: '/' },
    { name: lang.nav.about, href: '/about' },
    { name: lang.nav.services, href: '/services' },
    { name: lang.nav.projects, href: '/projects' },
    { name: lang.nav.team, href: '/team' },
    { name: lang.nav.contacts, href: '/contacts' },
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-secondary-200/60 sticky top-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="Metric Solution — на главную">
            <Image
              src="/logo.png"
              alt="Metric Solution"
              width={216}
              height={160}
              priority
              className="h-12 w-auto md:h-14"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative font-medium transition-colors duration-200 ${
                    active ? 'text-primary-600' : 'text-secondary-700 hover:text-primary-600'
                  } after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-primary-600 after:transition-all after:duration-200 ${
                    active ? 'after:w-full' : 'after:w-0 hover:after:w-full'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="hidden md:flex items-center gap-1 bg-secondary-100 rounded-lg p-1">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`px-3 py-1 rounded-md text-sm font-semibold transition-all duration-150 ${
                  langCode === code
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-secondary-600 hover:text-secondary-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary-100"
            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-secondary-700" />
            ) : (
              <Menu className="h-6 w-6 text-secondary-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-secondary-200">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`block py-3 font-medium transition-colors duration-200 ${
                    active ? 'text-primary-600' : 'text-secondary-700 hover:text-primary-600'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* Mobile language switcher */}
            <div className="flex items-center gap-1 bg-secondary-100 rounded-lg p-1 w-fit mt-3">
              {LANGS.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-150 ${
                    langCode === code
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-secondary-600 hover:text-secondary-900'
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
