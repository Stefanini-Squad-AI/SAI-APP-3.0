# About page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@about
Feature: TuCreditoOnline About Page
  As a visitor
  I want to view the about page
  So that I can learn about the company

  Background:
    Given the browser is on the "/about" page

  @smoke @about-title
  Scenario: About page displays the correct title
    Then I should see the heading "About Us"

  @about-nav
  Scenario: Header about link navigates to about page
    Given the browser is on the TuCreditoOnline home page
    When I click the navigation link "About Us"
    Then the URL should contain "about"
    And I should see the heading "About Us"

  @about-i18n-spanish
  Scenario: About page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Sobre Nosotros"

  @about-i18n-portuguese
  Scenario: About page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Sobre Nós"
