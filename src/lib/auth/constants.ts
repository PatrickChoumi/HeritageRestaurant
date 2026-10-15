/** Cookie de session de l'administration (jeton aléatoire, seul son hachage est en base). */
export const ADMIN_COOKIE = 'heritage_admin';
export const ADMIN_COOKIE_PATH = '/admin';
/** Expiration après inactivité, et durée maximale d'une session. */
export const SESSION_IDLE_MS = 4 * 60 * 60 * 1000;
export const SESSION_MAX_MS = 12 * 60 * 60 * 1000;
