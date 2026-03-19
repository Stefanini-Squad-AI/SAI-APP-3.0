/**
 * AURA — Legal information page steps (public SPA /legal-info)
 */
import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { LegalInfoConstants, legalInfoAbsoluteUrl } from '../constants/LegalInfoConstants';

When('I click the desktop legal information navigation link', async function (this: AuraWorld) {
  await this.page.locator(LegalInfoConstants.SELECTOR_NAV_DESKTOP).click();
  await this.webActions.wait(500);
});

When('I click the footer legal information link', async function (this: AuraWorld) {
  const loc = this.page.locator(LegalInfoConstants.SELECTOR_FOOTER_LINK);
  await loc.scrollIntoViewIfNeeded();
  await loc.click();
  await this.webActions.wait(500);
});

When('I open the legal information page directly', async function (this: AuraWorld) {
  await this.webActions.navigateTo(legalInfoAbsoluteUrl());
});

When('I click the legal information contact call-to-action', async function (this: AuraWorld) {
  await this.page.locator(LegalInfoConstants.SELECTOR_CONTACT_CTA).click();
  await this.webActions.wait(500);
});

When('I open the language menu and select Spanish', async function (this: AuraWorld) {
  await this.page.locator(LegalInfoConstants.SELECTOR_LANG_BUTTON).click();
  await this.page.locator(LegalInfoConstants.SELECTOR_LANG_ES).click();
  await this.webActions.wait(500);
});

When('I open the language menu and select Portuguese', async function (this: AuraWorld) {
  await this.page.locator(LegalInfoConstants.SELECTOR_LANG_BUTTON).click();
  await this.page.locator(LegalInfoConstants.SELECTOR_LANG_PT).click();
  await this.webActions.wait(500);
});

When('I use a mobile viewport', async function (this: AuraWorld) {
  await this.page.setViewportSize({ width: 390, height: 844 });
});

When('I open the mobile navigation menu', async function (this: AuraWorld) {
  await this.page.locator(LegalInfoConstants.SELECTOR_MOBILE_MENU_TOGGLE).click();
  await this.webActions.wait(300);
});

When('I click the mobile legal information navigation link', async function (this: AuraWorld) {
  await this.page.locator(LegalInfoConstants.SELECTOR_NAV_MOBILE).click();
  await this.webActions.wait(500);
});

Then('the legal information page title should equal {string}', async function (this: AuraWorld, text: string) {
  const loc = this.page.locator(LegalInfoConstants.SELECTOR_PAGE_TITLE);
  await expect(loc).toHaveText(text);
});

Then('the legal information section 1 title should equal {string}', async function (this: AuraWorld, text: string) {
  const loc = this.page.locator(LegalInfoConstants.SELECTOR_SECTION_1_TITLE);
  await expect(loc).toHaveText(text);
});

Then('{string} section heading should be visible on legal info page', async function (this: AuraWorld, text: string) {
  await expect(this.page.getByRole('heading', { name: text, level: 2 })).toBeVisible();
});

Then('the URL should not contain {string}', async function (this: AuraWorld, fragment: string) {
  const url = this.page.url();
  expect(url.includes(fragment)).toBe(false);
});
