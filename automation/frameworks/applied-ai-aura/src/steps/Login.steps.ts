/**
 * AURA — Login Steps
 * Gherkin step definitions for the TuCreditoOnline admin login.
 *
 * Uses Playwright locators directly for reliable form interaction.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LoginConstants } from '../constants/LoginConstants';

// ─── Given ────────────────────────────────────────────────────────────────────

Given('the browser is on the admin login page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LoginConstants.LOGIN_URL);
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('I enter email {string}', async function (this: AuraWorld, email: string) {
  const field = this.page.locator('#email');
  await field.waitFor({ state: 'visible', timeout: 10000 });
  await field.fill(email);
});

When('I enter login password {string}', async function (this: AuraWorld, password: string) {
  const field = this.page.locator('#password');
  await field.waitFor({ state: 'visible', timeout: 10000 });
  await field.fill(password);
});

When('I click the admin login button', async function (this: AuraWorld) {
  const btn = this.page.getByRole('button', { name: /sign in|log in|iniciar|entrar/i }).first();
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click();
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('the email field should be visible', async function (this: AuraWorld) {
  const field = this.page.locator('#email');
  await field.waitFor({ state: 'visible', timeout: 10000 });
});

Then('the password field should be visible', async function (this: AuraWorld) {
  const field = this.page.locator('#password');
  await field.waitFor({ state: 'visible', timeout: 10000 });
});

Then('the login button should be visible', async function (this: AuraWorld) {
  const btn = this.page.getByRole('button', { name: /sign in|log in|iniciar|entrar/i }).first();
  await btn.waitFor({ state: 'visible', timeout: 10000 });
});
