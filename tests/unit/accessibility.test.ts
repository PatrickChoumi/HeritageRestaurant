import { describe, expect, it } from 'vitest';

// Contrastes WCAG 2.2 de la charte (texte normal : 4,5:1 minimum en AA, 7:1 en AAA)
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
}
const contrast = (a: string, b: string) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1! + 0.05) / (l2! + 0.05);
};

const INK = '#0D0D0D';
const COAL = '#121212';
const GOLD = '#D4AF37';
const IVORY = '#F5F5F5';
const MIST = '#A0A0A0';

describe('contrastes de la charte Sombre / Or', () => {
  it.each([
    ['or sur fond principal', GOLD, INK, 7],
    ['or sur fond secondaire', GOLD, COAL, 7],
    ['texte blanc cassé sur fond', IVORY, INK, 7],
    ['texte gris clair sur fond', MIST, INK, 7],
    ['texte gris clair sur fond secondaire', MIST, COAL, 4.5],
    ['texte noir sur bouton or', INK, GOLD, 7],
  ])('%s : niveau AAA ou AA respecté', (_, fg, bg, min) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
