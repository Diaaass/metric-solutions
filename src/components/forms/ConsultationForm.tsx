'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Input from '@/components/ui/Input';
import { ContactFormData } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ConsultationForm() {
  const { lang } = useLanguage();
  const t = lang.form;

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [website, setWebsite] = useState('');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const PHONE_PREFIX = '+7 (';

  // Цифры абонента без кода страны (10 цифр максимум)
  const phoneDigits = (value: string): string => {
    let digits = value.replace(/\D/g, '');
    if (digits[0] === '7' || digits[0] === '8') digits = digits.slice(1);
    return digits.slice(0, 10);
  };

  // Маска +7 (XXX) XXX XXXX. Префикс «+7 (» не стирается.
  const formatPhone = (raw: string): string => {
    const d = phoneDigits(raw);
    let out = PHONE_PREFIX + d.slice(0, 3);
    if (d.length >= 3) out += ')';
    if (d.length > 3) out += ' ' + d.slice(3, 6);
    if (d.length > 6) out += ' ' + d.slice(6, 10);
    return out;
  };

  const isPhoneValid = (value: string): boolean => phoneDigits(value).length === 10;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const formatted = formatPhone(value);
      setFormData((prev) => ({ ...prev, phone: formatted }));
      if (phoneError && isPhoneValid(formatted)) setPhoneError(false);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneFocus = () => {
    if (!formData.phone) {
      setFormData((prev) => ({ ...prev, phone: PHONE_PREFIX }));
    }
  };

  const handlePhoneBlur = () => {
    if (phoneDigits(formData.phone).length === 0) {
      setFormData((prev) => ({ ...prev, phone: '' }));
      setPhoneError(false);
      return;
    }
    if (!isPhoneValid(formData.phone)) setPhoneError(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPhoneValid(formData.phone)) {
      setPhoneError(true);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, website }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.errorConn);
        return;
      }

      setIsSubmitted(true);
      setFormData({ name: '', email: '', phone: '', company: '', message: '' });
      setPhoneError(false);
    } catch {
      setError(t.errorConn);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => setIsSubmitted(false);

  useEffect(() => {
    if (!isSubmitted) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isSubmitted]);

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-300 font-medium">{error}</p>
        </div>
      )}

      {/* Раскладка формы из макета: имя|компания, email, телефон, сообщение, кнопка */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-10000px',
            top: 'auto',
            width: 1,
            height: 1,
            overflow: 'hidden',
          }}
        >
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="sr-only">
              {t.namePlaceholder}
            </label>
            <Input
              id="name"
              name="name"
              placeholder={t.namePlaceholder}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="company" className="sr-only">
              {t.companyPlaceholder}
            </label>
            <Input
              id="company"
              name="company"
              placeholder={t.companyPlaceholder}
              value={formData.company}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="sr-only">
            {t.emailPlaceholder}
          </label>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder={t.emailPlaceholder}
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="sr-only">
            {t.phonePlaceholder}
          </label>
          <Input
            id="phone"
            type="tel"
            name="phone"
            inputMode="tel"
            autoComplete="tel"
            maxLength={17}
            placeholder={t.phonePlaceholder}
            value={formData.phone}
            onChange={handleChange}
            onFocus={handlePhoneFocus}
            onBlur={handlePhoneBlur}
            invalid={phoneError}
            required
          />
          {phoneError && (
            <p id="phone-error" role="alert" className="mt-2 text-sm text-red-400">
              {t.errorPhone}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="sr-only">
            {t.messagePlaceholder}
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder={t.messagePlaceholder}
            value={formData.message}
            onChange={handleChange}
            required
            className="input-field resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-blue-grad py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-white transition-all hover:brightness-110 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        >
          {isLoading ? t.submitting : t.submit}
        </button>

        <p className="text-xs font-extralight text-white/60 text-center">{t.privacyNote}</p>
      </form>

      {mounted &&
        isSubmitted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="thx-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
            onClick={closeModal}
          >
            <div
              className="relative rounded-2xl border border-[rgba(26,92,255,0.5)] bg-ink-800 shadow-card-glow max-w-md w-full p-8 text-center animate-[fadeIn_0.25s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeModal}
                aria-label={t.close}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/15">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0088ff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h4 id="thx-title" className="mb-2 !text-2xl">
                {t.successTitle}
              </h4>
              <p className="font-extralight text-white/80 mb-6">{t.success}</p>

              <button type="button" onClick={closeModal} className="btn-primary w-full">
                {t.close}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
