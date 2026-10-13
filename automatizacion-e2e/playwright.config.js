import { defineConfig, devices } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // la API comparte una sola base SQLite
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: APP_URL,
    // Evidencia solo cuando algo falla: mantiene las corridas verdes ligeras
    // y da contexto completo cuando hay que investigar.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
});

