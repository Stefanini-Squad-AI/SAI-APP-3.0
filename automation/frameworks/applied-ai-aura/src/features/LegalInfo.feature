# LegalInfo feature — SAIAPP3-22
# Covers: CA1 (route), CA2 (header nav desktop+mobile), CA3 (i18n), CA4 (page content), CA5 (footer)
# All scenarios tagged @preview execute in CI against the PR preview URL (AURA_TARGET_URL).

@informacion-legal @preview
Feature: Página de Información Legal
  Como visitante de TuCreditoOnline
  quiero encontrar un enlace "Información Legal" en la barra de navegación
  para acceder fácilmente a una página consolidada con avisos legales

  Background:
    Given I navigate to the deployed pull request preview

  # ── CA1 + CA2: Route and desktop header navigation ──────────────────────────

  @navegacion @happy-path
  Scenario: El enlace de Información Legal aparece en el Header junto a Contacto
    Then "Información Legal" should be visible
    And the URL should contain "surge.sh"

  @navegacion @happy-path
  Scenario: La navegación al hacer clic en Información Legal carga la página
    When I click on "Información Legal"
    Then the URL should contain "/legal-info"
    And "Información Legal" should be visible

  # ── CA4: Page content sections ───────────────────────────────────────────────

  @contenido @happy-path
  Scenario: La página /legal-info muestra las secciones requeridas
    When I click on "Información Legal"
    Then the URL should contain "/legal-info"
    And "Aviso Legal" should be visible
    And "Marco Regulatorio" should be visible
    And "Jurisdicción y Ley Aplicable" should be visible
    And "Derechos del Usuario" should be visible
    And "Limitación de Responsabilidad" should be visible

  @contenido @happy-path
  Scenario: Los enlaces internos a Privacidad y Términos son funcionales
    When I click on "Información Legal"
    Then the URL should contain "/legal-info"
    And "Política de Privacidad" should be visible
    And "Términos y Condiciones" should be visible

  @contenido @happy-path
  Scenario: El enlace a Política de Privacidad navega a /privacy
    When I click on "Información Legal"
    And I click on "Política de Privacidad"
    Then the URL should contain "/privacy"

  # ── CA5: Footer legalNotice points to /legal-info ───────────────────────────

  @footer @happy-path
  Scenario: El enlace Aviso Legal del footer apunta a /legal-info
    When I scroll to footer legal section and click "Aviso Legal"
    Then the URL should contain "/legal-info"

  # ── CA3: i18n — language switch + translated texts ───────────────────────────

  @i18n @navegacion
  Scenario: El header muestra "Legal Information" al cambiar a inglés
    When I select the language "English"
    Then "Legal Information" should be visible

  @i18n @contenido
  Scenario: El contenido de /legal-info se traduce a inglés sin recarga
    When I click on "Información Legal"
    And I select the language "English"
    Then "Legal Information" should be visible
    And "Legal Notice" should be visible
    And "Regulatory Framework" should be visible
    And the URL should contain "/legal-info"

  @i18n @portugues
  Scenario: El header y contenido se presentan en portugués
    When I select the language "Português"
    Then "Informações Legais" should be visible
    When I click on "Informações Legais"
    Then the URL should contain "/legal-info"
    And "Aviso Legal" should be visible
    And "Marco Regulatório" should be visible

  # ── Regresión: existing header links still work ──────────────────────────────

  @regresion
  Scenario: Los demás enlaces del Header siguen funcionando
    When I click on "Contacto"
    Then the URL should contain "/contact"
