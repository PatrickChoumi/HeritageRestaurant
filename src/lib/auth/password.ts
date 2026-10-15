import bcrypt from 'bcryptjs';

/** Coût bcrypt : 12 ≈ 0,3 s par essai (les tests le baissent avec BCRYPT_COST=4). */
const COST = Number(process.env.BCRYPT_COST) || 12;

export const PASSWORD_MIN_LENGTH = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Hachage factice : la comparaison prend le même temps quand l'identifiant n'existe pas,
// on ne peut donc pas deviner les comptes existants en mesurant le temps de réponse.
let dummyHash: Promise<string> | undefined;
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= bcrypt.hash('heritage-dummy-password', COST);
  await bcrypt.compare(password, await dummyHash);
  return false;
}
