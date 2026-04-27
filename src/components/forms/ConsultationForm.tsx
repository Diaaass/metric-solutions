'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
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
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.errorConn);
        return;
      }

      setIsSubmitted(true);
      setFormData({ name: '', email: '', phone: '', company: '', message: '' });

      setTimeout(() => setIsSubmitted(false), 5000);
    } catch {
      setError(t.errorConn);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-bold mb-6">{t.title}</h3>

      {isSubmitted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">{t.success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
            {t.nameLabel}
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
          <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
            Email *
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
          <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
            {t.phoneLabel}
          </label>
          <Input
            id="phone"
            type="tel"
            name="phone"
            placeholder={t.phonePlaceholder}
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-secondary-700 mb-2">
            {t.companyLabel}
          </label>
          <Input
            id="company"
            name="company"
            placeholder={t.companyPlaceholder}
            value={formData.company}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-2">
            {t.messageLabel}
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

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? t.submitting : t.submit}
        </Button>

        <p className="text-xs text-secondary-500 text-center">
          {t.privacyNote}
        </p>
      </form>
    </div>
  );
}
