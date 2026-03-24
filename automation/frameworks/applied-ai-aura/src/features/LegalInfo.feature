# LegalInfo feature — SAIAPP3-44
# Validates the new /legal page, header navigation link, footer link, and i18n support.

@legal
Feature: Página de Información Legal
  As a usuario público del sitio
  I want to access the legal information page
  So that I can read the legal notice of the platform

  # AC1 — Ruta /legal existe y renderiza sin error
  @preview
  Scenario: La página de Información Legal carga correctamente
    Given I navigate to the deployed pull request preview
    When I navigate to "/legal"
    Then the URL should contain "/legal"
    And "h1" should be visible

  # AC2 — Enlace en Header junto a Contacto (escritorio)
  @preview
  Scenario: El enlace de Información Legal es visible en el menú de navegación
    Given I navigate to the deployed pull request preview
    Then "Información Legal" should be visible
    And "Contacto" should be visible

  # AC2 — Navegación desde menú principal a /legal
  @preview
  Scenario: Navegar al enlace de Información Legal lleva a la ruta correcta
    Given I navigate to the deployed pull request preview
    When I click on "Información Legal"
    Then the URL should contain "/legal"
    And "h1" should be visible

  # AC3 — Hero y al menos dos secciones de contenido visibles
  @preview
  Scenario: El hero y las secciones de contenido de la página legal son visibles
    Given I navigate to the deployed pull request preview
    When I navigate to "/legal"
    Then "h1" should be visible
    And "Aviso Legal" should be visible
    And "Limitación de Responsabilidad" should be visible

  # AC4 — Footer "Aviso Legal" apunta a /legal
  @preview
  Scenario: El enlace Aviso Legal del footer navega a /legal
    Given I navigate to the deployed pull request preview
    When I click on "Aviso Legal"
    Then the URL should contain "/legal"

  # AC5 — i18n: cambio de idioma a inglés se refleja en la página
  @preview
  Scenario: El cambio de idioma a inglés se refleja en la página de Información Legal
    Given I navigate to the deployed pull request preview
    When I navigate to "/legal"
    And I click on "English"
    Then "h1" should be visible
    And "Legal" should be visible
    And the URL should contain "/legal"
