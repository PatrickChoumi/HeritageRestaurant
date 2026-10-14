import { defineConfig, devices } from '@playwright/test';

// Tests de bout en bout sur le build de production : `npm run build` puis `npm run test:e2e`.
// Sans DATABASE_URL, une base PGlite neuve est créée dans .data/e2e à chaque lancement.
const PORT = Number(process.env.E2E_PORT ?? 3200);
const freshDb = process.env.DATABASE_URL
  ? ''
  : `node -e "require('fs').rmSync('.data/e2e',{recursive:true,force:true})" && `;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'fr-FR',
    timezoneId: 'Africa/Douala',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /mobile\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: `${freshDb}npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PGLITE_DATA_DIR: '.data/e2e',
      ADMIN_EMAIL: process.env.E2E_ADMIN_EMAIL ?? 'admin@heritage.local',
      ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD ?? 'demo-heritage-2026',
      BCRYPT_COST: '4',
      OUTBOX_DIR: '.data/e2e-outbox',
    },
  },
});
