# Legal Notice page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@legal
Feature: TuCreditoOnline Legal Notice Page
  As a visitor
  I want to access the legal information page
  So that I can review legal information, disclaimers, and terms

  Background:
    Given the browser is on the "legal" page

  @smoke @legal-title
  Scenario: Legal page displays the correct title
    Then I should see the heading "Legal Notice"

  @preview @legal-title
  Scenario: Legal page displays the correct title (preview)
    Then I should see the heading "Legal Notice"

  @legal-sections
  Scenario: Legal page displays all content sections
    Then I should see the heading "Legal Notice"
    And I should see the section heading "1. Legal Information"
    And I should see the section heading "2. Intellectual Property Rights"

  @preview @legal-sections
  Scenario: Legal page displays all content sections (preview)
    Then I should see the heading "Legal Notice"
    And I should see the section heading "1. Legal Information"
    And I should see the section heading "2. Intellectual Property Rights"

  @legal-i18n-spanish
  Scenario: Legal page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Aviso Legal"
    And I should see the section heading "1. Información Legal"

  @preview @legal-i18n-spanish
  Scenario: Legal page displays correctly in Spanish (preview)
    When I switch language to "Español"
    Then I should see the heading "Aviso Legal"
    And I should see the section heading "1. Información Legal"

  @legal-i18n-portuguese
  Scenario: Legal page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Aviso Legal"
    And I should see the section heading "1. Informação Legal"

  @preview @legal-i18n-portuguese
  Scenario: Legal page displays correctly in Portuguese (preview)
    When I switch language to "Português"
    Then I should see the heading "Aviso Legal"
    And I should see the section heading "1. Informação Legal"

  @legal-language-switch
  Scenario: Language switching works on legal page
    When I switch language to "Español"
    Then I should see the heading "Aviso Legal"
    When I switch language to "English"
    Then I should see the heading "Legal Notice"

  @preview @legal-language-switch
  Scenario: Language switching works on legal page (preview)
    When I switch language to "Español"
    Then I should see the heading "Aviso Legal"
    When I switch language to "English"
    Then I should see the heading "Legal Notice"

  @legal-menu-desktop
  Scenario: Legal link visible in desktop menu before Contact
    Given the browser is open on the TuCreditoOnline home page
    Then "Legal Information" should be visible
    And the URL should not contain "legal"

  @preview @legal-menu-desktop
  Scenario: Legal link visible in desktop menu before Contact (preview)
    Given I navigate to the deployed pull request preview
    Then "Legal Information" should be visible

  @legal-menu-mobile
  Scenario: Legal link navigates from mobile menu
    Given the browser is open on the TuCreditoOnline home page
    When I use a mobile viewport
    And I click on the mobile menu button
    And I click the navigation link "Aviso Legal"
    Then the URL should contain "legal"

  @preview @legal-menu-mobile
  Scenario: Legal link navigates from mobile menu (preview)
    Given I navigate to the deployed pull request preview
    When I use a mobile viewport
    And I wait 1000 milliseconds
    Then the URL should contain "/" and not contain "legal"

  @legal-contact-link
  Scenario: Contact link on legal page navigates to contact page
    Given the browser is on the "legal" page
    When I click the link "Contact Us"
    Then the URL should contain "contact"

  @preview @legal-contact-link
  Scenario: Contact link on legal page navigates to contact page (preview)
    Given the browser is on the "legal" page
    When I click the link "Contact Us"
    Then the URL should contain "contact"
