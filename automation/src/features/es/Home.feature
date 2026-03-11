# language: es
@home @smoke @ci
Característica: Página Principal
  Como visitante
  Quiero ver la página principal de TuCreditoOnline
  Para conocer los servicios disponibles

  Antecedentes:
    Dado que navego a la página principal

  @home-sections
  Escenario: Todas las secciones principales son visibles
    Entonces debo ver la sección "sobre nosotros"
    Y debo ver la sección "nuestros servicios"
    Y debo ver la sección "visítanos"

  @home-navigation
  Escenario: Los enlaces de navegación son accesibles
    Entonces la barra de navegación debe ser visible
    Y debo ver un enlace a "Servicios"
    Y debo ver un enlace a "Calculadora"

  @home-hero @ci
  Escenario: Las llamadas a la acción del hero están presentes
    Entonces debo ver la sección hero
    Y debo ver un botón para solicitar un crédito
