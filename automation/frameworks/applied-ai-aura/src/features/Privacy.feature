# Privacy Policy page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@privacy
Feature: TuCreditoOnline Privacy Policy Page
  As a visitor
  I want to access the privacy policy page
  So that I can review how my data is handled

  Background:
    Given the browser is on the privacy page

  @smoke @privacy-title
  Scenario: Privacy page displays the correct title
    Then I should see the heading "Privacy Policy"

  @privacy-sections
  Scenario: Privacy page displays all content sections
    Then I should see the heading "Privacy Policy"
    And I should see the section heading "1. Information We Collect"
    And I should see the section heading "2. How We Use Your Information"

  @privacy-i18n-spanish
  Scenario: Privacy page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Política de Privacidad"
    And I should see the section heading "1. Información que Recopilamos"

  @privacy-i18n-portuguese
  Scenario: Privacy page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Política de Privacidade"
    And I should see the section heading "1. Informações que Coletamos"

  @privacy-language-switch
  Scenario: Language switching works on privacy page
    When I switch language to "Español"
    Then I should see the heading "Política de Privacidad"
    When I switch language to "English"
    Then I should see the heading "Privacy Policy"

  @privacy-footer-link
  Scenario: Footer privacy policy link navigates to privacy page
    Given the browser is on the TuCreditoOnline home page
    When I click the footer link "Privacy Policy"
    Then the URL should contain "privacy"
    And I should see the heading "Privacy Policy"
