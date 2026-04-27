'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Container from '@/components/ui/Container';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'kz', label: 'ҚЗ' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { lang, langCode, setLang } = useLanguage();

  const navigation = [
    { name: lang.nav.home, href: '/' },
    { name: lang.nav.about, href: '/about' },
    { name: lang.nav.services, href: '/services' },
    { name: lang.nav.projects, href: '/projects' },
    { name: lang.nav.team, href: '/team' },
    { name: lang.nav.contacts, href: '/contacts' },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary-600">Metric Solution</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-secondary-700 hover:text-primary-600 transition-colors duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}
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
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block py-3 text-secondary-700 hover:text-primary-600 transition-colors duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}

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
