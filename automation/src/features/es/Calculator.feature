# language: es
@calculator @smoke
Característica: Calculadora de Crédito
  Como visitante
  Quiero simular un crédito
  Para conocer mi cuota mensual antes de solicitarlo

  Antecedentes:
    Dado que navego a la página de la calculadora

  @calculator-loads
  Escenario: La calculadora carga con tipos de crédito
    Entonces debo ver el selector de tipo de crédito
    Y debo ver el resultado del pago mensual

  @calculator-apply @ci
  Escenario: El botón de solicitar crédito abre el formulario
    Entonces debo ver el botón "Solicita tu Crédito Ahora"
    Cuando hago clic en "Solicita tu Crédito Ahora"
    Entonces debo ver el formulario de solicitud de crédito
