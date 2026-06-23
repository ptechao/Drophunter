import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'zh-TW' | 'zh-CN' | 'en';

const STORAGE_KEY = 'drophunter_lang';

export const LanguageContext = createContext<{
  language: Language;
  setLanguage: (l: Language) => void;
}>({
  language: 'zh-TW',
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Language) || 'zh-TW';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  return useContext(LanguageContext);
}
