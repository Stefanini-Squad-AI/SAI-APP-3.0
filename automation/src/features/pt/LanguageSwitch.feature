# language: pt
@language @smoke @ci
Funcionalidade: Seletor de Idioma
  Como visitante
  Quero mudar o idioma da aplicação
  Para ler o conteúdo no meu idioma preferido

  Contexto:
    Dado que navego para a página inicial

  @language-en
  Cenário: Mudar para inglês
    Quando mudo o idioma para Inglês
    Então devo ver a seção "about us"
    E devo ver a seção "our services"

  @language-es
  Cenário: Mudar para espanhol
    Quando mudo o idioma para Espanhol
    Então devo ver a seção "sobre nosotros"
    E devo ver a seção "nuestros servicios"

  @language-pt
  Cenário: Mudar para português
    Quando mudo o idioma para Português
    Então devo ver a seção "sobre nós"
    E devo ver a seção "nossos serviços"
