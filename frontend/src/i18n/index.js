import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';

const LANGUAGE_CACHE_KEY = 'tco-user-language';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'pt'],
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: LANGUAGE_CACHE_KEY,
      lookupCookie: LANGUAGE_CACHE_KEY,
      cookieMinutes: 525600,
      cookieOptions: { path: '/', sameSite: 'lax' },
    },
  });

export default i18n;
