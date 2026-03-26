# Legal Information page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@legal
Feature: TuCreditoOnline Legal Information Page
  As a visitor
  I want to access the legal information page
  So that I can review legal and regulatory information

  Background:
    Given the browser is on the "legal" page

  @smoke @legal-title
  Scenario: Legal Information page displays the correct title in English
    Then I should see the heading "Legal Information"

  @legal-sections
  Scenario: Legal Information page displays all content sections
    Then I should see the heading "Legal Information"
    And I should see the section heading "1. Regulatory Information"
    And I should see the section heading "5. Legal Contact"

  @legal-i18n-spanish
  Scenario: Legal Information page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Información Legal"
    And I should see the section heading "1. Información Regulatoria"
    And I should see the section heading "5. Contacto Legal"

  @legal-i18n-portuguese
  Scenario: Legal Information page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Informações Legais"
    And I should see the section heading "1. Informações Regulatórias"
    And I should see the section heading "5. Contato Legal"

  @legal-language-switch
  Scenario: Language switching works on legal information page
    When I switch language to "Español"
    Then I should see the heading "Información Legal"
    When I switch language to "English"
    Then I should see the heading "Legal Information"
    When I switch language to "Português"
    Then I should see the heading "Informações Legais"

  @legal-menu-link
  Scenario: Legal Information link visible in navigation menu
    Given the browser is on the TuCreditoOnline home page
    When I click on "Legal Information" in the page
    Then the URL should contain "legal"
    And I should see the heading "Legal Information"

  @legal-menu-link-spanish
  Scenario: Legal Information link visible in Spanish navigation
    Given the browser is on the TuCreditoOnline home page
    When I switch language to "Español"
    And I click on "Información Legal" in the page
    Then the URL should contain "legal"
    And I should see the heading "Información Legal"

  @legal-navigation-order
  Scenario: Legal Information link is positioned before Contact in menu
    Given the browser is on the TuCreditoOnline home page
    Then the navigation should have "Legal Information" before "Contact"

  @legal-contact-button
  Scenario: Contact Us button on legal page works
    Then "Contact Us" should be visible
    When I click on "Contact Us" in the page
    Then the URL should contain "contact"
