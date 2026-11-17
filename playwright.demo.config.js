// Demo smoke: dist-demo/ ni /demo/halvet/ ostida beradi va har bo'limni ochadi (npm run test:demo avval yig'adi).
import { defineConfig } from '@playwright/test';

const port = process.env.DEMO_PORT || '4591';

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${port}/demo/halvet/`, viewport: { width: 1440, height: 900 } },
  webServer: { command: 'node tools/demo/serve.mjs', env: { PORT: port }, url: `http://127.0.0.1:${port}/demo/halvet/`, reuseExistingServer: false },
});
