# language: es
@services @smoke @ci @demo-sai3
Característica: Página de Servicios
  Como visitante
  Quiero explorar los servicios de crédito disponibles
  Para encontrar el producto adecuado para mis necesidades

  Antecedentes:
    Dado que navego a la página principal

  @services-language-es
  Escenario: Los títulos de la página de servicios se muestran en español
    Cuando cambio el idioma a Español
    Y hago clic en "Servicios" en el menú de navegación
    Entonces debo ver el título "Nuestros Servicios"
    Y debo ver la sección "¿No estás seguro cuál elegir?"

  @services-cards
  Escenario: Las tarjetas de tipos de crédito se cargan
    Cuando hago clic en "Servicios" en el menú de navegación
    Entonces debo ver al menos una tarjeta de tipo de crédito
