@AGENTS.md

# Héritage — notes pour les sessions de développement

Site du restaurant Héritage (Bastos, Yaoundé) : Next.js 16 App Router, React 19, Tailwind 4, Motion,
next-intl (FR par défaut sans préfixe, EN sous /en, URL traduites), Drizzle + PostgreSQL (PGlite en local).
Le cahier des charges et la couverture de chaque exigence sont dans README.md.

## Règles du projet

- Langue : textes, commentaires, messages de commit et documentation en **français**.
- Tout texte visible passe par `messages/fr.json` **et** `messages/en.json` (mêmes clés, vérifié par
  `tests/unit/i18n.test.ts`). Apostrophe typographique (’) dans les traductions (évite les pièges ICU).
- Les informations du restaurant (horaires, services, capacités, coordonnées) vivent uniquement dans
  `src/lib/restaurant.ts`.
- Le serveur fait foi : toute règle de réservation est dans `src/lib/reservations/` (fonctions pures testées)
  et revérifiée côté serveur ; chaque action d'administration commence par `requireAdmin()`.
- Après une modification du schéma (`src/lib/db/schema.ts`) : `npm run db:generate` et commiter la migration.
- Les composants qui lisent la base sont des Server Components ; `server-only` protège les modules serveur
  (les scripts `tsx` tournent avec `--conditions=react-server`, vitest le neutralise via un alias).

## Vérifications avant de pousser

`npm run lint && npm run typecheck && npm test`, puis `npm run build && npm run test:e2e` si l'interface change.
Pour tester sur un vrai PostgreSQL : `DATABASE_URL=… npm run db:setup && DATABASE_URL=… npx vitest run tests/integration`.
