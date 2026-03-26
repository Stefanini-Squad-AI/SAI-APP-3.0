# Legal Information page feature — TuCreditoOnline SPA (SAI-APP-3.0 frontend)

@legal
Feature: TuCreditoOnline Legal Information Page
  As a visitor
  I want to access the legal information page
  So that I can review regulatory requirements, compliance information, and legal disclosures

  Background:
    Given the browser is on the "legal" page

  @smoke @legal-title
  Scenario: Legal page displays the correct title
    Then I should see the heading "Legal Information"

  @legal-sections
  Scenario: Legal page displays all content sections
    Then I should see the heading "Legal Information"
    And I should see the section heading "1. Regulation and Compliance"
    And I should see the section heading "2. Required Disclosures"

  @legal-i18n-spanish
  Scenario: Legal page displays correctly in Spanish
    When I switch language to "Español"
    Then I should see the heading "Informaciones Legales"
    And I should see the section heading "1. Regulacinnn y Cumplimiento"

  @legal-i18n-portuguese
  Scenario: Legal page displays correctly in Portuguese
    When I switch language to "Português"
    Then I should see the heading "Informações Jurídicas"
    And I should see the section heading "1. Regulamentação e Conformidade"

  @legal-language-switch
  Scenario: Language switching works on legal page
    When I switch language to "Español"
    Then I should see the heading "Informaciones Legales"
    When I switch language to "English"
    Then I should see the heading "Legal Information"

  @legal-footer-link
  Scenario: Footer legal information link navigates to legal page
    Given the browser is on the TuCreditoOnline home page
    When I click the footer link "Legal Information"
    Then the URL should contain "legal"
    And I should see the heading "Legal Information"

  @legal-header-link @desktop
  Scenario: Header legal information link navigates to legal page (desktop)
    Given the browser is on the TuCreditoOnline home page
    When I click the navigation link "Legal Information"
    Then the URL should contain "legal"
    And I should see the heading "Legal Information"

  @legal-responsive-mobile
  Scenario: Legal page is responsive on mobile viewport
    Given I use a mobile viewport
    Then the content should be visible
    And I should see the heading "Legal Information"
