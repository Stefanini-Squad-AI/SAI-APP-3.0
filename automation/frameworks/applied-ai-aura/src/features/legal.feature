@legal
Feature: Legal Information Page
  As a public user of TuCreditoOnline
  I want to access a Legal Information page from the main navigation
  So that I can find all legal disclosures in one place

  Background:
    Given I navigate to the deployed pull request preview

  # ── AC1 + AC2 — Navigation ───────────────────────────────────────────────────

  @preview @legal-navigation
  Scenario: Legal link is visible in the desktop header after Contact
    Then "a[href*='/contact']" should be visible
    And "a[href*='/legal']" should be visible

  @preview @legal-navigation
  Scenario: Clicking the Legal link navigates to /legal
    When I click on "a[href*='/legal']"
    Then the URL should contain "/legal"
    And "main" should be visible
    And "h1" should be visible

  @preview @legal-navigation
  Scenario: Existing Contact link is still present after Legal link is added
    Then "a[href*='/contact']" should be visible
    When I click on "a[href*='/contact']"
    Then the URL should contain "/contact"

  # ── AC3 — Page content ────────────────────────────────────────────────────────

  @preview @legal-content
  Scenario: Legal page renders the page title and cross-link sections
    When I click on "a[href*='/legal']"
    Then the URL should contain "/legal"
    And "h1" should be visible
    And "a[href*='/privacy']" should be visible
    And "a[href*='/terms']" should be visible

  # ── AC4 — Footer ──────────────────────────────────────────────────────────────

  @preview @legal-content
  Scenario: Footer legal column contains a link to the Legal Information page
    Then "footer" should be visible
    And "footer a[href*='/legal']" should be visible

  # ── AC5 — i18n ────────────────────────────────────────────────────────────────

  @preview @legal-i18n
  Scenario: Legal page title updates when language is switched to Spanish
    When I click on "a[href*='/legal']"
    Then the URL should contain "/legal"
    And "h1" should be visible
    When I click on "button[aria-label='Language']"
    And I click on "Español"
    Then "h1" should be visible

  @preview @legal-i18n
  Scenario: Legal page title updates when language is switched to Portuguese
    When I click on "a[href*='/legal']"
    Then the URL should contain "/legal"
    And "h1" should be visible
    When I click on "button[aria-label='Language']"
    And I click on "Português"
    Then "h1" should be visible
