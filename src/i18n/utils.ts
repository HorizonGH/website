import type { AstroGlobal } from 'astro';

export type Locale = 'en' | 'es';

// Import translation files
import en from './en.json';
import es from './es.json';

const translations = { en, es };

export function getTranslations(locale: Locale) {
  return translations[locale] || translations['en'];
}

export function getLangFromUrl(url: URL): Locale {
  const [, lang] = url.pathname.split('/');
  if (lang === 'es' || lang === 'en') return lang as Locale;
  return 'en';
}

export function useTranslations(locale: Locale) {
  return getTranslations(locale);
}

export function getLocalePath(pathname: string, locale: Locale): string {
  const cleanPath = pathname.replace(/^\/(en|es)/, '');
  if (locale === 'en') return cleanPath;
  return `/es${cleanPath}`;
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'en' ? 'es' : 'en';
}

export function getLocaleFromUrl(url: URL): Locale {
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments[0] === 'es') return 'es';
  return 'en';
}
