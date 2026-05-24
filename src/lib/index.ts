import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from '../languages/es.json';
import en from '../languages/en.json';
import fr from '../languages/fr.json';
import de from '../languages/de.json';

export type SupportedLanguage = 'es' | 'en' | 'fr' | 'de';

export const SUPPORTED_LANGUAGES: {
  code: SupportedLanguage;
  label: string;
  flag: string;
}[] = [
  { code: 'es', label: 'Español',  flag: '🇲🇽' },
  { code: 'en', label: 'English',  flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',  flag: '🇩🇪' },
];

const STORAGE_KEY = 'flujo_language';

function getStoredLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['es', 'en', 'fr', 'de'].includes(stored)) {
      return stored as SupportedLanguage;
    }
  } catch {
    // localStorage not available
  }
  return 'es';
}

export function setStoredLanguage(lang: SupportedLanguage) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;