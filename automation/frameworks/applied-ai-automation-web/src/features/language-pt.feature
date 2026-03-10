@skip-ci @TCO-11
Feature: Switch language to Portuguese on the home page
  As a user
  I want to switch the application language to Portuguese
  In order to verify that the section titles are displayed correctly in Portuguese

  Background:
    Given the browser is open

  @language-pt
  Scenario: Switch language to Portuguese on the home page (TCO-11)
    Given I navigate to the TuCreditoOnline home page
    When I click the language dropdown next to the admin login button
    And I select Portuguese
    Then I should see the section titles "Sobre Nós", "Nossos Serviços" and "Visite-nos"
