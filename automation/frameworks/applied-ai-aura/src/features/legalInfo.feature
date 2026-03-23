@legalInfo
Feature: Legal Information Page
  As a user
  I want to access and review the Legal Information page
  So that I can understand the legal terms, data protection policies, and intellectual property details

  Background:
    Given I navigate to the deployed pull request preview

  @preview @smoke
  Scenario: Navigate to Legal Information page via direct URL
    When I navigate to "/legal-info"
    Then the URL should contain "/legal-info"
    And "h1" should be visible

  @preview @smoke
  Scenario: Click Legal Information link in footer
    When I navigate to "/"
    And I click on "nav:Información Legal"
    Then the URL should contain "/legal-info"
    And "h1" should be visible

  @preview @functional @spanish
  Scenario: Verify content sections in Spanish
    When I navigate to "/legal-info"
    Then "h1" should have text "Información Legal"
    And "h2" should have text "Información General"
    And "h2" should have text "Protección de Datos"
    And "h2" should have text "Propiedad Intelectual"
    And "h2" should have text "Contacto para Consultas Legales"

  @preview @functional @english
  Scenario: Verify content sections in English after language switch
    When I navigate to "/"
    And I select "English" in "language-selector"
    And I navigate to "/legal-info"
    Then "h1" should have text "Legal Information"
    And "h2" should have text "General Information"
    And "h2" should have text "Data Protection"
    And "h2" should have text "Intellectual Property"
    And "h2" should have text "Contact for Legal Inquiries"

  @preview @functional @portuguese
  Scenario: Verify content sections in Portuguese after language switch
    When I navigate to "/"
    And I select "Português" in "language-selector"
    And I navigate to "/legal-info"
    Then "h1" should have text "Informações Legais"
    And "h2" should have text "Informações Gerais"
    And "h2" should have text "Proteção de Dados"
    And "h2" should have text "Propriedade Intelectual"
    And "h2" should have text "Contato para Consultas Legais"

  @preview @functional
  Scenario: Verify navigation links on Legal Information page
    When I navigate to "/legal-info"
    Then "a:Contáctanos" should be visible
    And "a:← Volver al Inicio" should be visible
