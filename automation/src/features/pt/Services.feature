# language: pt
@services @smoke @ci @demo-sai3
Funcionalidade: Página de Serviços
  Como visitante
  Quero explorar os serviços de crédito disponíveis
  Para encontrar o produto certo para as minhas necessidades

  Contexto:
    Dado que navego para a página inicial

  @services-language-pt
  Cenário: Os títulos da página de serviços são exibidos em português
    Quando mudo o idioma para Português
    E clico em "Serviços" no menu de navegação
    Então devo ver o título "Nossos Serviços"
    E devo ver a seção "Não tem certeza qual escolher?"

  @services-cards
  Cenário: Os cartões de tipos de crédito são carregados
    Quando clico em "Serviços" no menu de navegação
    Então devo ver pelo menos um cartão de tipo de crédito
