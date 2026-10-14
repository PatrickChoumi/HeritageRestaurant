import { expect, test } from '@playwright/test';

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@heritage.local';
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'demo-heritage-2026';

test.describe('administration', () => {
  test('accès refusé sans session, et pages non indexables', async ({ page, request }) => {
    await page.goto('/admin/reservations');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Freservations/);
    const response = await request.get('/admin/login');
    expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
  });

  test('connexion, confirmation d’une réservation et gestion de la carte', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Mot de passe').fill('mauvais mot de passe');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText('Identifiant ou mot de passe incorrect.')).toBeVisible();
    await expect(page.getByLabel('E-mail')).toHaveValue(EMAIL);
    await page.getByLabel('Mot de passe').fill(PASSWORD);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Bonjour|Bon après-midi|Bonsoir/);

    // La cookie de session est protégée
    const cookie = (await page.context().cookies()).find((c) => c.name === 'heritage_admin');
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/admin' });

    // Réservation créée par le test public
    await page.goto('/admin/reservations?range=upcoming&q=E2E%20Mbarga');
    await page.getByRole('link', { name: /Aïcha E2E Mbarga/ }).click();
    const panel = page.getByRole('complementary');
    await expect(panel.getByText('Table calme <b>svp</b>')).toBeVisible();
    await panel.getByRole('button', { name: 'Confirmer' }).click();
    await expect(panel.getByText('Client prévenu par e-mail.')).toBeVisible();
    await expect(panel.getByText('Confirmée')).toBeVisible();

    // Un plat épuisé dans l'administration disparaît des disponibilités du site public
    await page.goto('/admin/carte');
    const row = page.getByRole('listitem').filter({ hasText: 'Soya de bœuf au yaji' });
    await row.getByRole('button', { name: /Disponible/ }).click();
    await expect(row.getByRole('button', { name: /Épuisé/ })).toBeVisible();
    await page.goto('/la-carte');
    const soya = page.getByRole('listitem').filter({ hasText: 'Soya de bœuf au yaji' });
    await expect(soya.getByText('Épuisé aujourd’hui')).toBeVisible();
    await page.goto('/admin/carte');
    await page.getByRole('listitem').filter({ hasText: 'Soya de bœuf au yaji' }).getByRole('button', { name: /Épuisé/ }).click();

    // Le message de contact est arrivé
    await page.goto('/admin/messages');
    await expect(page.getByText('nous souhaitons privatiser le salon')).toBeVisible();

    await page.getByRole('button', { name: 'Se déconnecter' }).first().click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
