// Codes stockés en base pour les allergènes et spécificités des plats.
// Les libellés FR/EN sont dans messages/*.json (clés Allergens.* et Tags.*).

/** Les 14 allergènes à déclaration obligatoire. */
export const ALLERGENS = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soy',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const TAGS = ['vegetarian', 'vegan', 'spicy', 'alcohol-free', 'to-share', 'local'] as const;
export type Tag = (typeof TAGS)[number];

export const isAllergen = (v: string): v is Allergen => (ALLERGENS as readonly string[]).includes(v);
export const isTag = (v: string): v is Tag => (TAGS as readonly string[]).includes(v);
