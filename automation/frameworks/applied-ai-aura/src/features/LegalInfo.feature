@preview
Feature: Legal information page (SAIAPP3-17)
  Public legal information at /legal-info with header, footer, and i18n.

  Scenario: Open legal information from desktop header
    Given I navigate to the deployed pull request preview
    When I click the desktop legal information navigation link
    Then the URL should contain "/legal-info"
    And the legal information page title should equal "Legal information"
    And "Corporate name" section heading should be visible on legal info page

  Scenario: Open legal information from footer legal section
    Given I navigate to the deployed pull request preview
    When I click the footer legal information link
    Then the URL should contain "/legal-info"
    And the legal information page title should equal "Legal information"

  Scenario: Direct access to legal information without authentication
    Given I navigate to the deployed pull request preview
    When I open the legal information page directly
    Then the URL should contain "/legal-info"
    And the legal information page title should equal "Legal information"
    And the URL should not contain "/admin/login"

  Scenario: Contact CTA from legal information page
    Given I navigate to the deployed pull request preview
    When I open the legal information page directly
    And I click the legal information contact call-to-action
    Then the URL should contain "/contact"

  Scenario: Language switch updates legal information headings
    Given I navigate to the deployed pull request preview
    When I open the legal information page directly
    And I open the language menu and select Spanish
    Then the legal information page title should equal "Información legal"
    And the legal information section 1 title should equal "Denominación social"

  Scenario: Language switch to Portuguese on legal information page
    Given I navigate to the deployed pull request preview
    When I open the legal information page directly
    And I open the language menu and select Portuguese
    Then the legal information page title should equal "Informações legais"
    And the legal information section 1 title should equal "Denominação social"

  Scenario: Open legal information from mobile navigation
    Given I navigate to the deployed pull request preview
    When I use a mobile viewport
    And I open the mobile navigation menu
    And I click the mobile legal information navigation link
    Then the URL should contain "/legal-info"
    And the legal information page title should equal "Legal information"
