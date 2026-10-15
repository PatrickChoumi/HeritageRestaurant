// Accès direct aux dictionnaires hors du rendu React (e-mails, actions serveur, tests).
import { createTranslator } from 'next-intl';
import fr from '../../messages/fr.json';
import en from '../../messages/en.json';
import type { AppLocale } from './routing';

export const dictionaries = { fr, en } as const;

export function translator<N extends keyof typeof fr>(locale: AppLocale, namespace: N) {
  return createTranslator({ locale, messages: dictionaries[locale] as typeof fr, namespace });
}
