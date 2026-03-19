@preview
Feature: Legal information hub
  Central legal page with accessible tabs for privacy and terms content.

  Scenario: Legal route shows tabbed legal hub
    Given I navigate to the deployed pull request preview
    When I open the public legal information route
    Then the legal information shell should be visible
    And there should be at least two legal tabs

  Scenario: Legal tabs toggle distinct panels
    Given I am on the public legal information page
    When I activate the second legal tab
    Then the terms legal content panel should be visible
    And the privacy legal content panel should be hidden
    When I activate the first legal tab
    Then the privacy legal content panel should be visible
    And the terms legal content panel should be hidden

  Scenario: Footer link reaches legal hub without SPA loss
    Given I navigate to the deployed pull request preview
    When I follow the footer link for legal information
    Then the legal information shell should be visible
    And the browser URL should include the legal route segment

  Scenario Outline: Stored language updates legal tab labels
    Given I am on the public legal information page
    When I persist the UI language as "<code>" and reload the page
    Then the first legal tab should show label "<privacyLabel>"

    Examples:
      | code | privacyLabel           |
      | es   | Política de privacidad |
      | pt   | Política de privacidade |
      | en   | Privacy policy         |
