@skip-ci
Feature: Home page of TuCreditoOnline
  As a user
  I want to view the home page of the TuCreditoOnline application
  In order to verify that the language switcher works correctly

  Background:
    Given the browser is open

  @home-language-change
  Scenario: Switch language to English on the home page
    Given I navigate to the TuCreditoOnline home page
    When I click the language dropdown next to the admin login button
    And I select English
    Then I should see the section titles "about us", "our services" and "visit us"
