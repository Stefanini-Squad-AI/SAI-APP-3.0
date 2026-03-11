@calculator @smoke
Feature: Credit Calculator
  As a visitor
  I want to simulate a credit
  So that I can understand my monthly payment before applying

  Background:
    Given I navigate to the calculator page

  @calculator-loads
  Scenario: Calculator loads with credit types
    Then I should see the credit type selector
    And I should see the monthly payment result

  @calculator-apply @ci
  Scenario: Apply for credit button opens the wizard
    Then I should see the "Apply for Your Credit Now" button
    When I click on "Apply for Your Credit Now"
    Then I should see the credit request form
