"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LOCALE_STORAGE_KEY, type Locale, translate } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectLocale(): Locale {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh")) return "zh-CN";
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === "zh-CN" || stored === "en" ? stored : detectLocale();
  });

  useEffect(() => {
    document.documentElement.lang = locale === "zh-CN" ? "zh-CN" : "en";
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next === "zh-CN" ? "zh-CN" : "en";
    window.dispatchEvent(new CustomEvent("heliosgen-locale-changed", { detail: next }));
  };

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    setLocale,
    t: (key, fallback) => translate(locale, key, fallback),
  }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
