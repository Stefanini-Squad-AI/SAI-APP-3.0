/**
 * AURA — ContactPage Steps
 * Step definitions for the Contact page tabbed interface and legal information flow.
 * Each step is a single-line delegation to WebActions.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { ContactPageConstants } from '../constants/ContactPageConstants';

// ─── Given ────────────────────────────────────────────────────────────────────

Given('I navigate to the contact page', async function (this: AuraWorld) {
  await this.webActions.navigateTo(ContactPageConstants.CONTACT_URL);
});

// ─── When ─────────────────────────────────────────────────────────────────────

When('I switch to the {string} tab', async function (this: AuraWorld, tabName: string) {
  await this.webActions.click(`tab:${tabName}`);
});

When('I reload the contact page', async function (this: AuraWorld) {
  await this.webActions.reload();
});

// ─── Then ─────────────────────────────────────────────────────────────────────

Then('{string} tab should be active', async function (this: AuraWorld, tabName: string) {
  await this.webActions.expectAttribute(`tab:${tabName}`, 'aria-selected', 'true');
});

Then('{string} tab should be inactive', async function (this: AuraWorld, tabName: string) {
  await this.webActions.expectAttribute(`tab:${tabName}`, 'aria-selected', 'false');
});

Then('the contact form should be visible', async function (this: AuraWorld) {
  await this.webActions.expectVisible('form:contact');
});

Then('the contact form should be hidden', async function (this: AuraWorld) {
  await this.webActions.expectHidden('form:contact');
});

Then('the legal information section should be visible', async function (this: AuraWorld) {
  await this.webActions.expectVisible('section:Información Legal');
});

Then('the legal information section should be hidden', async function (this: AuraWorld) {
  await this.webActions.expectHidden('section:Información Legal');
});

Then('all legal sections should be visible', async function (this: AuraWorld) {
  await this.webActions.expectVisible('section:Términos y Condiciones');
  await this.webActions.expectVisible('section:Política de Privacidad');
  await this.webActions.expectVisible('section:Información de Regulación');
});

Then('tab selection should persist in localStorage', async function (this: AuraWorld) {
  const stored = await this.webActions.getLocalStorageItem('contactPage-activeTab');
  if (stored === null || stored === undefined) {
    throw new Error('contactPage-activeTab not found in localStorage');
  }
});

Then('the URL should remain at contact page', async function (this: AuraWorld) {
  await this.webActions.expectUrlContains('/contact');
});
