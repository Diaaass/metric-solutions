import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Container from '@/components/ui/Container';
import ConsultationForm from '@/components/forms/ConsultationForm';
import { Mail, Phone, MapPin, Clock, type LucideIcon } from 'lucide-react';
import { translations } from '@/i18n';
import { buildMetadata, isLang } from '@/i18n/seo';
import { contacts } from '@/data/contacts';

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  if (!isLang(params.lang)) return {};
  return buildMetadata(params.lang, 'contacts');
}

export default function ContactsPage({ params }: Props) {
  if (!isLang(params.lang)) notFound();
  const dict = translations[params.lang];
  const t = dict.contactsPage;

  const cards: Array<{ Icon: LucideIcon; label: string; content: React.ReactNode }> = [
    {
      Icon: Mail,
      label: t.emailLabel,
      content: (
        <a
          href={`mailto:${contacts.email}`}
          className="hover:text-accent-300 transition-colors break-all"
        >
          {contacts.email}
        </a>
      ),
    },
    {
      Icon: Phone,
      label: t.phoneLabel,
      content: (
        <a href={`tel:${contacts.phone}`} className="hover:text-accent-300 transition-colors">
          {contacts.phoneDisplay}
        </a>
      ),
    },
    {
      Icon: MapPin,
      label: t.officeLabel,
      content: <span>{t.addressText}</span>,
    },
    {
      Icon: Clock,
      label: t.hoursLabel,
      content: <span>{t.hoursText}</span>,
    },
  ];

  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-[20%] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-accent-500/10 blur-[150px]"
        aria-hidden="true"
      />

      <Container>
        <div className="relative pt-14 md:pt-20 pb-6">
          <p className="text-lg md:text-xl font-extralight text-white tracking-tight mb-5 animate-fade-in">
            {t.breadcrumb}
          </p>
          <h1 className="mb-5 animate-fade-in-up">{t.title}</h1>
          <p className="max-w-2xl text-base md:text-lg font-extralight text-white leading-relaxed tracking-tight animate-fade-in-up delay-100">
            {t.subtitle}
          </p>
        </div>

        {/* Оставить заявку */}
        <div className="relative pt-10 pb-6 animate-fade-in-up delay-200">
          <p className="eyebrow mb-8">{t.formTitle}</p>
          <div className="max-w-4xl">
            <ConsultationForm t={dict.form} />
          </div>
        </div>

        {/* Как связаться с нами */}
        <div className="relative pt-14 pb-24">
          <p className="eyebrow mb-8 animate-fade-in">{t.howTitle}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {cards.map(({ Icon, label, content }, i) => (
              <div
                key={i}
                className="card !p-6 flex items-start gap-5 animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
              >
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-grad text-white shadow-glow">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span>
                  <h3 className="!text-lg mb-1.5">{label}</h3>
                  <span className="block text-sm font-extralight text-white/90 leading-relaxed">
                    {content}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
