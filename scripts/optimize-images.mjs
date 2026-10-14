// Prépare les vraies photos du restaurant pour le site.
//   1. Déposez les originaux (JPEG, PNG, HEIC converti…) dans photos-originales/<dossier>/
//      (dossiers : hero, plats, ambiance)
//   2. npm run images:optimize
//   3. Déclarez les nouvelles images dans src/lib/images.ts
// Les images sont redimensionnées (2 400 px max), converties en WebP et débarrassées
// de leurs métadonnées (GPS, appareil) avant d'arriver dans src/assets/images/.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE = path.join(process.cwd(), 'photos-originales');
const TARGET = path.join(process.cwd(), 'src', 'assets', 'images');
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif']);

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) yield full;
  }
}

try {
  await fs.access(SOURCE);
} catch {
  console.error('Créez le dossier photos-originales/ (sous-dossiers hero, plats, ambiance) et déposez-y vos photos.');
  process.exit(1);
}

let count = 0;
for await (const file of walk(SOURCE)) {
  const relative = path.relative(SOURCE, file);
  const slug = path
    .basename(relative, path.extname(relative))
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const out = path.join(TARGET, path.dirname(relative), `${slug}.webp`);
  await fs.mkdir(path.dirname(out), { recursive: true });
  const info = await sharp(file).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toFile(out);
  console.info(`✓ ${path.relative(process.cwd(), out)} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} Ko)`);
  count += 1;
}
console.info(count ? `${count} image(s) prête(s). Ajoutez-les dans src/lib/images.ts.` : 'Aucune image trouvée.');
