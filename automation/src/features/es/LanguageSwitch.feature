# language: es
@language @smoke @ci
Característica: Selector de Idioma
  Como visitante
  Quiero cambiar el idioma de la aplicación
  Para leer el contenido en mi idioma preferido

  Antecedentes:
    Dado que navego a la página principal

  @language-en
  Escenario: Cambiar a inglés
    Cuando cambio el idioma a Inglés
    Entonces debo ver la sección "about us"
    Y debo ver la sección "our services"

  @language-es
  Escenario: Cambiar a español
    Cuando cambio el idioma a Español
    Entonces debo ver la sección "sobre nosotros"
    Y debo ver la sección "nuestros servicios"

  @language-pt
  Escenario: Cambiar a portugués
    Cuando cambio el idioma a Portugués
    Entonces debo ver la sección "sobre nós"
    Y debo ver la sección "nossos serviços"
