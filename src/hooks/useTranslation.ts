// hooks/useTranslation.ts

import { useLanguage } from "@/contexts/language-context";
import en from "@/locales/en.json";
import ru from "@/locales/ru.json";

type Translations = {
  en: typeof en;
  ru: typeof ru;
};

const translations: Translations = {
  en,
  ru,
};

type Language = keyof Translations;

export function useTranslation() {
  const { language = "en" } = useLanguage();

  const currentLanguage = (
    language in translations ? language : "en"
  ) as Language;

  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split(".");
    let value: any = translations[currentLanguage];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    let result = value;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        const regex = new RegExp(`{{${paramKey}}}`, "g");
        result = result.replace(regex, String(paramValue));
      });
    }

    return result;
  };

  return { t };
}
