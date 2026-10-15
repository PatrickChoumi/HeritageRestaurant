// Lecture de la carte en base, dans la langue demandée (repli sur le français).
import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { getDb } from '@/lib/db/client';
import { categories, categoryTranslations, dishTranslations, dishes, type Locale } from '@/lib/db/schema';
import { isAllergen, isTag, type Allergen, type Tag } from '@/lib/menu-codes';
import { imageFor } from '@/lib/images';

export interface MenuDish {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  allergens: Allergen[];
  tags: Tag[];
  isSignature: boolean;
  isAvailable: boolean;
  categorySlug: string;
}

export interface MenuCategory {
  id: number;
  slug: string;
  name: string;
  description: string;
  dishes: MenuDish[];
}

const ctLocal = alias(categoryTranslations, 'ct_local');
const ctFr = alias(categoryTranslations, 'ct_fr');
const dtLocal = alias(dishTranslations, 'dt_local');
const dtFr = alias(dishTranslations, 'dt_fr');

async function selectDishes(locale: Locale, onlySignatures: boolean) {
  const db = await getDb();
  return db
    .select({
      id: dishes.id,
      slug: dishes.slug,
      price: dishes.price,
      image: dishes.image,
      allergens: dishes.allergens,
      tags: dishes.tags,
      isSignature: dishes.isSignature,
      isAvailable: dishes.isAvailable,
      name: sql<string>`coalesce(${dtLocal.name}, ${dtFr.name}, ${dishes.slug})`,
      description: sql<string>`coalesce(${dtLocal.description}, ${dtFr.description}, '')`,
      categoryId: categories.id,
      categorySlug: categories.slug,
      categoryName: sql<string>`coalesce(${ctLocal.name}, ${ctFr.name}, ${categories.slug})`,
      categoryDescription: sql<string>`coalesce(${ctLocal.description}, ${ctFr.description}, '')`,
    })
    .from(categories)
    .leftJoin(dishes, eq(dishes.categoryId, categories.id))
    .leftJoin(ctLocal, and(eq(ctLocal.categoryId, categories.id), eq(ctLocal.locale, locale)))
    .leftJoin(ctFr, and(eq(ctFr.categoryId, categories.id), eq(ctFr.locale, 'fr')))
    .leftJoin(dtLocal, and(eq(dtLocal.dishId, dishes.id), eq(dtLocal.locale, locale)))
    .leftJoin(dtFr, and(eq(dtFr.dishId, dishes.id), eq(dtFr.locale, 'fr')))
    .where(onlySignatures ? eq(dishes.isSignature, true) : undefined)
    .orderBy(asc(categories.position), asc(categories.id), asc(dishes.position), asc(dishes.id));
}

type Row = Awaited<ReturnType<typeof selectDishes>>[number];

function toDish(row: Row): MenuDish | null {
  if (row.id === null) return null;
  return {
    id: row.id,
    slug: row.slug!,
    name: row.name,
    description: row.description,
    price: row.price!,
    image: row.image,
    allergens: (row.allergens ?? []).filter(isAllergen),
    tags: (row.tags ?? []).filter(isTag),
    isSignature: row.isSignature ?? false,
    isAvailable: row.isAvailable ?? true,
    categorySlug: row.categorySlug,
  };
}

export async function getMenu(locale: Locale): Promise<MenuCategory[]> {
  const rows = await selectDishes(locale, false);
  const byId = new Map<number, MenuCategory>();
  for (const row of rows) {
    let category = byId.get(row.categoryId);
    if (!category) {
      category = {
        id: row.categoryId,
        slug: row.categorySlug,
        name: row.categoryName,
        description: row.categoryDescription,
        dishes: [],
      };
      byId.set(row.categoryId, category);
    }
    const dish = toDish(row);
    if (dish) category.dishes.push(dish);
  }
  return [...byId.values()];
}

/** Plats signatures mis en avant sur l'accueil (avec photo, disponibles en priorité). */
export async function getSignatureDishes(locale: Locale, limit = 6): Promise<MenuDish[]> {
  const rows = await selectDishes(locale, true);
  return rows
    .map(toDish)
    .filter((d): d is MenuDish => d !== null && imageFor(d.image) !== null)
    .sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable))
    .slice(0, limit);
}
