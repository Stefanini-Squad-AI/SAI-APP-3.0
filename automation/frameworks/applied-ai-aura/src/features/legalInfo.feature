@legal-info
Feature: Página de Información Legal
  Como usuario de TuCreditoOnline
  Quiero acceder a la página de Información Legal desde el menú de navegación principal
  Para consultar los términos legales, política de privacidad y avisos legales vigentes

  Background:
    Given I navigate to the deployed pull request preview

  @preview @legal-info @smoke
  Scenario: Enlace "Información Legal" es visible en el menú de navegación junto a "Contacto"
    Then "Información Legal" should be visible
    And "Contacto" should be visible

  @preview @legal-info
  Scenario: Clic en "Información Legal" navega a /informacion-legal sin recarga
    When I click on "Información Legal"
    Then the URL should contain "/informacion-legal"
    And "Información Legal" should be visible

  @preview @legal-info
  Scenario: Página /informacion-legal carga y muestra las secciones de contenido legal requeridas
    Given I navigate to the legal information page
    Then the URL should contain "/informacion-legal"
    And "Términos y Condiciones" should be visible
    And "Política de Privacidad" should be visible
    And "Aviso Legal" should be visible

  @preview @legal-info
  Scenario: Menú móvil muestra y funciona el enlace "Información Legal"
    Given the viewport is 375 pixels wide
    When I click on "mobile menu toggle"
    Then "Información Legal" should be visible
    When I click on "Información Legal"
    Then the URL should contain "/informacion-legal"

  @preview @legal-info @regression
  Scenario: Regresión — el enlace "Contacto" no es afectado por el cambio
    When I click on "Contacto"
    Then the URL should contain "/contact"
