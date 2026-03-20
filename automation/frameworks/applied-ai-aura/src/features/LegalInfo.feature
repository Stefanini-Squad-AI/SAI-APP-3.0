# LegalInfo.feature
# AC1 — Legal nav link in desktop header (i18n key header.legal)
# AC2 — Legal nav link in mobile menu
# AC3 — Route /legal registered in App.jsx, LegalPage rendered
# AC4 — Four sections visible; translated content in ES and PT
# AC5 — Footer Legal column links to /legal (no duplicate /terms)

@legal
Feature: Legal Information page
  As a site visitor
  I want to access legal information via the navigation header
  So that I can review regulatory and liability content in my language

  # ─── AC1 + AC3: Desktop header link navigates to /legal ───────────────────

  @preview @legal @navigation
  Scenario: Desktop header shows Legal link and navigates to /legal
    Given I navigate to the deployed pull request preview
    Then "Legal" should be visible
    When I click on "Legal"
    Then the URL should contain "/legal"
    And "Legal Information" should be visible

  # ─── AC2: Mobile menu shows Legal link after Contact ───────────────────────

  @preview @legal @navigation
  Scenario: Mobile menu shows Legal link after Contact
    Given I navigate to the deployed pull request preview
    When I click on "button:menu"
    Then "Legal" should be visible

  # ─── AC3 + AC4: /legal page renders all four required sections ─────────────

  @preview @legal @content
  Scenario: Legal page displays all required sections in English
    Given I navigate to "/legal" on the preview deployment
    Then the URL should contain "/legal"
    And "Legal Information" should be visible
    And "Regulatory Framework" should be visible
    And "Liability Disclaimer" should be visible
    And "Applicable Law" should be visible
    And "Legal Inquiries" should be visible

  # ─── AC4: Contact Us and Back to Home links present on /legal ──────────────

  @preview @legal @content
  Scenario: Legal page contact and back-to-home links are accessible
    Given I navigate to "/legal" on the preview deployment
    Then "Contact Us" should be visible
    And "Back to Home" should be visible

  # ─── AC4 i18n: Spanish locale renders translated legal content ─────────────

  @preview @legal @i18n
  Scenario: Legal page content renders in Spanish after language switch
    Given I navigate to "/legal" on the preview deployment
    When I click on "Español"
    Then "Información Legal" should be visible
    And "Marco Regulatorio" should be visible

  # ─── AC4 i18n: Portuguese locale renders translated legal content ──────────

  @preview @legal @i18n
  Scenario: Legal page content renders in Portuguese after language switch
    Given I navigate to "/legal" on the preview deployment
    When I click on "Português"
    Then "Informações Legais" should be visible
    And "Marco Regulatório" should be visible

  # ─── AC5: Footer Legal column contains /legal link ─────────────────────────

  @preview @legal @footer
  Scenario: Footer Legal column link navigates to /legal
    Given I navigate to the deployed pull request preview
    When I click on "Legal Information"
    Then the URL should contain "/legal"

  # ─── AC5: Footer Legal column has three distinct routes ────────────────────

  @preview @legal @footer
  Scenario: Footer Legal column has three distinct links including Legal Information
    Given I navigate to the deployed pull request preview
    Then "Privacy Policy" should be visible
    And "Terms and Conditions" should be visible
    And "Legal Information" should be visible
