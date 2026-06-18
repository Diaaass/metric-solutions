'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin } from 'lucide-react';
import Container from '@/components/ui/Container';
import { useLanguage } from '@/contexts/LanguageContext';
import { contacts } from '@/data/contacts';

const FOOTER_SERVICE_COUNT = 6;

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { lang } = useLanguage();

  const navLinks = [
    { name: lang.nav.about, href: '/about' },
    { name: lang.nav.services, href: '/services' },
    { name: lang.nav.solutions, href: '/solutions' },
    { name: lang.nav.contacts, href: '/contacts' },
  ];

  return (
    <footer className="bg-primary-950 text-white">
      <Container>
        <div className="py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="inline-flex rounded-lg bg-white p-3 mb-5">
              <Image
                src="/logo.png"
                alt="Metric Solutions"
                width={800}
                height={593}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-secondary-300 text-sm leading-relaxed">{lang.footer.description}</p>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.16em] text-accent-400 mb-4">
              {lang.footer.navTitle}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-secondary-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.16em] text-accent-400 mb-4">
              {lang.footer.servicesTitle}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {lang.servicesData.slice(0, FOOTER_SERVICE_COUNT).map((s) => (
                <li key={s.slug}>
                  <Link
                    href="/services"
                    className="text-secondary-300 hover:text-white transition-colors"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.16em] text-accent-400 mb-4">
              {lang.footer.contactsTitle}
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Mail className="h-5 w-5 text-accent-400 flex-shrink-0 mt-0.5" />
                <a
                  href={`mailto:${contacts.email}`}
                  className="text-secondary-300 hover:text-white transition-colors break-all"
                >
                  {contacts.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="h-5 w-5 text-accent-400 flex-shrink-0 mt-0.5" />
                {contacts.phone ? (
                  <a
                    href={`tel:${contacts.phone}`}
                    className="text-secondary-300 hover:text-white transition-colors"
                  >
                    {contacts.phoneDisplay}
                  </a>
                ) : (
                  <span className="text-secondary-400">{contacts.phoneDisplay}</span>
                )}
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-5 w-5 text-accent-400 flex-shrink-0 mt-0.5" />
                <span className="text-secondary-300">{lang.contactsPage.addressText}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-6">
          <p className="text-sm text-secondary-400">
            &copy; {currentYear} ТОО «Metric Solutions». {lang.footer.rights}
          </p>
        </div>
      </Container>
    </footer>
  );
}
