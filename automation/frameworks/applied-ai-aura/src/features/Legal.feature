# Legal Notice page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@legal
Feature: TuCreditoOnline Legal Notice Page
  As a visitor
  I want to access the legal notice page
  So that I can review the company's legal information

  Background:
    Given the browser is on the "legal" page

  @smoke @legal-title
  Scenario: Legal page displays the correct title
    Then I should see the heading "Legal Notice"

  @smoke @legal-sections
  Scenario: Legal page displays all content sections
    Then I should see the heading "Legal Notice"
    And I should see the section heading "1. Company Information"
    And I should see the section heading "2. Service Terms"

  @smoke @legal-i18n-spanish
  Scenario: Legal page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Aviso Legal"
    And I should see the section heading "1. Información de la Empresa"

  @smoke @legal-i18n-english
  Scenario: Legal page displays correctly in English
    When I switch language to "English"
    Then I should see the heading "Legal Notice"
    And I should see the section heading "1. Company Information"

  @smoke @legal-i18n-portuguese
  Scenario: Legal page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Aviso Legal"
    And I should see the section heading "1. Informações da Empresa"

  @legal-language-switch
  Scenario: Language switching works on legal page
    When I switch language to "Español"
    Then I should see the heading "Aviso Legal"
    When I switch language to "English"
    Then I should see the heading "Legal Notice"

  @legal-navigation
  Scenario: Legal link is visible in navigation
    Given the browser is on the TuCreditoOnline home page
    When I click the navigation link "Legal"
    Then the URL should contain "legal"
    And I should see the heading "Legal Notice"

  @legal-footer-link
  Scenario: Footer legal link navigates to legal page
    Given the browser is on the TuCreditoOnline home page
    When I click the footer link "Legal"
    Then the URL should contain "legal"
    And I should see the heading "Legal Notice"

