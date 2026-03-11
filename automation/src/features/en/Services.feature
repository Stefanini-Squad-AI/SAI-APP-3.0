@services @smoke @ci @demo-sai3
Feature: Services Page
  As a visitor
  I want to browse the available credit services
  So that I can find the right product for my needs

  Background:
    Given I navigate to the home page

  @services-language-en
  Scenario: Services page titles display in English
    When I switch the language to English
    And I click on "Services" in the navigation menu
    Then I should see the title "Our Services"
    And I should see the section "Not sure which one to choose?"

  @services-cards
  Scenario: Credit type cards are loaded
    When I click on "Services" in the navigation menu
    Then I should see at least one credit type card
