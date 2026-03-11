/**
 * Step definitions for the Calculator page feature.
 */
import { Then, When } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';

Then(
  /^I should see the credit type selector$|^debo ver el selector de tipo de crédito$|^devo ver o seletor de tipo de crédito$/,
  async function (this: AuraWorld) {
    await this.webActions.expectVisible('select');
  }
);

Then(
  /^I should see the monthly payment result$|^debo ver el resultado del pago mensual$|^devo ver o resultado do pagamento mensal$/,
  async function (this: AuraWorld) {
    // The calculator shows results after credit types load; wait up to 5s
    await this.webActions.waitForElement('[class*="result"], [class*="payment"], [class*="cuota"]', 5000);
    await this.webActions.expectVisible('[class*="result"], [class*="payment"], [class*="cuota"]');
  }
);

Then(
  /^I should see the "([^"]*)" button$|^debo ver el botón "([^"]*)"$|^devo ver o botão "([^"]*)"$/,
  async function (this: AuraWorld, ...args: (string | undefined)[]) {
    const label = args.find(a => a !== undefined) as string;
    await this.webActions.expectVisible(`button:has-text("${label}"), a:has-text("${label}")`);
  }
);

When(
  /^I click on "([^"]*)"$|^hago clic en "([^"]*)"$|^clico em "([^"]*)"$/,
  async function (this: AuraWorld, ...args: (string | undefined)[]) {
    const label = args.find(a => a !== undefined) as string;
    await this.I.on(`button:has-text("${label}"), a:has-text("${label}")`).click();
    await this.webActions.waitForVisualLoad();
  }
);
