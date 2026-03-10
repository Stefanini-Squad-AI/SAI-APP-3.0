@demo-sai3
Feature: Services page of TuCreditoOnline in English (TCO-19)
  As a user
  I want to switch to English and navigate to Services
  In order to verify that the Services page titles are displayed correctly in English

  Background:
    Given the browser is open

  @services-english-titles
  Scenario: Switch to English, navigate to Services and verify titles
    Given I navigate to the application
    When I click the language dropdown next to the admin login button
    And I select English
    When I click the "Services" option in the top navigation menu
    Then I should see the titles "Our Services" and "Not sure which one to choose?" in the services view
