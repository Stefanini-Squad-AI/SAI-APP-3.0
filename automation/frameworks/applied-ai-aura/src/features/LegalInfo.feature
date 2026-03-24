@preview
Feature: Legal information page (TuCreditoOnline public site)
  As a visitor
  I want to open legal information from the main navigation
  So that I can read notices and references in my language

  Scenario: Navigate from header to legal information on desktop
    Given I navigate to the deployed pull request preview
    When I click the navigation link "Legal Information"
    Then the URL should contain "legal"
    Then "heading:Legal Information" should be visible

  Scenario: Spanish language reflected on legal page and header link
    Given I navigate to the deployed pull request preview
    When I open the legal information page
    And I click on "[data-testid=header-language-toggle]"
    And I click on "button:Español"
    Then "heading:Información legal" should be visible
    Then "link:Información legal" should be visible

  Scenario: Portuguese language reflected on legal page title
    Given I navigate to the deployed pull request preview
    When I open the legal information page
    And I click on "[data-testid=header-language-toggle]"
    And I click on "button:Português"
    Then "heading:Informações legais" should be visible

  Scenario: Mobile menu shows legal information next to contact
    Given I navigate to the deployed pull request preview
    When I set the viewport to mobile size
    And I click on "[data-testid=header-mobile-menu-toggle]"
    Then "link:Legal Information" should be visible
    Then "[data-testid=header-nav-contact-mobile]" should be visible
