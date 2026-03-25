# AURA — Legal Page Feature Tests
# Scenarios for the /legal public information page

@smoke @legal
Feature: Legal Information Page
  As a website visitor
  I want to access legal information
  So that I understand the legal terms and disclaimers of TuCreditoOnline

  Background:
    Given the browser is on the legal page

  @smoke @legal-nav @legal-nav-desktop
  Scenario: Legal page accessible from main menu desktop
    When I navigate to "/"
    When I click on "Legal"
    Then the URL should contain "legal"
    Then "Legal Information" should be visible

  @smoke @legal-nav @legal-nav-mobile
  Scenario: Legal page accessible from main menu mobile
    When I use a mobile viewport
    When I navigate to "/"
    When I click on the page
    When I wait 500 milliseconds
    Then "Legal" should be visible

  @smoke @legal-i18n-english
  Scenario: Legal page displays correct content in English
    Given I navigate to the deployed pull request preview
    Given the browser is on the legal page
    Then I should see the heading "Legal Information"
    Then "1. Legal Notice" should be visible
    Then "2. Limitation of Liability" should be visible

  @smoke @legal-i18n-spanish
  Scenario: Legal page displays correct content in Spanish
    Given the browser is on the legal page
    When I switch language to "Español"
    Then I should see the heading "Información Legal"
    Then "1. Aviso Legal" should be visible

  @smoke @legal-i18n-portuguese
  Scenario: Legal page displays correct content in Portuguese
    Given the browser is on the legal page
    When I switch language to "Português"
    Then I should see the heading "Informação Legal"
    Then "1. Aviso Legal" should be visible

  @smoke @legal-internal-links
  Scenario: Legal page internal links navigate correctly
    When I click the footer link "Privacy Policy"
    Then the URL should contain "privacy"

  @smoke @legal-internal-links-terms
  Scenario: Legal page links to Terms and Conditions
    When I click the footer link "Terms and Conditions"
    Then the URL should contain "terms"

  @smoke @legal-responsive
  Scenario: Legal page displays correctly on desktop
    Then "Legal Information" should be visible
    Then "1. Legal Notice" should be visible

  @preview
  Scenario: Legal page responsive mobile
    When I use a mobile viewport
    Then "Legal Information" should be visible
    Then "1. Legal Notice" should be visible
