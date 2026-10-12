import { messages } from './messages';
import type { Locale } from './translations';

let activeLocale: Locale = 'en';

export function setActiveLocale(locale: Locale) {
  activeLocale = locale;
}

// English text is the key. Anything without a translation falls back to the English text itself.
export function tr(text: string, values?: Record<string, string | number>) {
  const translated = activeLocale === 'en' ? text : messages[activeLocale][text] ?? text;
  if (!values) return translated;
  return translated.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));
}

// Saraiki has no browser date format of its own, so it shares the Urdu one.
export function dateLocale() {
  return activeLocale === 'en' ? 'en' : 'ur-PK';
}
