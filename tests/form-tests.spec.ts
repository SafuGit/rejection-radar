import test, { expect } from '@playwright/test';
import { configDotenv } from 'dotenv';

configDotenv();

test.use({ storageState: 'tests/auth.json' });

test('Full Form Flow: login, upload CV, parse JD & generate report', async ({ page }) => {
  //* LOGIN (just in case auth.json is expired)
  await page.goto('http://localhost:4200/login');

  const email = process.env['SMTP_USER'];
  const password = process.env['SMTP_PASS'];

  if (!email || !password) {
    throw new Error('SMTP_USER and SMTP_PASS environment variables must be set');
  }

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login/i }).click();

  await page.waitForURL('http://localhost:4200/');
  expect(page.url()).toBe('http://localhost:4200/');

  //* UPLOAD CV
  const filePath = 'tests/test-files/Safwan_CV.pdf';
  await page.setInputFiles('input[type="file"]', filePath);
  await page.getByRole('button', { name: /next/i }).click();

  // wait until button stops showing "Uploading" (max 1 minute)
  const nextButtonCV = page.getByRole('button', { name: /next/i });
  await expect(nextButtonCV).not.toHaveText(/uploading/i, { timeout: 60000 });

  const heading = page.locator('h2', { hasText: /edit parsed profile/i });
  await expect(heading).toBeVisible({ timeout: 60000 });

  await page.getByRole('button', { name: /next/i }).click();

  const jdHeading = page.locator('h2', { hasText: /paste job description/i });
  await expect(jdHeading).toBeVisible({ timeout: 60000 });

  //* PARSE JD AND GENERATE WEBSITE REPORT
  const jdText = `
Full-time Internship Opportunity - Software Developer
Only Freshers are encouraged to apply
Requirement:
Sincere and self-motivated individuals
Interested in analyzing, designing, testing, developing, and debugging web-based applications
Sound knowledge of data structures and algorithms
Eagerness to learn and adapt to new technologies
Should have completed the project in React/Angular
Familiar with Node.js and MongoDB
Familiar with RDBMS
Familiar with Git workflow
Participating in an on-site contest like ACM ICPC/NCPC is a bonus
What might interest you:
Opportunity to work with a friendly and creative team
Weekdays: Sunday to Thursday or Monday to Friday
Located at Mohammadpur.
Salary: BDT 10,000 - Successful candidates will be made permanent within 3 months at the latest.
Full-time salary: 20,000 BDT to 25,000 BDT
Interested candidates, please write to us explaining 'Why you are the right person for a tech company?'
Application email subject in the following format:
Intern-Developer-[Candidate Name]- [University Name]-[Location]
Example: Intern-Developer- Rezaul Karim – SUST - Mohammadpur
Email: hr.bd@implevista.com
Website: www.implevista.com
fb: https://www.facebook.com/ImplevistaBd/
  `;

  const websiteUrl = 'https://www.implevista.com/';
  const companyName = 'Implevista';

  await page.getByLabel(/job description/i).fill(jdText);
  await page.getByLabel(/company url/i).fill(websiteUrl);
  await page.getByLabel(/company name/i).fill(companyName);

  await page.getByRole('button', { name: /submit/i }).click();
});
