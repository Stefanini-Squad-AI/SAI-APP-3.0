# Legal Information page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@legal
Feature: TuCreditoOnline Legal Information Page
  As a visitor
  I want to access the legal information page
  So that I can review the legal framework and responsibilities

  Background:
    Given the browser is on the "legal" page

  @smoke @legal-title
  Scenario: Legal page displays the correct title in English
    Then I should see the heading "Legal Information"

  @legal-sections
  Scenario: Legal page displays all content sections
    Then I should see the heading "Legal Information"
    And I should see the section heading "1. Legal Framework and Operations"
    And I should see the section heading "2. Data Protection and Security"

  @legal-i18n-spanish
  Scenario: Legal page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Información Legal"
    And I should see the section heading "1. Marco Legal y Operaciones"

  @legal-i18n-portuguese
  Scenario: Legal page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Informação Legal"
    And I should see the section heading "1. Marco Legal e Operações"

  @legal-language-switch
  Scenario: Language switching works on legal page
    When I switch language to "Español"
    Then I should see the heading "Información Legal"
    When I switch language to "English"
    Then I should see the heading "Legal Information"

  @legal-footer-link
  Scenario: Navigation link to legal page works
    Given the browser is on the TuCreditoOnline home page
    When I click the navigation link "Legal Information"
    Then the URL should contain "legal"
    And I should see the heading "Legal Information"

  @legal-menu-order-desktop
  Scenario: Legal link appears before Contact in desktop menu
    Given the browser is open on the TuCreditoOnline home page
    Then "Legal Information" should be visible
    And "Contact" should be visible

  @legal-menu-order-mobile
  Scenario: Legal link appears before Contact in mobile menu
    Given I use a mobile viewport
    And the browser is open on the TuCreditoOnline home page
    When I click on "button:menu"
    Then "Legal Information" should be visible
    And "Contact" should be visible
