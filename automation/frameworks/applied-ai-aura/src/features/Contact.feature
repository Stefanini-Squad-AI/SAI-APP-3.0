# Contact page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@contact
Feature: TuCreditoOnline Contact Page
  As a visitor
  I want to view the contact page
  So that I can reach the company

  Background:
    Given the browser is on the "/contact" page

  @smoke @contact-title
  Scenario: Contact page displays the correct title
    Then I should see the heading "Contact Us"

  @contact-nav
  Scenario: Header contact link navigates to contact page
    Given the browser is on the TuCreditoOnline home page
    When I click the navigation link "Contact"
    Then the URL should contain "contact"
    And I should see the heading "Contact Us"

  @contact-i18n-spanish
  Scenario: Contact page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Contáctanos"

  @contact-i18n-portuguese
  Scenario: Contact page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Contato"
