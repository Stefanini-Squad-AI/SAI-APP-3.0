# Legal Information Page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)
# URL constants: LegalConstants.ts

@legal
Feature: TuCreditoOnline Legal Information Page
  As a visitor
  I want to access the legal information page from the main header menu
  So that I can review legal notices and regulatory information

  Background:
    Given I navigate to the deployed pull request preview

  @preview @legal-nav-desktop
  Scenario: Legal information link is visible in desktop menu
    When I click on "header" in the page
    Then "nav:Legal Information" should be visible

  @preview @legal-nav-positioning
  Scenario: Legal information link appears before Contact in desktop menu
    Then "nav:Legal Information" should be visible
    And "nav:Contact" should be visible

  @preview @legal-nav-mobile
  Scenario: Legal information link is visible in mobile menu
    When I click on "Mobile menu button" in the page
    Then "nav:Legal Information" should be visible

  @preview @legal-page-navigation
  Scenario: Clicking legal information link navigates to legal page
    When I click on "nav:Legal Information"
    Then the URL should contain "legal"
    And "h1:Legal Information" should be visible

  @preview @legal-content-english
  Scenario: Legal page displays correctly in English
    When I navigate to "/legal"
    Then "h1:Legal Information" should be visible
    And "h2:1. Legal Notices" should be visible
    And "h2:2. Regulatory Compliance" should be visible

  @preview @legal-content-spanish
  Scenario: Legal page displays correctly in Spanish
    When I navigate to "/legal"
    And I click on "language:Español" in the page
    Then "h1:Información Legal" should be visible
    And "h2:1. Avisos Legales" should be visible

  @preview @legal-content-portuguese
  Scenario: Legal page displays correctly in Portuguese
    When I navigate to "/legal"
    And I click on "language:Português" in the page
    Then "h1:Informação Legal" should be visible
    And "h2:1. Avisos Legais" should be visible

  @preview @legal-language-switch
  Scenario: Language switching works on legal page
    When I navigate to "/legal"
    And I click on "language:Español" in the page
    Then "h1:Información Legal" should be visible
    When I click on "language:English" in the page
    Then "h1:Legal Information" should be visible
