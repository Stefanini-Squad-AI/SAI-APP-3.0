/**
 * AURA — Legal information steps (SAIAPP3-18)
 */
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import {
  LANGUAGE_STORAGE_KEY,
  LEGAL_ROUTE_SEGMENT,
  resolveLegalInformationUrl,
} from '../constants/LegalInformationConstants';

When('I open the public legal information route', async function (this: AuraWorld) {
  await this.webActions.navigateTo(resolveLegalInformationUrl());
});

Given('I am on the public legal information page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(resolveLegalInformationUrl());
});

Then('the legal information shell should be visible', async function (this: AuraWorld) {
  await expect(this.page.getByTestId('legal-information-page')).toBeVisible({ timeout: 60_000 });
});

Then('there should be at least two legal tabs', async function (this: AuraWorld) {
  const tabs = this.page.getByTestId('legal-information-page').getByRole('tab');
  await expect(tabs).toHaveCount(2);
});

When('I activate the first legal tab', async function (this: AuraWorld) {
  await this.page.getByTestId('legal-tab-privacy').click();
});

When('I activate the second legal tab', async function (this: AuraWorld) {
  await this.page.getByTestId('legal-tab-terms').click();
});

Then('the terms legal content panel should be visible', async function (this: AuraWorld) {
  await expect(this.page.getByTestId('legal-panel-terms')).toBeVisible();
  await expect(this.page.getByTestId('legal-panel-terms-inner')).toBeVisible();
});

Then('the privacy legal content panel should be visible', async function (this: AuraWorld) {
  await expect(this.page.getByTestId('legal-panel-privacy')).toBeVisible();
  await expect(this.page.getByTestId('legal-panel-privacy-inner')).toBeVisible();
});

Then('the terms legal content panel should be hidden', async function (this: AuraWorld) {
  await expect(this.page.getByTestId('legal-panel-terms')).toBeHidden();
});

Then('the privacy legal content panel should be hidden', async function (this: AuraWorld) {
  await expect(this.page.getByTestId('legal-panel-privacy')).toBeHidden();
});

When('I follow the footer link for legal information', async function (this: AuraWorld) {
  const link = this.page.getByTestId('footer-link-legal-information');
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(this.page.getByTestId('legal-information-page')).toBeVisible({ timeout: 60_000 });
});

Then('the browser URL should include the legal route segment', async function (this: AuraWorld) {
  const url = this.page.url();
  if (!url.includes(`/${LEGAL_ROUTE_SEGMENT}`)) {
    throw new Error(`Expected URL to include /${LEGAL_ROUTE_SEGMENT} but was: ${url}`);
  }
});

When('I persist the UI language as {string} and reload the page', async function (this: AuraWorld, code: string) {
  await this.page.evaluate(
    ({ key, lang }) => {
      localStorage.setItem(key, lang);
    },
    { key: LANGUAGE_STORAGE_KEY, lang: code },
  );
  await this.page.reload({ waitUntil: 'domcontentloaded' });
  await this.webActions.wait(1500);
});

Then('the first legal tab should show label {string}', async function (this: AuraWorld, label: string) {
  await expect(this.page.getByTestId('legal-tab-privacy')).toHaveText(label, { timeout: 30_000 });
});
