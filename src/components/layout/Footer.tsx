'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import Container from '@/components/ui/Container';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { lang } = useLanguage();

  return (
    <footer className="bg-secondary-900 text-white">
      <Container>
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold mb-4 text-white">Metric Solution</h3>
            <p className="text-secondary-300 text-sm">
              {lang.footer.description}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">{lang.footer.navTitle}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-secondary-300 hover:text-primary-400 transition-colors">{lang.nav.about}</Link></li>
              <li><Link href="/services" className="text-secondary-300 hover:text-primary-400 transition-colors">{lang.nav.services}</Link></li>
              <li><Link href="/projects" className="text-secondary-300 hover:text-primary-400 transition-colors">{lang.nav.projects}</Link></li>
              <li><Link href="/team" className="text-secondary-300 hover:text-primary-400 transition-colors">{lang.nav.team}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">{lang.footer.servicesTitle}</h4>
            <ul className="space-y-2 text-sm">
              {lang.servicesData.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className="text-secondary-300 hover:text-primary-400 transition-colors">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">{lang.footer.contactsTitle}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <a href="mailto:info@metricsolution.com" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  info@metricsolution.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <a href="tel:+77172000000" className="text-secondary-300 hover:text-primary-400 transition-colors">
                  +7 (717) 200-00-00
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <span className="text-secondary-300">
                  {lang.contactsPage.addressText}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-secondary-400">
            <p>&copy; {currentYear} Metric Solution. {lang.footer.rights}</p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
