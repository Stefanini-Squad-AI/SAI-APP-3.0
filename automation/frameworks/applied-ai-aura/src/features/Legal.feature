# Legal Information page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@legal
Feature: TuCreditoOnline Legal Information Page
  As a visitor
  I want to access the legal information page
  So that I can review legal disclaimers, regulatory compliance, and intellectual property information

  Background:
    Given the browser is on the "/legal" page

  @smoke @legal-title
  Scenario: Legal page displays the correct title
    Then I should see the heading "Legal Information"

  @smoke @legal-sections
  Scenario: Legal page displays all content sections
    Then I should see the heading "Legal Information"
    And I should see the section heading "1. Legal Disclaimer"
    And I should see the section heading "2. Regulatory Compliance"
    And I should see the section heading "3. Liability Disclaimer"
    And I should see the section heading "4. Intellectual Property"

  @legal-i18n-spanish
  Scenario: Legal page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Informacion Legal"
    And I should see the section heading "1. Aviso Legal"
    And I should see the section heading "2. Cumplimiento Regulatorio"

  @legal-i18n-portuguese
  Scenario: Legal page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Informacoes Legais"
    And I should see the section heading "1. Aviso Legal"
    And I should see the section heading "2. Conformidade Regulatoria"

  @legal-language-switch
  Scenario: Language switching works on legal page
    When I switch language to "Español"
    Then I should see the heading "Informacion Legal"
    When I switch language to "English"
    Then I should see the heading "Legal Information"

  @legal-navigation
  Scenario: Navigation links on legal page are functional
    When I click on "Contact Us"
    Then the URL should contain "contact"

  @legal-direct-access
  Scenario: Direct access to /legal URL loads page without errors
    Given I navigate to "/legal"
    Then the URL should contain "/legal"
    And I should see the heading "Legal Information"

  @legal-header-navigation
  Scenario: Header navigation link to legal page
    Given the browser is on the TuCreditoOnline home page
    When I click the navigation link "Legal Information"
    Then the URL should contain "/legal"
    And I should see the heading "Legal Information"

