# Admin Login feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)
# URL constants: LoginConstants.ts

@login
Feature: TuCreditoOnline Admin Login
  As an administrator
  I want to sign in with valid credentials
  So that I can access the administration panel

  Background:
    Given the browser is on the admin login page

  @smoke @login-page-display
  Scenario: Login page displays correctly
    Then I should see the heading "Administration Panel"
    And the email field should be visible
    And the password field should be visible
    And the login button should be visible

  @smoke @login-valid-credentials
  Scenario: Successful login with valid credentials
    When I enter email "admin@tucreditoonline.local"
    And I enter login password "Admin123!"
    And I click the admin login button
    Then the URL should contain "admin/dashboard"

