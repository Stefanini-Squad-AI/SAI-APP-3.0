/**
 * Common step definitions reusable across all features.
 * Each regex matches the English, Spanish, and Portuguese variants of the same step.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import type { AuraWorld } from '../cucumber/world/AuraWorld';
import { AppConstants } from '../constants/AppConstants';

// ─── Navigation ───────────────────────────────────────────────────────────────

Given(
  /^I navigate to the home page$|^que navego a la página principal$|^que navego para a página inicial$/,
  async function (this: AuraWorld) {
    await this.webActions.navigate(AppConstants.BASE_URL + AppConstants.ROUTES.HOME);
  }
);

Given(
  /^I navigate to the calculator page$|^que navego a la página de la calculadora$|^que navego para a página da calculadora$/,
  async function (this: AuraWorld) {
    await this.webActions.navigate(AppConstants.BASE_URL + AppConstants.ROUTES.CALCULATOR);
  }
);

Given(
  /^I navigate to the services page$|^que navego a la página de servicios$|^que navego para a página de serviços$/,
  async function (this: AuraWorld) {
    await this.webActions.navigate(AppConstants.BASE_URL + AppConstants.ROUTES.SERVICES);
  }
);

// ─── Navigation Assertions ────────────────────────────────────────────────────

Then(
  /^the navigation bar should be visible$|^la barra de navegación debe ser visible$|^a barra de navegação deve estar visível$/,
  async function (this: AuraWorld) {
    await this.webActions.expectVisible('nav');
  }
);

Then(
  /^I should see a link to "([^"]*)"$|^debo ver un enlace a "([^"]*)"$|^debo ver um link para "([^"]*)"$/,
  async function (this: AuraWorld, text: string) {
    await this.webActions.expectVisible(`a:has-text("${text}")`);
  }
);

// ─── Generic Assertions ───────────────────────────────────────────────────────

Then(
  /^I should see the hero section$|^debo ver la sección hero$|^devo ver a seção hero$/,
  async function (this: AuraWorld) {
    await this.webActions.expectVisible('section');
  }
);

Then(
  /^I should see a button to apply for credit$|^debo ver un botón para solicitar un crédito$|^devo ver um botão para solicitar crédito$/,
  async function (this: AuraWorld) {
    await this.webActions.expectVisible('a[href*="calculator"], button:has-text("Apply"), a:has-text("Apply"), a:has-text("Solicitar"), a:has-text("Solicite")');
  }
);

Then(
  /^I should see the credit request form$|^debo ver el formulario de solicitud de crédito$|^devo ver o formulário de solicitação de crédito$/,
  async function (this: AuraWorld) {
    await this.webActions.expectVisible('form, [role="dialog"], .wizard, [class*="wizard"]');
  }
);
