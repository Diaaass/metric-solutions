'use client';

import React from 'react';
import Container from '@/components/ui/Container';
import ConsultationForm from '@/components/forms/ConsultationForm';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { contacts } from '@/data/contacts';

export default function ContactsPage() {
  const { lang } = useLanguage();
  const t = lang.contactsPage;

  const contactItems = [
    {
      Icon: Mail,
      label: t.emailLabel,
      content: (
        <a
          href={`mailto:${contacts.email}`}
          className="text-accent-600 hover:text-accent-700 break-all"
        >
          {contacts.email}
        </a>
      ),
    },
    {
      Icon: Phone,
      label: t.phoneLabel,
      content: contacts.phone ? (
        <a href={`tel:${contacts.phone}`} className="text-accent-600 hover:text-accent-700">
          {contacts.phoneDisplay}
        </a>
      ) : (
        <span className="text-secondary-500">{contacts.phoneDisplay}</span>
      ),
    },
    {
      Icon: MapPin,
      label: t.addressLabel,
      content: <p className="text-secondary-700">{t.addressText}</p>,
    },
    {
      Icon: Clock,
      label: t.hoursLabel,
      content: <p className="text-secondary-700 whitespace-pre-line">{t.hoursText}</p>,
    },
  ];

  return (
    <div className="bg-white">
      <section className="relative bg-secondary-50 border-b border-secondary-200">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <Container>
          <div className="relative py-16 md:py-24 max-w-3xl">
            <p className="eyebrow mb-5 animate-fade-in-up">{lang.nav.contacts}</p>
            <h1 className="mb-6 animate-fade-in-up delay-100">{t.heroTitle}</h1>
            <p className="text-lg md:text-xl text-secondary-600 leading-relaxed animate-fade-in-up delay-200">
              {t.heroSubtitle}
            </p>
          </div>
        </Container>
      </section>

      <section className="section-padding bg-secondary-50 bg-grid">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="animate-fade-in-up delay-100">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-primary-900">{t.howTitle}</h2>

              <div className="space-y-5 mb-10">
                {contactItems.map(({ Icon, label, content }, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 bg-white border border-secondary-200 rounded-lg p-5 animate-fade-in-up"
                    style={{ animationDelay: `${(i + 1) * 80}ms` }}
                  >
                    <div className="w-11 h-11 bg-primary-50 rounded-md flex items-center justify-center flex-shrink-0 text-primary-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-primary-900">{label}</h3>
                      {content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-l-2 border-accent-500 bg-white p-6 rounded-r-lg animate-fade-in delay-400">
                <h3 className="font-semibold mb-3 text-primary-900">{t.infoTitle}</h3>
                <ul className="space-y-2 text-sm text-secondary-700">
                  {t.infoItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-accent-500 font-bold leading-6">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="animate-fade-in-up delay-200">
              <ConsultationForm />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
