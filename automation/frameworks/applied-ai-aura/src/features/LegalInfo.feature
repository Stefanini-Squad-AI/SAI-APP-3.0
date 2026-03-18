@preview @legal-info
Feature: Legal Information page and navigation (SAIAPP3-14)
  As a user of the TuCreditoOnline public site
  I want to access the Legal Information (aviso legal) page from the header and footer
  So that I can consult the service provider identification and legal notice

  @preview @legal-info
  Scenario: Access Legal Information from header and view content
    Given the browser is open on the application home page
    When I click the link to the legal page in the header
    Then the URL should contain "/legal"
    And the page should display the legal information title
    And the page should display at least three content sections
    And the page should display a link to the contact page

  @preview @legal-info
  Scenario: Access Legal Information from footer (Aviso Legal)
    Given the browser is open on the application home page
    When I scroll to the footer
    And I click the link to the legal page in the footer
    Then the URL should contain "/legal"
    And the page should display the legal information title
