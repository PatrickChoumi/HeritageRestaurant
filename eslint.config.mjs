import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'node_modules/**', 'drizzle/**', 'test-results/**', 'playwright-report/**', 'next-env.d.ts'],
  },
];

export default config;
