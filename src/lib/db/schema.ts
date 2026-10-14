// Schéma SQL (PostgreSQL) : carte, traductions, réservations, contact, administration.
// Les migrations sont générées dans /drizzle avec `npm run db:generate`.
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const localeEnum = pgEnum('locale', ['fr', 'en']);
export const serviceEnum = pgEnum('service', ['lunch', 'dinner']);
export const reservationStatusEnum = pgEnum('reservation_status', [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]);

export type Locale = (typeof localeEnum.enumValues)[number];
export type ReservationStatus = (typeof reservationStatusEnum.enumValues)[number];

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ----------------------------------------------------------------- Carte */

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  position: integer('position').notNull().default(0),
  ...timestamps,
});

export const categoryTranslations = pgTable(
  'category_translations',
  {
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    description: text('description').notNull().default(''),
  },
  (t) => [primaryKey({ columns: [t.categoryId, t.locale] })],
);

export const dishes = pgTable(
  'dishes',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    slug: varchar('slug', { length: 80 }).notNull().unique(),
    /** Prix en francs CFA (entier). */
    price: integer('price').notNull(),
    /** Clé d'une image de la bibliothèque (src/lib/images.ts), ex. « plats/ndole ». */
    image: varchar('image', { length: 200 }),
    /** Codes des 14 allergènes réglementaires (voir src/lib/menu-codes.ts). */
    allergens: text('allergens')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** Spécificités : vegetarian, vegan, spicy, alcohol-free, to-share… */
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    isSignature: boolean('is_signature').notNull().default(false),
    isAvailable: boolean('is_available').notNull().default(true),
    position: integer('position').notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check('dishes_price_positive', sql`${t.price} >= 0`),
    index('dishes_category_idx').on(t.categoryId, t.position),
  ],
);

export const dishTranslations = pgTable(
  'dish_translations',
  {
    dishId: integer('dish_id')
      .notNull()
      .references(() => dishes.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    description: text('description').notNull().default(''),
  },
  (t) => [primaryKey({ columns: [t.dishId, t.locale] })],
);

/* ---------------------------------------------------------- Réservations */

export const reservations = pgTable(
  'reservations',
  {
    id: serial('id').primaryKey(),
    /** Référence communiquée au client (HER-XXXXXX). */
    reference: varchar('reference', { length: 12 }).notNull().unique(),
    date: date('date', { mode: 'string' }).notNull(),
    /** Heure du créneau (HH:MM), heure de Yaoundé. */
    time: varchar('time', { length: 5 }).notNull(),
    service: serviceEnum('service').notNull(),
    guests: smallint('guests').notNull(),
    firstName: varchar('first_name', { length: 60 }).notNull(),
    lastName: varchar('last_name', { length: 60 }).notNull(),
    email: varchar('email', { length: 254 }).notNull(),
    /** Format international (+237…). */
    phone: varchar('phone', { length: 20 }).notNull(),
    occasion: varchar('occasion', { length: 20 }),
    requests: text('requests'),
    locale: localeEnum('locale').notNull().default('fr'),
    status: reservationStatusEnum('status').notNull().default('pending'),
    /** Note interne, visible uniquement dans l'administration. */
    internalNote: text('internal_note'),
    clientEmailSentAt: timestamp('client_email_sent_at', { withTimezone: true }),
    restaurantEmailSentAt: timestamp('restaurant_email_sent_at', { withTimezone: true }),
    whatsappNotifiedAt: timestamp('whatsapp_notified_at', { withTimezone: true }),
    emailAttempts: smallint('email_attempts').notNull().default(0),
    lastEmailError: text('last_email_error'),
    ...timestamps,
  },
  (t) => [
    check('reservations_guests_range', sql`${t.guests} between 1 and 50`),
    index('reservations_date_idx').on(t.date, t.service, t.status),
    index('reservations_created_idx').on(t.createdAt),
  ],
);

/* --------------------------------------------------------------- Contact */

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 80 }).notNull(),
    email: varchar('email', { length: 254 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    subject: varchar('subject', { length: 20 }).notNull().default('info'),
    message: text('message').notNull(),
    locale: localeEnum('locale').notNull().default('fr'),
    readAt: timestamp('read_at', { withTimezone: true }),
    emailSentAt: timestamp('email_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('contact_messages_created_idx').on(t.createdAt)],
);

/* -------------------------------------------------------- Administration */

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  name: varchar('name', { length: 80 }).notNull().default('Administrateur'),
  /** Hachage bcrypt : le mot de passe n'est jamais stocké. */
  passwordHash: text('password_hash').notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...timestamps,
});

export const adminSessions = pgTable(
  'admin_sessions',
  {
    /** SHA-256 du jeton de session : une fuite de la base ne donne accès à aucune session. */
    idHash: varchar('id_hash', { length: 64 }).primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('admin_sessions_user_idx').on(t.userId)],
);

/** Limitation de débit partagée entre toutes les instances du serveur (serverless compris). */
export const rateLimits = pgTable('rate_limits', {
  key: varchar('key', { length: 128 }).primaryKey(),
  count: integer('count').notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
});

/* ------------------------------------------------------------- Relations */

export const categoriesRelations = relations(categories, ({ many }) => ({
  translations: many(categoryTranslations),
  dishes: many(dishes),
}));

export const categoryTranslationsRelations = relations(categoryTranslations, ({ one }) => ({
  category: one(categories, { fields: [categoryTranslations.categoryId], references: [categories.id] }),
}));

export const dishesRelations = relations(dishes, ({ one, many }) => ({
  category: one(categories, { fields: [dishes.categoryId], references: [categories.id] }),
  translations: many(dishTranslations),
}));

export const dishTranslationsRelations = relations(dishTranslations, ({ one }) => ({
  dish: one(dishes, { fields: [dishTranslations.dishId], references: [dishes.id] }),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(adminUsers, { fields: [adminSessions.userId], references: [adminUsers.id] }),
}));
