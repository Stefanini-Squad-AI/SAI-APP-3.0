import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { POSSimulatorConstants } from '../constants/POSSimulatorConstants';

/**
 * AURA - POS Simulator Steps
 * Step definitions for POS Simulator feature.
 * Each step delegates to webActions with minimal logic.
 */

Given('the browser is on the {string} page', async function (this: AuraWorld, route: string) {
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  await this.webActions.navigateTo(
    `${POSSimulatorConstants.BASE_URL}${normalizedRoute}`
  );
});

When('I select {string} in the product dropdown', async function (this: AuraWorld, productName: string) {
  await this.webActions.selectOption('select[name="productId"]', productName);
});

When('I enter {string} as the loan amount', async function (this: AuraWorld, amount: string) {
  await this.webActions.fill('input[name="amount"]', amount);
});

When('I enter {int} as the term in months', async function (this: AuraWorld, months: number) {
  await this.webActions.fill('input[name="termMonths"]', months.toString());
});

When('I select {string} as the customer type', async function (this: AuraWorld, customerType: string) {
  await this.webActions.selectOption('select[name="customerType"]', customerType);
});

When('I click the Simulate button', async function (this: AuraWorld) {
  await this.webActions.click('button:Simulate');
});

Then('the simulation results should be visible', async function (this: AuraWorld) {
  await this.webActions.expectVisible('section:Simulation Results');
});

Then('the monthly payment should be displayed', async function (this: AuraWorld) {
  await this.webActions.expectVisible('text:Monthly Payment');
});

Then('the total cost should be displayed', async function (this: AuraWorld) {
  await this.webActions.expectVisible('text:Total Cost');
});

Then('the online payment option should be {string}', async function (this: AuraWorld, status: string) {
  if (status === 'available') {
    await this.webActions.expectVisible('text:Disponible');
  } else {
    await this.webActions.expectVisible('text:No Disponible');
  }
});

Then('the POS payment option should be {string}', async function (this: AuraWorld, status: string) {
  if (status === 'available') {
    // Check if POS card has an available badge
    await this.webActions.expectVisible('div:contains("Pago por POS") ~ div:contains("Disponible")');
  } else {
    // Check if POS card shows unavailable badge or not available state
    await this.webActions.expectVisible('div:contains("Pago por POS") ~ div:contains("Indisponible")');
  }
});

Then('I should see an error message {string}', async function (this: AuraWorld, errorMessage: string) {
  await this.webActions.expectVisible(`div.bg-red-50 >> text:${errorMessage}`);
});
