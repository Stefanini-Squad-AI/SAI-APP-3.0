@legal-information
Feature: Legal Information page
  As a public site visitor
  I want to access consolidated legal information from the navigation header
  So that I can read TuCreditoOnline's regulatory, IP, liability, and governing-law disclosures in my language

  Background:
    Given I navigate to the deployed pull request preview

  # AC1 — Desktop header shows Legal Information link
  @preview @legal-navigation @happy-path
  Scenario: Legal Information link is visible in desktop header
    Then "Legal Information" should be visible

  # AC1 + AC3 — Clicking the link navigates to /legal
  @preview @legal-navigation @happy-path
  Scenario: Clicking Legal Information link navigates to /legal
    When I click on "Legal Information"
    Then the URL should contain "/legal"
    And "Legal Information" should be visible

  # AC3 + AC4 — All four required sections render in English
  @preview @legal-content @happy-path
  Scenario: Legal page displays all four required sections in English
    When I click on "Legal Information"
    Then the URL should contain "/legal"
    And "Regulatory Framework" should be visible
    And "Intellectual Property" should be visible
    And "Limitation of Liability" should be visible
    And "Governing Law" should be visible

  # AC4 — Language switch to Spanish reflects translated headings
  @preview @language-switch
  Scenario: Legal page headings update when switching to Spanish
    When I click on "Legal Information"
    And I click on "Español"
    Then "Marco Regulatorio" should be visible
    And "Propiedad Intelectual" should be visible
    And "Limitación de Responsabilidad" should be visible
    And "Ley Aplicable" should be visible

  # AC4 — Language switch to Portuguese reflects translated headings
  @preview @language-switch
  Scenario: Legal page headings update when switching to Portuguese
    When I click on "Legal Information"
    And I click on "Português"
    Then "Marco Regulatório" should be visible
    And "Propriedade Intelectual" should be visible
    And "Limitação de Responsabilidade" should be visible
    And "Lei Aplicável" should be visible

  # AC5 — Footer Legal Notice link routes to /legal
  @preview @legal-footer @happy-path
  Scenario: Footer Legal Notice link navigates to /legal
    When I click on "Legal Notice"
    Then the URL should contain "/legal"
    And "Legal Information" should be visible
