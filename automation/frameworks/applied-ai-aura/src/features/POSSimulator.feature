@smoke
Feature: POS Simulator - Payment Flow
  As a user
  I want to simulate payment flows through both online and terminal POS methods
  So that I can test the payment experience

  Background:
    Given I navigate to "/pos-simulator"

  Scenario: Online payment modal opens and displays payment summary
    When I click on "Continuar con Pago en Línea"
    Then "Pago en Línea" should be visible
    And "Monto a pagar:" should be visible
    And "🔒 Pago 100% seguro y encriptado" should be visible

  Scenario: Card form validation shows errors for invalid input
    When I click on "Continuar con Pago en Línea"
    And I click on "Continuar con tarjeta →"
    Then "Número de tarjeta inválido (16 dígitos)" should be visible

  Scenario: Card form accepts valid input and processes payment
    When I click on "Continuar con Pago en Línea"
    And I click on "Continuar con tarjeta →"
    And I type "4532123456789010" into "Número de tarjeta"
    And I type "Juan Perez" into "Nombre del titular"
    And I type "1225" into "Fecha de vencimiento"
    And I type "123" into "CVV"
    And I click on "Procesar Pago"
    And I wait 3000 milliseconds
    Then "¡Pago Procesado Exitosamente!" should be visible
    And "ONL-" should be visible

  Scenario: POS payment modal opens and displays terminal options
    When I click on "Continuar con Pago por POS"
    Then "Pago por Terminal POS" should be visible
    And "Monto total:" should be visible
    And "Número de cuotas:" should be visible
    And "ℹ️ Dirígete a cualquier terminal POS participante" should be visible

  Scenario: Terminal selection shows QR code
    When I click on "Continuar con Pago por POS"
    And I click on "Buscar Terminal →"
    And I click on "Seleccionar" in the page
    And I wait 2500 milliseconds
    Then "Terminal Lista" should be visible
    And "QR de pago" should be visible
    And "POS-" should be visible

  Scenario: Modal closes and resets on reopening
    When I click on "Continuar con Pago en Línea"
    And I click on "Cancelar"
    And I click on "Continuar con Pago en Línea"
    Then "Monto a pagar:" should be visible
    And "Datos de tu tarjeta" should be hidden
