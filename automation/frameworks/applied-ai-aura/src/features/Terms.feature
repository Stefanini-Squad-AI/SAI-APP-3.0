# Terms page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@terms
Feature: TuCreditoOnline Terms and Conditions Page
  As a visitor
  I want to view the terms and conditions
  So that I can understand the platform rules

  Background:
    Given the browser is on the "/terms" page

  @smoke @terms-title
  Scenario: Terms page displays the correct title
    Then I should see the heading "Terms and Conditions"

  @terms-footer-link
  Scenario: Footer terms link navigates to terms page
    Given the browser is on the TuCreditoOnline home page
    When I click the footer link "Terms and Conditions"
    Then the URL should contain "terms"
    And I should see the heading "Terms and Conditions"

  @terms-i18n-spanish
  Scenario: Terms page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Términos y Condiciones"

  @terms-i18n-portuguese
  Scenario: Terms page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Termos e Condições"
