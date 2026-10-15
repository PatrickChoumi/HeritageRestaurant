import { expect, test, type Page } from '@playwright/test';

async function chooseSlot(page: Page, guests: string) {
  await page.getByRole('button', { name: guests, exact: true }).click();
  // Troisième jour proposé : toujours dans le futur
  await page.locator('fieldset').nth(1).locator('button[aria-pressed]').nth(2).click();
  const slot = page.locator('[role="tabpanel"] button:not([disabled])').first();
  await expect(slot).toBeVisible();
  await slot.click();
}

test.describe('réservation multi-canal', () => {
  test('parcours complet en français : validation, enregistrement, WhatsApp, agenda', async ({ page }) => {
    await page.goto('/reservation');
    await chooseSlot(page, '4 convives');
    await page.getByRole('button', { name: /Continuer/ }).click();

    // Envoi vide : erreurs explicites, focus sur le premier champ
    await page.getByRole('button', { name: /Confirmer la réservation/ }).click();
    await expect(page.getByLabel('Prénom')).toBeFocused();
    await expect(page.getByText('Ce champ est obligatoire.').first()).toBeVisible();

    await page.getByLabel('Prénom').fill('Aïcha');
    await page.getByLabel('Nom', { exact: true }).fill('E2E Mbarga');
    await page.getByLabel('E-mail').fill('aicha.e2e@example.com');
    await page.getByLabel(/Téléphone/).fill('12');
    await page.getByLabel(/Téléphone/).blur();
    await expect(page.getByText(/Numéro non valide/)).toBeVisible();
    await page.getByLabel(/Téléphone/).fill('6 99 12 34 56');
    await page.getByRole('button', { name: 'Anniversaire' }).click();
    await page.getByLabel('Demandes particulières').fill('Table calme <b>svp</b>');
    await page.getByRole('checkbox').check();
    await page.waitForTimeout(3100); // délai anti-robot
    await page.getByRole('button', { name: /Confirmer la réservation/ }).click();

    await expect(page.getByRole('heading', { name: 'Merci, Aïcha' })).toBeVisible();
    await expect(page.getByText(/^HER-[A-Z2-9]{6}$/)).toBeVisible();
    await expect(page.getByText('Un récapitulatif vient d’être envoyé à aicha.e2e@example.com.')).toBeVisible();
    const whatsapp = await page.getByRole('link', { name: /Confirmer sur WhatsApp/ }).getAttribute('href');
    expect(whatsapp).toMatch(/^https:\/\/wa\.me\/237659855617\?text=/);
    expect(decodeURIComponent(whatsapp!)).toContain('4 convives');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Ajouter à mon agenda' }).click();
    expect((await download).suggestedFilename()).toMatch(/^heritage-HER-[A-Z2-9]{6}\.ics$/);
  });

  test('les groupes sont orientés vers WhatsApp', async ({ page }) => {
    await page.goto('/reservation');
    await page.getByRole('button', { name: '10 +' }).click();
    await expect(page.getByText(/Plus de 10 convives/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contacter Héritage' })).toHaveAttribute('href', /wa\.me/);
  });

  test('version anglaise', async ({ page }) => {
    await page.goto('/en/book-a-table');
    await chooseSlot(page, '2 guests');
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByLabel('First name').fill('David');
    await page.getByLabel('Last name').fill('E2E Thompson');
    await page.getByLabel('Email').fill('david.e2e@example.com');
    await page.getByLabel(/Phone/).fill('+44 7700 900123');
    await page.getByRole('checkbox').check();
    await page.waitForTimeout(3100);
    await page.getByRole('button', { name: /Confirm booking/ }).click();
    await expect(page.getByRole('heading', { name: 'Thank you, David' })).toBeVisible();
    const whatsapp = await page.getByRole('link', { name: /Confirm on WhatsApp/ }).getAttribute('href');
    expect(decodeURIComponent(whatsapp!)).toContain('Hello Héritage!');
  });

  test('le serveur refuse une requête forgée (prix, créneau, robot)', async ({ request }) => {
    const r = await request.get('/api/availability?date=2026-13-45&guests=2');
    expect(r.status()).toBe(400);
    const tooMany = await request.get('/api/availability?date=2030-01-01&guests=99');
    expect(tooMany.status()).toBe(400);
  });
});
