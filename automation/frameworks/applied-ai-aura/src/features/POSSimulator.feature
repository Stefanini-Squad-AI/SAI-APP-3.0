@pos-simulator
Feature: POS Simulator
  As an advisor or authorized customer
  I want a POS Simulator tab to simulate banking products
  So that I can compare online vs POS payment options

  Background:
    Given the browser is on the "pos-simulator" page

  @smoke
  Scenario: Access POS Simulator tab from navigation
    When I click on "Simulador POS" in the page
    Then the URL should contain "pos-simulator"

  @smoke
  Scenario: Form elements are visible and enabled
    Then "select[name=\"productId\"]" should be visible
    And "input[name=\"amount\"]" should be visible
    And "input[name=\"termMonths\"]" should be visible
    And "select[name=\"customerType\"]" should be visible
    And "button:Simulate" should be enabled

  @smoke
  Scenario: Successful calculation for individual customer
    When I select "Personal Credit" in "select[name=\"productId\"]"
    And I type "50000" into "input[name=\"amount\"]"
    And I type "12" into "input[name=\"termMonths\"]"
    And I select "Persona Física" in "select[name=\"customerType\"]"
    And I click on "button:Simulate"
    Then "section:Simulation Results" should be visible

  @smoke
  Scenario: Missing product shows validation error
    When I type "50000" into "input[name=\"amount\"]"
    And I type "12" into "input[name=\"termMonths\"]"
    And I click on "button:Simulate"
    Then I should see an error message "Por favor selecciona un producto"

  @smoke
  Scenario: Invalid amount shows validation error
    When I select "Personal Credit" in "select[name=\"productId\"]"
    And I type "0" into "input[name=\"amount\"]"
    And I type "12" into "input[name=\"termMonths\"]"
    And I click on "button:Simulate"
    Then I should see an error message "El monto debe ser mayor a 0"

  @smoke
  Scenario: Missing term shows validation error
    When I select "Personal Credit" in "select[name=\"productId\"]"
    And I type "50000" into "input[name=\"amount\"]"
    And I click on "button:Simulate"
    Then I should see an error message "El plazo debe ser mayor a 0"

  @smoke
  Scenario: Online payment is available for individual
    When I select "Personal Credit" in "select[name=\"productId\"]"
    And I type "50000" into "input[name=\"amount\"]"
    And I type "12" into "input[name=\"termMonths\"]"
    And I select "Persona Física" in "select[name=\"customerType\"]"
    And I click on "button:Simulate"
    Then the online payment option should be "available"

  @smoke
  Scenario: POS payment is available for individual
    When I select "Personal Credit" in "select[name=\"productId\"]"
    And I type "50000" into "input[name=\"amount\"]"
    And I type "12" into "input[name=\"termMonths\"]"
    And I select "Persona Física" in "select[name=\"customerType\"]"
    And I click on "button:Simulate"
    Then the POS payment option should be "available"

  @smoke
  Scenario: POS payment is unavailable for business customer
    When I select "Personal Credit" in "select[name=\"productId\"]"
    And I type "50000" into "input[name=\"amount\"]"
    And I type "12" into "input[name=\"termMonths\"]"
    And I select "Persona Moral" in "select[name=\"customerType\"]"
    And I click on "button:Simulate"
    Then the POS payment option should be "unavailable"

  @smoke
  Scenario: Breakdown section displays correctly
    When I select "Personal Credit" in "select[name=\"productId\"]"
    And I type "50000" into "input[name=\"amount\"]"
    And I type "12" into "input[name=\"termMonths\"]"
    And I select "Persona Física" in "select[name=\"customerType\"]"
    And I click on "button:Simulate"
    Then "text:Desglose" should be visible
    And "text:Monto del Préstamo" should be visible
    And "text:Tasa de Interés" should be visible
    And "text:Comisión" should be visible
    And "text:Seguro" should be visible

  @smoke
  Scenario: Action buttons are visible
    When I select "Personal Credit" in "select[name=\"productId\"]"
    And I type "50000" into "input[name=\"amount\"]"
    And I type "12" into "input[name=\"termMonths\"]"
    And I select "Persona Física" in "select[name=\"customerType\"]"
    And I click on "button:Simulate"
    Then "button:Continuar con Pago en Línea" should be visible
    And "button:Continuar con POS" should be visible
