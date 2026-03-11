@home @smoke @ci
Feature: Home Page
  As a visitor
  I want to view the TuCreditoOnline home page
  So that I can learn about the available services

  Background:
    Given I navigate to the home page

  @home-sections
  Scenario: All main sections are visible
    Then I should see the section "about us"
    And I should see the section "our services"
    And I should see the section "visit us"

  @home-navigation
  Scenario: Navigation links are accessible
    Then the navigation bar should be visible
    And I should see a link to "Services"
    And I should see a link to "Calculator"

  @home-hero @ci
  Scenario: Hero section calls to action are present
    Then I should see the hero section
    And I should see a button to apply for credit
