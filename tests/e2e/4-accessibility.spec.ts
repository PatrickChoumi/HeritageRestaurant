import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Audit automatique WCAG 2.1 AA (contrastes, libellés, rôles ARIA, titres…)
for (const path of ['/', '/la-carte', '/reservation', '/le-restaurant', '/contact', '/en', '/admin/login']) {
  test(`aucune violation d’accessibilité : ${path}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    // Les contrastes se mesurent une fois les apparitions terminées (animations finies uniquement)
    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.effect?.getTiming().iterations === Infinity || a.playState !== 'running'),
    );
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    const report = serious.map(
      (v) =>
        `${v.id} — ${v.help}\n${v.nodes.map((n) => `  ${n.target.join(' ')}: ${n.failureSummary ?? ''}\n  ${n.html.slice(0, 200)}`).join('\n')}`,
    );
    expect(report, report.join('\n\n')).toEqual([]);
  });
}
