import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bnTranslation from './locales/bn.js';
import enTranslation from './locales/en.js';
import guTranslation from './locales/gu.js';
import hiTranslation from './locales/hi.js';
import mrTranslation from './locales/mr.js';
import paTranslation from './locales/pa.js';
import taTranslation from './locales/ta.js';
import teTranslation from './locales/te.js';
import billingTranslations from './billingTranslations';

const withBillingTranslations = (translation, language) => ({
  ...translation,
  invoices: { ...translation.invoices, ...billingTranslations[language].invoices },
  payments: { ...translation.payments, ...billingTranslations[language].payments },
});

const resources = {
  bn: { translation: withBillingTranslations(bnTranslation, 'bn') },
  en: { translation: withBillingTranslations(enTranslation, 'en') },
  gu: { translation: withBillingTranslations(guTranslation, 'gu') },
  hi: { translation: withBillingTranslations(hiTranslation, 'hi') },
  mr: { translation: withBillingTranslations(mrTranslation, 'mr') },
  pa: { translation: withBillingTranslations(paTranslation, 'pa') },
  ta: { translation: withBillingTranslations(taTranslation, 'ta') },
  te: { translation: withBillingTranslations(teTranslation, 'te') },
};

const LANGUAGE_KEY = 'app_language';

const initI18n = async () => {
  let savedLanguage = 'en';
  try {
    const value = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (value !== null) {
      savedLanguage = value;
    }
  } catch (error) {
    console.error('Failed to load language', error);
  }

  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      supportedLngs: ['en', 'hi', 'mr', 'bn', 'ta', 'te', 'gu', 'pa'],
      load: 'languageOnly',
      interpolation: {
        escapeValue: false,
      },
    });
};

initI18n();

export default i18n;
