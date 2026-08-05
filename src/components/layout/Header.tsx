'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Container from '@/components/ui/Container';
import type { Lang, Translation } from '@/i18n';

/** Убирает языковой префикс из пути, приводя его к «голому» русскому пути (/, /about, …). */
function stripLocale(pathname: string): string {
  if (pathname === '/kz' || pathname === '/ru') return '/';
  if (pathname.startsWith('/kz/') || pathname.startsWith('/ru/')) return pathname.slice(3);
  return pathname || '/';
}

export default function Header({ nav, lang }: { nav: Translation['nav']; lang: Lang }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // «Голый» путь без префикса — общий и для активной ссылки, и для переключателя языка.
  const bare = stripLocale(pathname);
  const base = lang === 'kz' ? '/kz' : '';

  const routes = [
    { name: nav.home, path: '' },
    { name: nav.about, path: '/about' },
    { name: nav.services, path: '/services' },
    { name: nav.solutions, path: '/solutions' },
    { name: nav.contacts, path: '/contacts' },
  ];

  const hrefFor = (path: string) => `${base}${path}` || '/';
  const isActive = (path: string) => (path === '' ? bare === '/' : bare.startsWith(path));

  // Переключатель языка: сохраняем текущую страницу, меняя только префикс.
  const ruHref = bare;
  const kzHref = bare === '/' ? '/kz' : `/kz${bare}`;
  const langLinks: { code: Lang; label: string; href: string }[] = [
    { code: 'ru', label: 'RU', href: ruHref },
    { code: 'kz', label: 'ҚАЗ', href: kzHref },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-950/85 backdrop-blur-md">
      <Container>
        <div className="flex items-center justify-between h-[72px]">
          <Link href={base || '/'} className="flex items-center" aria-label={nav.homeAriaLabel}>
            <Image
              src="/logo-figma.svg"
              alt="Metric Solutions"
              width={64}
              height={66}
              priority
              className="h-12 w-auto"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-10" aria-label={nav.primaryNavLabel}>
            {routes.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={hrefFor(item.path)}
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
            {langLinks.map(({ code, label, href }) => (
              <Link
                key={code}
                href={href}
                aria-pressed={lang === code}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
                  lang === code ? 'bg-blue-grad text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2.5 rounded-lg text-white hover:bg-white/10"
            aria-label={isMenuOpen ? nav.closeMenu : nav.openMenu}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-white/10" aria-label={nav.mobileNavLabel}>
            {routes.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={hrefFor(item.path)}
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
              {langLinks.map(({ code, label, href }) => (
                <Link
                  key={code}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  aria-pressed={lang === code}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                    lang === code ? 'bg-blue-grad text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </Container>
    </header>
  );
}
