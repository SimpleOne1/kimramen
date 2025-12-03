
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ruCommon from "./locales/ru/common.json";
import enCommon from "./locales/en/common.json";

const resources = {
  ru: {
    common: ruCommon,
  },
  en: {
    common: enCommon,
  },
} as const;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "ru",
    fallbackLng: "ru",
    defaultNS: "common",
    ns: ["common"],
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;