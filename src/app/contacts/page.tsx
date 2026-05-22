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
        <a href={`mailto:${contacts.email}`} className="text-primary-600 hover:text-primary-700">
          {contacts.email}
        </a>
      ),
    },
    {
      Icon: Phone,
      label: t.phoneLabel,
      content: (
        <a href={`tel:${contacts.phone}`} className="text-primary-600 hover:text-primary-700">
          {contacts.phoneDisplay}
        </a>
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
      <section className="bg-gradient-to-br from-secondary-900 to-primary-700 text-white py-20">
        <Container>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">{t.heroTitle}</h1>
          <p className="text-xl text-secondary-200 max-w-3xl animate-fade-in-up delay-200">
            {t.heroSubtitle}
          </p>
        </Container>
      </section>

      <section className="section-padding bg-secondary-50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="animate-fade-in-up delay-100">
              <h2 className="text-3xl font-bold mb-8">{t.howTitle}</h2>

              <div className="space-y-6 mb-12">
                {contactItems.map(({ Icon, label, content }, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 animate-fade-in-up"
                    style={{ animationDelay: `${(i + 1) * 100}ms` }}
                  >
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{label}</h3>
                      {content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-secondary-50 p-6 rounded-xl animate-fade-in delay-400">
                <h3 className="font-semibold mb-3">{t.infoTitle}</h3>
                <ul className="space-y-2 text-sm text-secondary-700">
                  {t.infoItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary-600 font-bold">•</span>
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
