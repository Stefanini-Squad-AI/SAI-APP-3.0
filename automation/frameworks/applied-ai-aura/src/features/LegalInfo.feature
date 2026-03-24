@preview @legal-info
Feature: Legal Information page
  As a visitor
  I want to understand the compliance posture of the public site
  So that I trust how privacy, terms, and contact links interoperate

  Background:
    Given the browser is open on the TuCreditoOnline home page

  @legal-nav
  Scenario: Header legal link loads the compliance hero
    When I click the navigation link "Legal Information"
    Then the URL should contain "legal"
    Then "footer >> text=Legal Information" should be visible
    Then the legal hero subtitle should have text "Understand how we protect your rights, comply with regulations, and keep our policies transparent."
    Then the compliance section title should have text "Compliance & Oversight"

  @legal-i18n
  Scenario: Language selector shows Spanish copy on the legal hero
    When I click on "English"
    When I click on "Español"
    When I click the navigation link "Información legal"
    Then the URL should contain "legal"
    Then "[data-testid=\"legal-hero-title\"]" should have text "Información legal"
    Then the legal hero subtitle should have text "Conoce cómo protegemos tus derechos, cumplimos con la normativa y mantenemos las políticas transparentes."
    Then the compliance section title should have text "Cumplimiento y supervisión"
