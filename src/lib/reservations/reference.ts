// Référence de réservation lisible au téléphone : sans 0/O ni 1/I/L pour éviter les confusions.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateReference(): string {
  const bytes = new Uint8Array(6);
  let out = '';
  while (out.length < 6) {
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      // Rejet des valeurs hautes : tirage uniforme sur l'alphabet
      if (b < 248 && out.length < 6) out += ALPHABET[b % ALPHABET.length];
    }
  }
  return `HER-${out}`;
}

export const REFERENCE_PATTERN = /^HER-[A-HJKMNP-Z2-9]{6}$/;
