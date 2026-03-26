# Legal Information page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@legal
Feature: TuCreditoOnline Legal Information Page
  As a visitor
  I want to access the legal information page
  So that I can review legal notices, regulatory compliance, and data protection

  Background:
    Given the browser is on the "/legal" page

  @smoke @legal-title
  Scenario: Legal page displays the correct title
    Then I should see the heading "Legal Notice"

  @smoke @legal-sections
  Scenario: Legal page displays all content sections
    Then I should see the heading "Legal Notice"
    And I should see the section heading "1. Applicable Regulations"
    And I should see the section heading "2. Data Protection"
    And I should see the section heading "3. Limitation of Liability"
    And I should see the section heading "4. Regulatory Compliance"
    And I should see the section heading "5. Changes and Updates"

  @smoke @legal-i18n-portuguese
  Scenario: Legal page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Aviso Legal"
    And I should see the section heading "1. Regulamentações Aplicáveis"
    And I should see the section heading "2. Proteção de Dados"

  @smoke @legal-i18n-spanish
  Scenario: Legal page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Aviso Legal"
    And I should see the section heading "1. Regulaciones Aplicables"
    And I should see the section heading "2. Protección de Datos"

  @smoke @legal-language-switch
  Scenario: Language switching works on legal page
    When I switch language to "Español"
    Then I should see the heading "Aviso Legal"
    When I switch language to "English"
    Then I should see the heading "Legal Notice"
    When I switch language to "Português"
    Then I should see the heading "Aviso Legal"

  @smoke @legal-footer-link
  Scenario: Footer legal link navigates to legal page
    Given the browser is on the TuCreditoOnline home page
    When I click the footer link "Legal Notice"
    Then the URL should contain "/legal"
    And I should see the heading "Legal Notice"

  @smoke @legal-responsive
  Scenario: Legal page is responsive on mobile
    Given I use a mobile viewport
    And the browser is on the "/legal" page
    Then "button:Contact Us" should be visible
    And "link:Voltar ao Início" should be visible

  @smoke @legal-navigation-links
  Scenario: Legal page navigation links work correctly
    Then "button:Contact Us" should be visible
    And "link:Voltar ao Início" should be visible
    When I click on "button:Contact Us"
    Then the URL should contain "/contact"

