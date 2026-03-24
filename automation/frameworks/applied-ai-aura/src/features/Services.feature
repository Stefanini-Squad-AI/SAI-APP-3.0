# Services page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@services
Feature: TuCreditoOnline Services Page
  As a visitor
  I want to view the services page
  So that I can explore available credit options

  Background:
    Given the browser is on the "/services" page

  @smoke @services-title
  Scenario: Services page displays the correct title
    Then I should see the heading "Our Services"

  @services-nav
  Scenario: Header services link navigates to services page
    Given the browser is on the TuCreditoOnline home page
    When I click the navigation link "Services"
    Then the URL should contain "services"
    And I should see the heading "Our Services"

  @services-i18n-spanish
  Scenario: Services page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Nuestros Servicios"

  @services-i18n-portuguese
  Scenario: Services page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Nossos Serviços"
