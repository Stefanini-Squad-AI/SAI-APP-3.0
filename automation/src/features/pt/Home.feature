# language: pt
@home @smoke @ci
Funcionalidade: Página Inicial
  Como visitante
  Quero ver a página inicial do TuCreditoOnline
  Para conhecer os serviços disponíveis

  Contexto:
    Dado que navego para a página inicial

  @home-sections
  Cenário: Todas as seções principais estão visíveis
    Então devo ver a seção "sobre nós"
    E devo ver a seção "nossos serviços"
    E devo ver a seção "visite-nos"

  @home-navigation
  Cenário: Os links de navegação estão acessíveis
    Então a barra de navegação deve estar visível
    E devo ver um link para "Serviços"
    E devo ver um link para "Calculadora"

  @home-hero @ci
  Cenário: Os botões de chamada para ação do hero estão presentes
    Então devo ver a seção hero
    E devo ver um botão para solicitar crédito
