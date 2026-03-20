@preview @legal
Feature: Página de Información Legal (SAIAPP3-21)
  Como visitante del sitio público de TuCreditoOnline
  quiero acceder a una página de Información Legal desde el menú principal
  para conocer el aviso legal, limitaciones de responsabilidad, propiedad intelectual y jurisdicción

  # ─── AC1 + AC2: Navegación desde encabezado ───────────────────────────────────

  @navigation
  Scenario: El enlace "Legal" en el encabezado navega correctamente a /legal
    Given el usuario se encuentra en la página principal del sitio
    When hace clic en el enlace "Legal" del encabezado
    Then la URL debe contener "/legal"
    And el título principal de la página "Legal" debe ser visible
    And no deben existir errores críticos en la consola del navegador

  # ─── AC4: Enlace del pie de página ────────────────────────────────────────────

  @footer
  Scenario: El enlace "Aviso Legal" del pie de página dirige a /legal
    Given el usuario se encuentra en la página principal del sitio
    When hace clic en el enlace "Aviso Legal" del pie de página
    Then la URL debe contener "/legal"
    And la URL no debe contener "/terms"
    And el título principal de la página "Legal" debe ser visible

  # ─── AC1 + AC5: Estructura y accesibilidad ────────────────────────────────────

  @accessibility
  Scenario: La página /legal tiene jerarquía de encabezados correcta y cuatro secciones
    Given el usuario navega directamente a la página de Información Legal
    Then la página debe tener exactamente un encabezado h1
    And la página debe tener al menos 4 encabezados h2

  # ─── AC3 + i18n: Cambio de idioma y títulos ───────────────────────────────────

  @i18n
  Scenario Outline: La página Legal muestra el título correcto en cada idioma
    Given el usuario navega directamente a la página de Información Legal
    When el usuario selecciona el idioma "<idioma>"
    Then el título h1 de la página debe contener "<titulo_esperado>"
    And el enlace de navegación "Legal" del encabezado debe ser visible

    Examples:
      | idioma | titulo_esperado   |
      | es     | Información Legal |
      | en     | Legal Information |
      | pt     | Informação Legal  |

  @i18n
  Scenario: No existen claves sin traducir visibles en la página Legal en español
    Given el usuario navega directamente a la página de Información Legal
    When el usuario selecciona el idioma "es"
    Then el contenido de la página no debe contener el patrón "legalPage\."
    And todas las secciones de contenido deben tener texto no vacío
