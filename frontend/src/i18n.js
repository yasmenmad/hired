import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enLocales from './locales/en.json';
import frLocales from './locales/fr.json';
import arLocales from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enLocales },
      fr: { translation: frLocales },
      ar: { translation: arLocales },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
  });

export default i18n;
