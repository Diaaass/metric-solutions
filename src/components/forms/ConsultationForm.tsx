'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ContactFormData } from '@/types';

export default function ConsultationForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Здесь будет логика отправки формы
    console.log('Form submitted:', formData);
    
    // Показываем сообщение об успехе
    setIsSubmitted(true);
    
    // Сбрасываем форму
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: ''
    });

    // Скрываем сообщение через 5 секунд
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-bold mb-6 text-secondary-900">Заказать консультацию</h3>
      
      {isSubmitted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
            Имя *
          </label>
          <Input
            name="name"
            placeholder="Ваше имя"
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
            type="email"
            name="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
            Телефон *
          </label>
          <Input
            type="tel"
            name="phone"
            placeholder="+7 (___) ___-__-__"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-secondary-700 mb-2">
            Компания
          </label>
          <Input
            name="company"
            placeholder="Название компании"
            value={formData.company}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-2">
            Сообщение *
          </label>
          <textarea
            name="message"
            rows={4}
            placeholder="Расскажите о вашем проекте..."
            value={formData.message}
            onChange={handleChange}
            required
            className="input-field resize-none"
          />
        </div>

        <Button type="submit" variant="primary" className="w-full">
          Отправить заявку
        </Button>

        <p className="text-xs text-secondary-500 text-center">
          Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
        </p>
      </form>
    </div>
  );
}
