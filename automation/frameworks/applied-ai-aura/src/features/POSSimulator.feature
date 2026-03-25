# POS Simulator feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)
# URL constants: POSSimulatorConstants.ts

@pos-simulator
Feature: TuCreditoOnline POS Simulator
  As a customer
  I want to simulate credit products and explore online and POS payment options
  So that I can understand different payment scenarios before committing

  Background:
    Given the browser is on the "pos-simulator" page

  @smoke @pos-simulator-page-load
  Scenario: POS Simulator page loads with form
    Then "Datos de la Simulación" should be visible
    And "Simulador de Pago POS" should be visible

  @smoke @pos-simulator-calculate
  Scenario: User can calculate simulation
    When I click on "Calcular"
    Then "Resumen de Cálculo" should be visible
    And "Continuar con Pago en Línea" should be visible

  @smoke @pos-simulator-online-modal
  Scenario: Online payment modal opens with summary
    When I click on "Calcular"
    And I wait 500 milliseconds
    And I click on "Continuar con Pago en Línea"
    Then "Pago en Línea" should be visible
    And "100% seguro y encriptado" should be visible

  @smoke @pos-simulator-individual-pos-available
  Scenario: POS payment option available for individuals
    When I click on "Calcular"
    And I wait 500 milliseconds
    Then "Continuar con POS" should be visible
    And "Continuar con POS" should be enabled

  @smoke @pos-simulator-pos-modal-opens
  Scenario: POS payment modal opens with terminal selection
    When I click on "Calcular"
    And I wait 500 milliseconds
    And I click on "Continuar con POS"
    Then "Selecciona Terminal" should be visible

  @smoke @pos-home-pos-cta-button
  Scenario: Home page has POS Simulator CTA button in hero
    Given the browser is on the "home" page
    Then "Simulador POS" should be visible

  @smoke @pos-home-promo-section
  Scenario: Home page has POS promotional section
    Given the browser is on the "home" page
    When I click on "Probar Simulador POS"
    Then the URL should contain "pos-simulator"

  @smoke @pos-simulator-form-adjust-values
  Scenario: User can adjust simulation values
    When I click on "Calcular"
    And I wait 500 milliseconds
    Then "Resumen de Cálculo" should be visible
    When I type "100000" into "amount"
    And I click on "Calcular"
    Then "Resumen de Cálculo" should be visible
