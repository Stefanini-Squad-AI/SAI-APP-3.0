@preview
Feature: Validate deployment health
  As a QA team
  I want to validate that the deployed application is available
  So that we can confirm the version responds correctly

  Scenario: Application is reachable and renders
    Given the browser is on the TuCreditoOnline home page
    Then I should see the heading "Online Credits"
    And I take a screenshot
