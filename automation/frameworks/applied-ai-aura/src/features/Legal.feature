# @Smoke + Functional tests for Legal Information Page (SAIAPP3-53)

@smoke @legal-page
Scenario: Legal information page loads and displays title correctly
  Given the browser is on the "/legal" page
  Then the URL should contain "/legal"
  And I should see the heading "Informaciónes Legales"
  And I should see the section heading "1. Aviso Legal"

@legal-content
Scenario: Legal information page displays all content sections
  Given the browser is on the "/legal" page
  Then I should see the heading "Informaciónes Legales"
  And I should see the section heading "1. Aviso Legal"
  And I should see the section heading "2. Términos y Condiciones"
  And I should see the section heading "3. Datos Legales Empresariales"
  And I should see the section heading "4. Regulación y Licencias"

@smoke @legal-i18n-spanish
Scenario: Legal information page displays correctly in Spanish
  Given the browser is on the "/legal" page
  When I switch language to "Español"
  Then I should see the heading "Informaciónes Legales"
  And I should see the section heading "1. Aviso Legal"

@legal-i18n-english
Scenario: Legal information page displays correctly in English
  Given the browser is on the "/legal" page
  When I switch language to "English"
  Then I should see the heading "Legal Information"
  And I should see the section heading "1. Legal Notice"

@legal-i18n-portuguese
Scenario: Legal information page displays correctly in Portuguese
  Given the browser is on the "/legal" page
  When I switch language to "Português"
  Then I should see the heading "Informações Legais"
  And I should see the section heading "1. Aviso Legal"

@legal-language-switch
Scenario: Language switching works on legal information page
  Given the browser is on the "/legal" page
  When I switch language to "Español"
  Then I should see the heading "Informaciónes Legales"
  When I switch language to "English"
  Then I should see the heading "Legal Information"
  When I switch language to "Português"
  Then I should see the heading "Informações Legais"

@smoke @legal-nav-desktop
Scenario: Legal information link is visible in desktop header menu
  Given the browser is on the TuCreditoOnline home page
  And I use a desktop viewport
  Then I should see a link to "Informaciónes Legales" in the header navigation

@legal-nav-mobile
Scenario: Legal information link is visible in mobile header menu
  Given the browser is on the TuCreditoOnline home page
  And I use a mobile viewport
  When I click on "menu button" in the page
  Then I should see a link to "Informaciónes Legales" in the mobile menu

@legal-footer-link
Scenario: Footer legal information link is functional
  Given the browser is on the TuCreditoOnline home page
  When I click the footer link "Informaciónes Legales"
  Then the URL should contain "/legal"
  And I should see the heading "Informaciónes Legales"
