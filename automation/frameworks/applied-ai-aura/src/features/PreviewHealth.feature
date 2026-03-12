@preview @demo-sai3
Feature: Validate PR preview deployment
  As a QA team
  I want to validate that the PR preview is available
  So that we can confirm the deployed version responds correctly

  Scenario: Basic PR preview availability
    Given I navigate to the deployed pull request preview
    Then "body" should be visible
    And the URL should contain "surge.sh"
    And I take a screenshot
