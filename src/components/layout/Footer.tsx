'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Container from '@/components/ui/Container';
import { useLanguage } from '@/contexts/LanguageContext';
import { contacts } from '@/data/contacts';

export default function Footer() {
  const { lang } = useLanguage();

  const navLinks = [
    { name: lang.nav.about, href: '/about' },
    { name: lang.nav.services, href: '/services' },
    { name: lang.nav.solutions, href: '/solutions' },
    { name: lang.nav.contacts, href: '/contacts' },
  ];

  return (
    <footer className="bg-ink-950 pt-10">
      {/* Скруглённая «плита» из макета (rounded-50, rgba(4,33,71,.9)) */}
      <div className="rounded-t-[50px] bg-ink-800/90">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-14">
            {/* Лого + подпись */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <Image
                src="/logo-figma.svg"
                alt="Metric Solutions"
                width={96}
                height={99}
                className="h-24 w-auto"
              />
              <p className="font-card text-base font-light text-white">{lang.footer.caption}</p>
            </div>

            {/* Навигация */}
            <div>
              <h4 className="font-card !text-base font-semibold mb-6">{lang.footer.navTitle}</h4>
              <ul className="space-y-4">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-card text-base font-light text-white hover:text-accent-300 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Направления */}
            <div>
              <h4 className="font-card !text-base font-semibold mb-6">
                {lang.footer.servicesTitle}
              </h4>
              <ul className="space-y-4">
                {lang.footer.services.map((s, i) => (
                  <li key={i}>
                    <Link
                      href="/services"
                      className="font-card text-base font-light text-white hover:text-accent-300 transition-colors"
                    >
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Контакты */}
            <div>
              <h4 className="font-card !text-base font-semibold mb-6">
                {lang.footer.contactsTitle}
              </h4>
              <ul className="space-y-4 font-card text-base font-light text-white">
                <li>
                  <a
                    href={`mailto:${contacts.email}`}
                    className="hover:text-accent-300 transition-colors break-all"
                  >
                    {contacts.email}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${contacts.phone}`}
                    className="hover:text-accent-300 transition-colors"
                  >
                    {contacts.phoneDisplay}
                  </a>
                </li>
                <li className="max-w-[220px]">{lang.contactsPage.addressText}</li>
              </ul>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
