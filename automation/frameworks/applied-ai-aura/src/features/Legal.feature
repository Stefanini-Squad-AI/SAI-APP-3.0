# Legal Information page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@legal
Feature: TuCreditoOnline Legal Information Page
  As a visitor
  I want to access the legal information page
  So that I can review all legal documents in one centralized location

  Background:
    Given the browser is on the "/legal" page

  @smoke @legal-title
  Scenario: Legal page displays the correct title
    Then I should see the heading "Legal Information"

  @legal-sections
  Scenario: Legal page displays all three legal sections
    Then I should see the heading "Legal Information"
    And I should see the section heading "Privacy Policy"
    And I should see the section heading "Terms and Conditions"
    And I should see the section heading "Legal Notice"

  @legal-i18n-spanish
  Scenario: Legal page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Informaciones Legales"
    And I should see the section heading "Política de Privacidad"
    And I should see the section heading "Términos y Condiciones"
    And I should see the section heading "Aviso Legal"

  @legal-i18n-portuguese
  Scenario: Legal page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Informações Legais"
    And I should see the section heading "Política de Privacidade"
    And I should see the section heading "Termos e Condições"
    And I should see the section heading "Aviso Legal"

  @legal-language-switch
  Scenario: Language switching works on legal page
    When I switch language to "Español"
    Then I should see the heading "Informaciones Legales"
    When I switch language to "English"
    Then I should see the heading "Legal Information"

  @legal-footer-link
  Scenario: Footer legal information link navigates to legal page
    Given the browser is on the TuCreditoOnline home page
    When I click the footer link "Legal Information"
    Then the URL should contain "legal"
    And I should see the heading "Legal Information"

  @legal-privacy-link
  Scenario: Legal page provides link to privacy policy
    When I click on "Read More" in the page
    Then the URL should contain "privacy"
    And I should see the heading "Privacy Policy"

  @legal-responsive-desktop
  Scenario: Legal page displays correctly on desktop
    Then I should see the heading "Legal Information"
    And "section" should be visible

  @legal-responsive-mobile
  Scenario: Legal page displays correctly on mobile
    Given I use a mobile viewport
    Then I should see the heading "Legal Information"
