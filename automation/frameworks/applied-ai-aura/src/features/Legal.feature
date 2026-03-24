# Legal feature — TuCreditoOnline SPA (SAIAPP3-46)
# URL constants: LegalConstants.ts

@legal
Feature: Legal Information Page
  As a visitor
  I want to access a public legal information page via the header navigation
  So that I can review TuCreditoOnline's regulatory framework and consumer rights

  Background:
    Given I navigate to the deployed pull request preview

  @preview @legal-nav-visible
  Scenario: Legal nav link is visible in the header before Contact
    Then "link:Legal" should be visible

  @preview @legal-nav-navigates
  Scenario: Legal nav link navigates to the legal page
    When I click the navigation link "Legal"
    Then the URL should contain "/legal"

  @preview @legal-page-loads
  Scenario: Legal page loads with the correct heading in default language
    Given I navigate to the legal page
    Then "heading:Legal Information" should be visible
    And the URL should contain "/legal"

  @preview @legal-i18n-es
  Scenario: Legal page heading is displayed in Spanish
    Given I navigate to the legal page
    When I switch the app language to "es"
    Then "heading:Información Legal" should be visible

  @preview @legal-i18n-pt
  Scenario: Legal page heading is displayed in Portuguese
    Given I navigate to the legal page
    When I switch the app language to "pt"
    Then "heading:Informações Legais" should be visible

