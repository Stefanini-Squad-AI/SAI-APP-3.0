# Login feature
# Test data should live in Examples.
# URL constants should live in LoginConstants.ts.

@login
Feature: User Authentication
  As an application user
  I want to sign in with valid credentials
  So that I can access protected areas

  Background:
    Given the browser is open on the login page

  @smoke @happy-path
  Scenario: Successful login with valid credentials
    When I enter username "tomsmith"
    And I enter password "SuperSecretPassword!"
    And I click the login button
    Then I should be redirected to "/secure"
    And I should see the welcome message

