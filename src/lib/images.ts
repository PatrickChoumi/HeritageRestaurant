// Bibliothèque des visuels du site. Les imports statiques donnent à next/image les dimensions
// exactes et un aperçu flou automatique (pas de saut de mise en page au chargement).
// En base, un plat référence son image par sa clé (ex. « plats/ndole »).
import type { StaticImageData } from 'next/image';
import heroSalle from '@/assets/images/hero/salle.webp';
import heroBraise from '@/assets/images/hero/braise.webp';
import heroChef from '@/assets/images/hero/chef.webp';
import platNdole from '@/assets/images/plats/ndole.webp';
import platPouletDg from '@/assets/images/plats/poulet-dg.webp';
import platBarBraise from '@/assets/images/plats/bar-braise.webp';
import platSoya from '@/assets/images/plats/soya.webp';
import platPoissonBraise from '@/assets/images/plats/poisson-braise.webp';
import ambianceTable from '@/assets/images/ambiance/table.webp';
import ambianceLumieres from '@/assets/images/ambiance/lumieres.webp';
import ambiancePanneaux from '@/assets/images/ambiance/panneaux.webp';
import ambianceDressage from '@/assets/images/ambiance/dressage.webp';

export const images = {
  'hero/salle': heroSalle,
  'hero/braise': heroBraise,
  'hero/chef': heroChef,
  'plats/ndole': platNdole,
  'plats/poulet-dg': platPouletDg,
  'plats/bar-braise': platBarBraise,
  'plats/soya': platSoya,
  'plats/poisson-braise': platPoissonBraise,
  'ambiance/table': ambianceTable,
  'ambiance/lumieres': ambianceLumieres,
  'ambiance/panneaux': ambiancePanneaux,
  'ambiance/dressage': ambianceDressage,
} satisfies Record<string, StaticImageData>;

export type ImageKey = keyof typeof images;

/** Images proposées pour les plats dans l'administration. */
export const dishImageKeys = (Object.keys(images) as ImageKey[]).filter((k) => k.startsWith('plats/'));

export function imageFor(key: string | null | undefined): StaticImageData | null {
  return key && key in images ? images[key as ImageKey] : null;
}
