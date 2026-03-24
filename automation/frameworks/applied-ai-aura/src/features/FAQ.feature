# FAQ page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@faq
Feature: TuCreditoOnline FAQ Page
  As a visitor
  I want to view the FAQ page
  So that I can find answers to common questions

  Background:
    Given the browser is on the "/faq" page

  @smoke @faq-title
  Scenario: FAQ page displays the correct title
    Then I should see the heading "Frequently Asked Questions"

  @faq-nav
  Scenario: Header FAQ link navigates to FAQ page
    Given the browser is on the TuCreditoOnline home page
    When I click the navigation link "FAQ"
    Then the URL should contain "faq"
    And I should see the heading "Frequently Asked Questions"

  @faq-i18n-spanish
  Scenario: FAQ page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Preguntas Frecuentes"

  @faq-i18n-portuguese
  Scenario: FAQ page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Perguntas Frequentes"
