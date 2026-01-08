import { test } from '@playwright/test';

test('setup login', async ({ page, context }) => {
  const email = process.env["SMTP_USER"];
  const password = process.env["SMTP_PASS"];

  if (!email || !password) {
    throw new Error('SMTP_USER and SMTP_PASS environment variables must be set');
  }

  await page.goto('http://localhost:4200/login');

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login/i }).click();

  await page.waitForURL('http://localhost:4200/');

  await context.storageState({ path: 'tests/auth.json' });
});
