import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Garde-fou de Next.js : sans effet hors du serveur React
      'server-only': path.resolve(__dirname, 'tests/support/empty.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    // PGlite en mémoire pour les tests d'intégration (ou DATABASE_URL pour un vrai PostgreSQL)
    env: { PGLITE_MEMORY: '1', BCRYPT_COST: '4', TZ: 'UTC' },
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
