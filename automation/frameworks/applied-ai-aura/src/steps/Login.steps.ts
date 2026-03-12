/**
 * AURA — Login Steps
 * Gherkin step definitions for the authentication flow.
 *
 * Philosophy: each step should be a single-line delegation to WebActions.
 * Business logic should live in WebActions or dedicated matchers.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LoginConstants } from '../constants/LoginConstants';

// ─── Given ────────────────────────────────────────────────────────────────────

Given('the browser is open on the login page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(LoginConstants.LOGIN_URL);
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('I enter username {string}', async function (this: AuraWorld, username: string) {
  await this.webActions.fill('Username', username);
});

When('I enter password {string}', async function (this: AuraWorld, password: string) {
  await this.webActions.fill('Password', password);
});

When('I click the login button', async function (this: AuraWorld) {
  await this.webActions.click('button:Login');
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('I should be redirected to {string}', async function (this: AuraWorld, path: string) {
  await this.webActions.expectUrlContains(path);
});

Then('I should see the welcome message', async function (this: AuraWorld) {
  await this.webActions.expectVisible('h4');
});

Then('I should see an error message', async function (this: AuraWorld) {
  await this.webActions.expectVisible('#flash');
});

Then('the login result should be {string}', async function (this: AuraWorld, result: string) {
  if (result === 'successful') {
    await this.webActions.expectUrlContains(LoginConstants.SECURE_PATH);
  } else {
    await this.webActions.expectVisible('#flash');
  }
});

Then('the login form should be visible', async function (this: AuraWorld) {
  await this.webActions.expectVisible('Username');
  await this.webActions.expectVisible('Password');
});

Then('the login button should be enabled', async function (this: AuraWorld) {
  await this.webActions.expectEnabled('button:Login');
});
