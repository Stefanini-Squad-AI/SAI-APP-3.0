# language: pt
@calculator @smoke
Funcionalidade: Calculadora de Crédito
  Como visitante
  Quero simular um crédito
  Para conhecer minha parcela mensal antes de solicitá-lo

  Contexto:
    Dado que navego para a página da calculadora

  @calculator-loads
  Cenário: A calculadora carrega com tipos de crédito
    Então devo ver o seletor de tipo de crédito
    E devo ver o resultado do pagamento mensal

  @calculator-apply @ci
  Cenário: O botão de solicitar crédito abre o formulário
    Então devo ver o botão "Solicite seu Crédito Agora"
    Quando clico em "Solicite seu Crédito Agora"
    Então devo ver o formulário de solicitação de crédito
