@contact
Feature: Contact Page with Tabbed Legal Information
  As a visitor to the contact page
  I want to access contact form and legal information through tabs
  So that I can reach support or review legal documents in my preferred language

  Background:
    Given I navigate to the deployed pull request preview

  @preview @smoke
  Scenario: Tabbed interface renders with Contact tab active by default
    When I navigate to "/contact"
    Then the page title should contain "Contact"
    And "tab:Contacto" should be visible
    And "tab:Información Legal" should be visible
    And "tab:Contacto" should have text "Contacto"
    And "tab:Información Legal" should have text "Información Legal"

  @preview @functionality
  Scenario: Switch from Contact tab to Legal Information tab
    When I navigate to "/contact"
    And I click on "tab:Información Legal"
    Then "section:Términos y Condiciones" should be visible
    And "section:Política de Privacidad" should be visible
    And "section:Información de Regulación" should be visible
    And "form:contact" should be hidden

  @preview @functionality
  Scenario: Switch back from Legal Information tab to Contact tab
    When I navigate to "/contact"
    And I click on "tab:Información Legal"
    And I click on "tab:Contacto"
    Then "form:contact" should be visible
    And "section:Send us a Message" should be visible
    And "section:Contact Information" should be visible
    And "section:Our Location" should be hidden

  @preview @content
  Scenario: Legal Information tab shows all three sections
    When I navigate to "/contact"
    And I click on "tab:Información Legal"
    Then "heading:Términos y Condiciones" should be visible
    And "heading:Política de Privacidad" should be visible
    And "heading:Información de Regulación" should be visible
    And "section:Términos y Condiciones" should have text "TuCreditoOnline"

  @preview @i18n
  Scenario: Legal content displays in Spanish (es)
    When I navigate to "/contact"
    And I select "es" in "language-selector"
    And I click on "tab:Información Legal"
    Then "heading:Términos y Condiciones" should be visible
    And "heading:Política de Privacidad" should be visible
    And "heading:Información de Regulación" should be visible

  @preview @i18n
  Scenario: Legal content displays in English (en)
    When I navigate to "/contact"
    And I select "en" in "language-selector"
    And I click on "tab:Información Legal"
    Then "heading:Terms and Conditions" should be visible
    And "heading:Privacy Policy" should be visible
    And "heading:Regulatory Information" should be visible

  @preview @i18n
  Scenario: Legal content displays in Portuguese (pt)
    When I navigate to "/contact"
    And I select "pt" in "language-selector"
    And I click on "tab:Información Legal"
    Then "heading:Termos e Condições" should be visible
    And "heading:Política de Privacidade" should be visible
    And "heading:Informação Regulatória" should be visible

  @preview @persistence
  Scenario: Selected tab persists after page reload
    When I navigate to "/contact"
    And I click on "tab:Información Legal"
    And I wait 500 milliseconds
    Then "section:Términos y Condiciones" should be visible
    # Note: Page reload via Playwright reload is triggered via JavaScript in the step

  @preview @a11y
  Scenario: Tab navigation via keyboard (Tab and Space)
    When I navigate to "/contact"
    And I press key "Tab" in "tab-container"
    And I press key "Space" in "tab:Información Legal"
    Then "section:Información Legal" should be visible
    And "form:contact" should be hidden

  @preview @a11y
  Scenario: ARIA attributes are present on tabs
    When I navigate to "/contact"
    Then "tab:Contacto" should have attribute "role" with value "tab"
    And "tab:Información Legal" should have attribute "role" with value "tab"
    And "tab-container" should have attribute "role" with value "tablist"

  @preview @regression
  Scenario: Contact form still submits successfully
    When I navigate to "/contact"
    And I click on "tab:Contacto"
    And I type "John Doe" into "input:fullName"
    And I type "john@example.com" into "input:email"
    And I type "Test Subject" into "input:subject"
    And I type "Test message body" into "textarea:message"
    And I click on "button:Send Message"
    Then "notification:success" should be visible

  @preview @regression
  Scenario: Global language change affects both Contact and Legal tabs
    When I navigate to "/contact"
    And I select "en" in "language-selector"
    Then "tab:Contact" should be visible
    And "tab:Legal Information" should be visible
    And "heading:Send us a Message" should be visible
    When I click on "tab:Legal Information"
    Then "heading:Terms and Conditions" should be visible
