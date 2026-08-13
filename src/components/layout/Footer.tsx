import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Container from '@/components/ui/Container';
import { contacts } from '@/data/contacts';
import type { Lang, Translation } from '@/i18n';

export default function Footer({
  nav,
  footer,
  address,
  lang,
}: {
  nav: Translation['nav'];
  footer: Translation['footer'];
  address: string;
  lang: Lang;
}) {
  const base = lang === 'en' ? '/en' : '';

  const navLinks = [
    { name: nav.about, href: `${base}/about` },
    { name: nav.services, href: `${base}/services` },
    { name: nav.solutions, href: `${base}/solutions` },
    { name: nav.contacts, href: `${base}/contacts` },
  ];

  return (
    <footer className="bg-ink-950 pt-10">
      {/* Скруглённая «плита» из макета (rounded-50, rgba(4,33,71,.9)) */}
      <div className="rounded-t-[50px] bg-ink-800/90">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-14">
            {/* Лого + подпись */}
            <div className="flex flex-col items-start gap-4">
              <Image
                src="/logo.svg"
                alt="Metric Solutions"
                width={304}
                height={313}
                className="h-24 w-auto"
              />
              <p className="font-card text-base font-light text-white">{footer.caption}</p>
            </div>

            {/* Навигация */}
            <div className="border-t border-[rgba(26,92,255,0.3)] pt-10 md:border-t-0 md:pt-0">
              <h4 className="font-card !text-base font-semibold mb-6">{footer.navTitle}</h4>
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
            <div className="border-t border-[rgba(26,92,255,0.3)] pt-10 md:border-t-0 md:pt-0">
              <h4 className="font-card !text-base font-semibold mb-6">{footer.servicesTitle}</h4>
              <ul className="space-y-4">
                {footer.services.map((s, i) => (
                  <li key={i}>
                    <Link
                      href={`${base}/services`}
                      className="font-card text-base font-light text-white hover:text-accent-300 transition-colors"
                    >
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Контакты */}
            <div className="border-t border-[rgba(26,92,255,0.3)] pt-10 md:border-t-0 md:pt-0">
              <h4 className="font-card !text-base font-semibold mb-6">{footer.contactsTitle}</h4>
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
                <li className="max-w-[220px]">{address}</li>
                <li>
                  <Link
                    href={`${base}/privacy`}
                    className="text-sm text-white/60 hover:text-accent-300 transition-colors"
                  >
                    {footer.privacyLabel}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
