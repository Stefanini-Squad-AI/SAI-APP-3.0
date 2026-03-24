/**
 * AURA — Common Steps
 * Reusable Gherkin steps for any feature.
 * Each step delegates directly to WebActions with no extra layers.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

// ─── Navigation ───────────────────────────────────────────────────────────────

Given('I navigate to {string}', async function (this: AuraWorld, url: string) {
  let target = url.trim();
  if (target.startsWith('/') && !target.startsWith('//')) {
    const base = process.env['AURA_TARGET_URL']?.trim().replace(/\/$/, '');
    if (base) target = `${base}${target}`;
  }
  await this.webActions.navigateTo(target);
});

// ─── Generic Actions ──────────────────────────────────────────────────────────

When('I click on {string}', async function (this: AuraWorld, target: string) {
  await this.webActions.click(target);
});

When('I click on {string} in the page', async function (this: AuraWorld, target: string) {
  await this.webActions.click(target);
});

When('I type {string} into {string}', async function (this: AuraWorld, value: string, target: string) {
  await this.webActions.fill(target, value);
});

When('I select {string} in {string}', async function (this: AuraWorld, value: string, target: string) {
  await this.webActions.selectOption(target, value);
});

When('I press key {string} in {string}', async function (this: AuraWorld, key: string, target: string) {
  await this.webActions.pressKey(target, key);
});

When('I wait {int} milliseconds', async function (this: AuraWorld, ms: number) {
  await this.webActions.wait(ms);
});

// ─── Generic Assertions ───────────────────────────────────────────────────────

Then('{string} should be visible', async function (this: AuraWorld, target: string) {
  await this.webActions.expectVisible(target);
});

Then('{string} should be hidden', async function (this: AuraWorld, target: string) {
  await this.webActions.expectHidden(target);
});

Then('{string} should be enabled', async function (this: AuraWorld, target: string) {
  await this.webActions.expectEnabled(target);
});

Then('{string} should be disabled', async function (this: AuraWorld, target: string) {
  await this.webActions.expectDisabled(target);
});

Then('the URL should contain {string}', async function (this: AuraWorld, path: string) {
  await this.webActions.expectUrlContains(path);
});

Then('the page title should contain {string}', async function (this: AuraWorld, text: string) {
  await this.webActions.expectTitleContains(text);
});

Then('{string} should have text {string}', async function (this: AuraWorld, target: string, text: string) {
  await this.webActions.expectText(target, text);
});

Then('{string} should have value {string}', async function (this: AuraWorld, target: string, value: string) {
  await this.webActions.expectValue(target, value);
});

Then('I take a screenshot', async function (this: AuraWorld) {
  const ts = Date.now();
  await this.webActions.takeScreenshot(`reports/screenshots/step-${ts}.png`);
});
