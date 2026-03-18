# Legal Information page — SAIAPP3-15
# AC1–AC4: route /legal, nav in Header/Footer, content and links.
# Run with AURA_TARGET_URL set to PR preview; tag @preview for CI.

@preview @legal-info
Feature: Legal Information page and navigation
  As a visitor
  I want to open the Legal Information page from the Header or Footer
  So that I can read legal and institutional information

  Background:
    Given I navigate to the deployed pull request preview

  @smoke
  Scenario: Open Legal Information from Header and see page
    When I click the link to the legal information page
    Then the URL should contain "/legal"
    And the legal page title should be visible

  Scenario: Open Legal Information from Footer
    When I click the "Legal" link in the footer that goes to the legal page
    Then the URL should contain "/legal"
    And the legal page title should be visible

  Scenario: Direct access to /legal without login
    When I navigate to the legal information page directly
    Then the URL should contain "/legal"
    And the legal page title should be visible
    And a link to the contact page should be visible
    And a link to the home page should be visible
