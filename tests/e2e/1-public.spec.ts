import { expect, test } from '@playwright/test';

test.describe('site public', () => {
  test('accueil : hero, navigation, microdonnées et en-têtes de sécurité', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    const headers = response!.headers();
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-powered-by']).toBeUndefined();

    await expect(page).toHaveTitle(/Héritage/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('L’âme du Cameroun');
    const nav = page.getByRole('navigation', { name: 'Navigation principale' }).first();
    for (const label of ['Accueil', 'La Carte', 'Le Restaurant', 'Réservation', 'Contact']) {
      await expect(nav.getByRole('link', { name: label })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'Réserver une table' }).first()).toBeVisible();

    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(jsonLd!);
    expect(data['@type']).toBe('Restaurant');
    expect(data.telephone).toBe('+237659855617');
    expect(data.openingHoursSpecification).toHaveLength(7);

    // Plats signatures lus en base
    await expect(page.getByRole('heading', { name: 'Ndolé aux crevettes' })).toBeAttached();
  });

  test('la langue bascule instantanément sur la même page', async ({ page }) => {
    await page.goto('/la-carte');
    await page.getByRole('button', { name: 'English' }).first().click();
    await expect(page).toHaveURL(/\/en\/menu$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('tab', { name: 'Starters' })).toBeVisible();
    await page.getByRole('button', { name: 'Français' }).first().click();
    await expect(page).toHaveURL(/\/la-carte$/);
  });

  test('carte : onglets au clavier et filtre d’allergènes', async ({ page }) => {
    await page.goto('/la-carte');
    const starters = page.getByRole('tab', { name: 'Entrées' });
    await expect(starters).toHaveAttribute('aria-selected', 'true');
    await starters.focus();
    await page.keyboard.press('ArrowRight');
    const mains = page.getByRole('tab', { name: 'Plats' });
    await expect(mains).toHaveAttribute('aria-selected', 'true');
    await expect(mains).toBeFocused();
    const panel = page.getByRole('tabpanel', { name: 'Plats' });
    await expect(panel.getByRole('heading', { name: 'Ndolé aux crevettes' })).toBeVisible();
    await expect(panel.getByText('Épuisé aujourd’hui')).toBeVisible();

    await page.getByRole('button', { name: /Allergènes à éviter/ }).first().click();
    await page.getByRole('button', { name: 'Arachides', exact: true }).click();
    await expect(panel.getByRole('heading', { name: 'Ndolé aux crevettes' })).toBeHidden();
    await expect(page.getByText(/plats? masqués? par vos filtres/)).toBeVisible();
    await page.getByRole('button', { name: 'Tout afficher' }).click();
    await expect(panel.getByRole('heading', { name: 'Ndolé aux crevettes' })).toBeVisible();

    const menuLd = JSON.parse((await page.locator('script[type="application/ld+json"]').last().textContent())!);
    expect(menuLd['@type']).toBe('Menu');
    expect(menuLd.hasMenuSection).toHaveLength(4);
  });

  test('pages intérieures et 404 traduite', async ({ page }) => {
    for (const [path, heading] of [
      ['/le-restaurant', /une maison de cuisine/],
      ['/contact', /nous voir/],
      ['/en/the-restaurant', /a house of cuisine/],
      ['/en/book-a-table', /your table/],
    ] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
    }
    // La langue choisie est mémorisée (cookie) : on repart d'un visiteur neuf pour la 404 française
    await page.context().clearCookies();
    const missing = await page.goto('/ce-plat-nexiste-pas');
    expect(missing?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('n’est pas au menu');
    expect((await page.goto('/en/no-such-dish'))?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('is not on the menu');
  });

  test('référencement : sitemap bilingue, robots, image de partage', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('hreflang="en"');
    expect(sitemap).toContain('/en/menu');
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /admin');
    const og = await request.get('/opengraph-image');
    expect(og.headers()['content-type']).toBe('image/jpeg');
    expect((await og.body()).length).toBeLessThan(300_000);
  });

  test('contact : message enregistré', async ({ page }) => {
    await page.goto('/contact');
    await page.getByLabel('Nom complet').fill('Équipe Test E2E');
    await page.getByLabel('E-mail').fill('e2e@example.com');
    await page.getByLabel('Votre message').fill('Bonjour, nous souhaitons privatiser le salon pour 20 personnes.');
    await page.getByRole('button', { name: 'Envoyer le message' }).click();
    await expect(page.getByText('Votre message a bien été transmis')).toBeVisible();
  });
});
