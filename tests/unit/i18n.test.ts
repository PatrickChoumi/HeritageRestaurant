import { describe, expect, it } from 'vitest';
import { parse, TYPE, type MessageFormatElement } from '@formatjs/icu-messageformat-parser';
import { createTranslator } from 'next-intl';
import fr from '../../messages/fr.json';
import en from '../../messages/en.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? { ...acc, [path]: value } : { ...acc, ...flatten(value, path) };
  }, {});
}

const frKeys = flatten(fr as Tree);
const enKeys = flatten(en as Tree);

describe('traductions', () => {
  it('le français et l’anglais ont exactement les mêmes clés', () => {
    expect(Object.keys(enKeys).sort()).toEqual(Object.keys(frKeys).sort());
  });

  it('aucune traduction n’est vide', () => {
    for (const [key, value] of [...Object.entries(frKeys), ...Object.entries(enKeys)]) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('les deux langues utilisent les mêmes variables et les mêmes balises', () => {
    const collect = (elements: MessageFormatElement[], out = new Set<string>()): Set<string> => {
      for (const el of elements) {
        if (el.type === TYPE.literal || el.type === TYPE.pound) continue;
        out.add(el.type === TYPE.tag ? `<${el.value}>` : el.value);
        if (el.type === TYPE.tag) collect(el.children, out);
        if (el.type === TYPE.select || el.type === TYPE.plural)
          for (const option of Object.values(el.options)) collect(option.value, out);
      }
      return out;
    };
    const vars = (message: string) => [...collect(parse(message))].sort();
    for (const key of Object.keys(frKeys)) expect(vars(enKeys[key]!), key).toEqual(vars(frKeys[key]!));
  });

  it('chaque message ICU se formate sans erreur', () => {
    const values = {
      count: 2,
      max: 10,
      days: 60,
      minutes: 60,
      name: 'Aïcha',
      email: 'a@b.c',
      date: 'samedi',
      time: '20h',
      reference: 'HER-ABC234',
      guests: 3,
      phone: '+237',
      seats: 64,
      index: 1,
      current: 1,
      total: 3,
      caption: 'x',
      year: 2026,
      day: 'lundi',
      service: 'dinner',
    };
    for (const [locale, messages] of [
      ['fr', fr],
      ['en', en],
    ] as const) {
      const errors: string[] = [];
      const t = createTranslator({ locale, messages, onError: (e) => errors.push(e.message) });
      for (const key of Object.keys(locale === 'fr' ? frKeys : enKeys)) {
        const tags = { br: () => '', em: (c: string) => c, link: (c: string) => c };
        // t.markup accepte les balises (<br>, <em>, <link>) et renvoie une chaîne
        (t as unknown as { markup: (key: string, values: object) => string }).markup(key, { ...values, ...tags });
      }
      expect(errors, locale).toEqual([]);
    }
  });
});
