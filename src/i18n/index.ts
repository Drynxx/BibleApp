import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import ro from './locales/ro.json';

const resources = {
  en: { translation: en },
  ro: { translation: ro }
};

// Auto-detect language
const getDeviceLanguage = () => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const langCode = locales[0].languageCode;
    // Default to 'ro' if device is Romanian, else 'en'
    return langCode === 'ro' ? 'ro' : 'en';
  }
  return 'en'; // fallback
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(), // initial language based on OS
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    },
    compatibilityJSON: 'v4'
  });

export default i18n;
