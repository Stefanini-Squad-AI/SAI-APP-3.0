@language @smoke @ci
Feature: Language Switcher
  As a visitor
  I want to switch the application language
  So that I can read the content in my preferred language

  Background:
    Given I navigate to the home page

  @language-en
  Scenario: Switch to English
    When I switch the language to English
    Then I should see the section "about us"
    And I should see the section "our services"

  @language-es
  Scenario: Switch to Spanish
    When I switch the language to Spanish
    Then I should see the section "sobre nosotros"
    And I should see the section "nuestros servicios"

  @language-pt
  Scenario: Switch to Portuguese
    When I switch the language to Portuguese
    Then I should see the section "sobre nós"
    And I should see the section "nossos serviços"
