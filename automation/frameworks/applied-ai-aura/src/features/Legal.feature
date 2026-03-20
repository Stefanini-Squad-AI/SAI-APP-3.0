# Legal feature
# AC1 — Ruta y página dedicada
# AC2 — Navegación por pestañas funcional
# AC3 — Soporte multilenguaje completo
# AC4 — Entrada en la navegación principal

@legal
Feature: Pestaña de Informaciones Legales
  As a usuario visitante del sitio público de TuCreditoOnline
  I want acceder a una sección centralizada de Informaciones Legales con pestañas navegables
  So that pueda consultar cualquier documento legal de forma rápida y sin perderme

  Background:
    Given I navigate to the deployed pull request preview

  # ── AC1: Ruta y página dedicada ──────────────────────────────────────────────

  @preview @smoke
  Scenario: La ruta /legal carga la página de Informaciones Legales
    When I click on "Legal"
    Then the URL should contain "/legal"
    And "h1" should be visible
    And "h1" should have text "Informaciones Legales"

  @preview
  Scenario: La ruta /legal es accesible directamente por URL
    Given I navigate to the legal page
    Then the URL should contain "/legal"
    And "Informaciones Legales" should be visible

  # ── AC2: Navegación por pestañas funcional ────────────────────────────────────

  @preview
  Scenario: La pestaña Aviso Legal está activa por defecto al cargar /legal
    Given I navigate to the legal page
    Then "Aviso Legal tab" should be visible
    And "Aviso Legal panel" should be visible
    And "Política de Privacidad panel" should be hidden
    And "Términos y Condiciones panel" should be hidden

  @preview
  Scenario: Hacer clic en Política de Privacidad muestra el contenido correcto
    Given I navigate to the legal page
    When I click on "Política de Privacidad"
    Then "Política de Privacidad panel" should be visible
    And "Aviso Legal panel" should be hidden

  @preview
  Scenario: Hacer clic en Términos y Condiciones muestra el contenido correcto
    Given I navigate to the legal page
    When I click on "Términos y Condiciones"
    Then "Términos y Condiciones panel" should be visible
    And "Aviso Legal panel" should be hidden

  # ── AC3: Soporte multilenguaje completo ──────────────────────────────────────

  @preview @i18n
  Scenario: La página Legal muestra textos en inglés al seleccionar English
    Given I navigate to the legal page
    When I select "en" in "language-selector"
    Then "h1" should have text "Legal Information"
    And "Legal Notice" should be visible
    And "Privacy Policy" should be visible
    And "Terms and Conditions" should be visible

  @preview @i18n
  Scenario: La página Legal muestra textos en portugués al seleccionar Português
    Given I navigate to the legal page
    When I select "pt" in "language-selector"
    Then "h1" should have text "Informações Legais"
    And "Aviso Legal" should be visible
    And "Política de Privacidade" should be visible
    And "Termos e Condições" should be visible

  # ── AC4: Entrada en la navegación principal ───────────────────────────────────

  @preview
  Scenario: El enlace Legal en el header navega a /legal
    Then "Legal" should be visible
    When I click on "Legal"
    Then the URL should contain "/legal"

  @preview
  Scenario: El enlace Aviso Legal en el footer apunta a /legal
    When I click on "footer:Aviso Legal"
    Then the URL should contain "/legal"
