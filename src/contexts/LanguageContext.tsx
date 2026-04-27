'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from '@/i18n';
import type { Lang, Translation } from '@/i18n';

interface LanguageContextType {
  lang: Translation;
  langCode: Lang;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [langCode, setLangCode] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('lang') as Lang) ?? 'ru';
    }
    return 'ru';
  });

  const setLang = (l: Lang) => {
    setLangCode(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', l);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang: translations[langCode], langCode, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
