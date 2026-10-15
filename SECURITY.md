# Sécurité — Héritage (version Next.js)

Ce document reprend la démarche de l'audit de l'étape 7 (version Express) et l'applique à la nouvelle
architecture : **ce qui est protégé, comment, où le vérifier, et ce qui reste à surveiller.**

## Ce qui est en place

| Risque                               | Protection                                                                                                                                                                                                                                                                                             | Où / comment c'est vérifié                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Injection SQL                        | Toutes les requêtes passent par Drizzle ORM (requêtes paramétrées). Les rares fragments SQL écrits à la main n'interpolent que des valeurs paramétrées. La recherche admin échappe `%` et `_`.                                                                                                         | `src/lib/**`, tests d'intégration                                      |
| Données falsifiées par le navigateur | Le serveur revalide **tout** (zod) : dates, créneaux, délais, nombre de convives, capacité. Les prix et la disponibilité viennent de la base.                                                                                                                                                          | `src/lib/reservations/*`, tests unitaires et e2e                       |
| Survente d'une table                 | Transaction + verrou PostgreSQL (`pg_advisory_xact_lock`) par date : les demandes simultanées sont sérialisées.                                                                                                                                                                                        | Test « ne survend jamais la dernière table » (PGlite et PostgreSQL 16) |
| XSS                                  | React échappe tout le contenu ; aucun `innerHTML` sur une donnée utilisateur. JSON-LD échappé (`<`, `>`, `&`). E-mails : toute saisie échappée. Aperçu d'e-mail dans l'admin : `iframe` en `sandbox`.                                                                                                  | `tests/unit/emails.test.ts`                                            |
| Injection d'en-têtes e-mail          | Noms nettoyés (caractères de contrôle retirés), sujets sans texte libre du client.                                                                                                                                                                                                                     | `tests/unit/validation.test.ts`, `emails.test.ts`                      |
| CSRF                                 | Les Server Actions sont des POST dont Next.js vérifie l'origine (`Origin` = `Host`) ; cookie admin `SameSite=Lax`. Aucune action ne modifie de données en GET.                                                                                                                                         | Next.js, `src/app/admin/actions.ts`                                    |
| Mots de passe                        | bcrypt (coût 12), jamais stockés ni journalisés en clair, 12 caractères minimum, comparaison factice si le compte n'existe pas (pas de découverte des comptes au chronomètre).                                                                                                                         | `src/lib/auth/password.ts`                                             |
| Sessions                             | Jeton aléatoire 256 bits, cookie `HttpOnly`, `Secure` en production, limité à `/admin` ; la base ne garde que son SHA-256. Expiration après 4 h d'inactivité, 12 h maximum ; autres sessions fermées au changement de mot de passe.                                                                    | `src/lib/auth/session.ts`, test e2e du cookie                          |
| Contrôle d'accès                     | `requireAdmin()` en tête de **chaque** page et **chaque** action d'administration (le proxy ne fait qu'aiguiller).                                                                                                                                                                                     | `src/app/admin/**`                                                     |
| Force brute / spam                   | Limitation de débit **stockée en base** (fonctionne aussi en serverless) : connexion 5 essais / 15 min / IP et 10 / compte ; réservations 6 / 10 min / IP ; contact 4 / 30 min. Champ piège et délai minimum de remplissage contre les robots. Adresses IP jamais stockées en clair (empreinte salée). | `src/lib/rate-limit.ts`, test d'intégration                            |
| Redirection ouverte                  | Le paramètre `next` de la connexion n'accepte qu'un chemin `/admin/…`.                                                                                                                                                                                                                                 | `src/app/admin/actions.ts`                                             |
| En-têtes HTTP                        | CSP (aucune ressource externe sauf l'iframe Google Maps chargée au clic), `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS en production, pas de `X-Powered-By`, `noindex` + `no-store` sur `/admin`.                                       | `next.config.ts`, test e2e des en-têtes                                |
| Tâche planifiée                      | `/api/cron/notifications` exige `Authorization: Bearer CRON_SECRET` (comparaison à temps constant).                                                                                                                                                                                                    | `src/app/api/cron/notifications/route.ts`                              |
| Secrets                              | Aucun secret dans le code : variables d'environnement, `.env*` ignorés par git.                                                                                                                                                                                                                        | `.gitignore`, `.env.example`                                           |
| Vie privée                           | Polices auto-hébergées (aucun appel à Google Fonts), carte Google chargée seulement au clic, aucun cookie publicitaire ou de mesure d'audience.                                                                                                                                                        | `src/components/layout/MapEmbed.tsx`                                   |

## Risques restants (à connaître)

- **R1 — `script-src 'unsafe-inline'`.** Next.js injecte des scripts en ligne pour l'hydratation des pages
  statiques ; une CSP à nonce imposerait un rendu dynamique de toutes les pages. Le risque est contenu par
  l'échappement systématique de React et l'absence de contenu HTML saisi par les visiteurs.
- **R2 — Adresse IP derrière un proxy.** La limitation de débit lit `x-forwarded-for`, fiable sur Vercel
  (réécrit par la plateforme). Sur un serveur exposé directement, placer un proxy (Nginx, Caddy) qui écrase
  cet en-tête, sinon il peut être falsifié pour contourner les limites.
- **R3 — Fausses réservations.** Pas de captcha. Les limites, le champ piège et la confirmation par l'équipe
  atténuent le risque ; si besoin, ajouter Cloudflare Turnstile ou passer `RESERVATION_AUTO_CONFIRM=false`
  (valeur par défaut).
- **R4 — Compte administrateur unique, sans double authentification.** Choisir un mot de passe fort ;
  `npm run admin:create` réinitialise le mot de passe et ferme les sessions si besoin.
- **R5 — Données personnelles.** Noms, e-mails et téléphones des réservations restent en base : la purge après
  12 mois annoncée dans la politique de confidentialité est à automatiser avant l'ouverture.
- **R6 — Base locale PGlite.** Réservée au développement et à la démonstration (un seul processus, non
  chiffrée). En production, `DATABASE_URL` est obligatoire sur Vercel.

## Signaler une faille

Écrire au restaurant par WhatsApp ou téléphone (+237 6 59 85 56 17) en décrivant le problème ; ne pas le
publier avant qu'il soit corrigé.
