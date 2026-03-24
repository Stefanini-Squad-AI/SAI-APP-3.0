# Home feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)
# URL constants: HomeConstants.ts

@home
Feature: TuCreditoOnline Home Page
  As a visitor
  I want to use the home page hero and header navigation
  So that I can reach the credit calculator, services catalog, and admin login

  Background:
    Given the browser is open on the TuCreditoOnline home page

  @smoke @home-hero-calculator
  Scenario: Hero primary CTA navigates to credit calculator
    When I click the link "Apply for Credit"
    Then the URL should contain "calculator"

  @smoke @home-hero-services
  Scenario: Hero secondary CTA navigates to services
    When I click the link "View Services"
    Then the URL should contain "services"

  @smoke @home-header-admin
  Scenario: Header admin link navigates to admin login
    When I click the link "Admin Login"
    Then the URL should contain "admin/login"

  @smoke @home-header-calculator
  Scenario: Header calculator link navigates to calculator
    When I click the navigation link "Calculator"
    Then the URL should contain "calculator"
