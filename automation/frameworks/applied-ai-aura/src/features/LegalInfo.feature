@preview @legal-info
Feature: Legal Information page
  As a site visitor
  I want to open the Legal Information page from header and footer
  So that I can read company legal information (name, address, tax ID) without logging in

  Background:
    Given I navigate to the app public home

  @smoke
  Scenario: Access Legal Information from header link
    When I click on the Legal Information link in the header
    Then the URL should contain "/legal-info"
    And the Legal Information page title should be visible

  Scenario: Access Legal Information from footer link
    When I click on the Legal Information link in the footer
    Then the URL should contain "/legal-info"
    And the Legal Information page title should be visible

  Scenario: Direct access to Legal Information without authentication
    When I navigate to the Legal Information page URL
    Then the URL should contain "/legal-info"
    And the Legal Information page title should be visible
    And "body" should be visible

  Scenario: From Legal Information page, link to Contact
    Given I navigate to the Legal Information page URL
    When I click on the contact us link on Legal Information page
    Then the URL should contain "/contact"

  Scenario: From Legal Information page, link to Home
    Given I navigate to the Legal Information page URL
    When I click on the back to home link on Legal Information page
    Then the URL should contain "/"

  @i18n
  Scenario: Legal Information page shows translated title when language is English
    Given I navigate to the Legal Information page URL
    When I change the site language to English
    And I navigate to the Legal Information page URL
    Then the page should show the Legal Information title in English

  @i18n
  Scenario: Legal Information page shows translated content after language switch
    Given I navigate to the app public home
    When I change the site language to English
    And I click on the Legal Information link in the header
    Then the URL should contain "/legal-info"
    And the page should show the Legal Information title in English
