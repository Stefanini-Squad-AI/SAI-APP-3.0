# POS Simulator feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)
# URL constants: POSSimulatorConstants.ts

@pos-simulator
Feature: POS Simulator — Special Products + Payment
  As a customer or advisor
  I want to simulate special banking products and calculate online/POS payment equivalents
  So that I can compare options and choose the best payment channel

  Background:
    Given the browser is on the POS Simulator page

  @smoke @pos-simulator-access
  Scenario: Access POS Simulator tab from navigation
    When I click the navigation link "Simulador POS"
    Then the URL should contain "pos-simulator"
    And "Simulador de Productos Especiales + Pago" should be visible

  @smoke @pos-simulator-form-visible
  Scenario: Form elements are visible and enabled
    Then "Formulario de Simulación" should be visible
    And 'select[name="productId"]' should be enabled
    And 'input[name="amount"]' should be enabled
    And 'input[name="termMonths"]' should be enabled
    And 'select[name="customerType"]' should be enabled

  @smoke @pos-simulator-successful-calculation
  Scenario: Successful simulation with valid data
    When I select product "Crédito Personal" in the product dropdown
    And I enter "50000" as the loan amount
    And I enter 12 as the term in months
    And I select "Persona Física" as the customer type
    And I click the Simulate button
    Then the simulation results should be visible
    And the monthly payment should be displayed
    And the total cost should be displayed

  @smoke @pos-simulator-missing-product
  Scenario: Validation error when product is missing
    When I enter "50000" as the loan amount
    And I enter 12 as the term in months
    And I click the Simulate button
    Then I should see an error message "Por favor selecciona un producto"

  @smoke @pos-simulator-missing-amount
  Scenario: Validation error when amount is missing
    When I select product "Crédito Personal" in the product dropdown
    And I enter 12 as the term in months
    And I click the Simulate button
    Then I should see an error message "El monto debe ser mayor a 0"

  @smoke @pos-simulator-missing-term
  Scenario: Validation error when term is missing
    When I select product "Crédito Personal" in the product dropdown
    And I enter "50000" as the loan amount
    And I click the Simulate button
    Then I should see an error message "El plazo debe ser mayor a 0"

  @smoke @pos-simulator-online-payment-available
  Scenario: Online payment option available for individual customer
    When I select product "Crédito Personal" in the product dropdown
    And I enter "75000" as the loan amount
    And I enter 24 as the term in months
    And I select "Persona Física" as the customer type
    And I click the Simulate button
    Then the online payment option should be "available"

  @smoke @pos-simulator-pos-payment-available
  Scenario: POS payment option available for individual customer
    When I select product "Crédito Personal" in the product dropdown
    And I enter "100000" as the loan amount
    And I enter 12 as the term in months
    And I select "Persona Física" as the customer type
    And I click the Simulate button
    Then the POS payment option should be "available"

  @smoke @pos-simulator-pos-payment-restricted-for-business
  Scenario: POS payment not available for business customers
    When I select product "Crédito Personal" in the product dropdown
    And I enter "100000" as the loan amount
    And I enter 12 as the term in months
    And I select "Persona Moral" as the customer type
    And I click the Simulate button
    Then the POS payment option should be "unavailable"

  @smoke @pos-simulator-breakdown-display
  Scenario: Simulation breakdown is displayed correctly
    When I select product "Crédito Personal" in the product dropdown
    And I enter "50000" as the loan amount
    And I enter 12 as the term in months
    And I click the Simulate button
    Then "Desglose" should be visible
    And "Monto del Préstamo" should be visible
    And "Tasa de Interés" should be visible
    And "Comisión" should be visible
    And "Seguro" should be visible

  @smoke @pos-simulator-action-buttons
  Scenario: Action buttons are available after simulation
    When I select product "Crédito Personal" in the product dropdown
    And I enter "50000" as the loan amount
    And I enter 12 as the term in months
    And I click the Simulate button
    And I take a screenshot
    Then "Continuar con Pago en Línea" should be visible
    And "Continuar con POS" should be visible
