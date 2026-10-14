import { expect, test } from '@playwright/test';

// Aucun défilement horizontal parasite sur téléphone
for (const path of ['/', '/la-carte', '/reservation', '/le-restaurant', '/contact']) {
  test(`mise en page mobile sans débordement : ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('menu mobile : ouverture, navigation et fermeture au clavier', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Navigation principale' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  await dialog.getByRole('link', { name: 'La Carte' }).click();
  await expect(page).toHaveURL(/\/la-carte$/);
  await expect(dialog).toBeHidden();
});
