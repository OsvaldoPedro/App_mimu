import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import pt from './locales/pt.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import zh from './locales/zh.json'

const resources = {
  pt: { translation: pt },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  zh: { translation: zh }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('mimu_lang') || 'pt',
    fallbackLng: 'pt',
    interpolation: { escapeValue: false }
  })

export default i18n
