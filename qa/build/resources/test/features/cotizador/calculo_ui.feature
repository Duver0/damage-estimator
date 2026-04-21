# language: es
@calculo_ui @ui
Característica: Cálculo de Prima desde la Interfaz de Usuario
  Como usuario del sistema
  Quiero calcular la prima de la cotización desde la UI
  Para obtener el resultado financiero de la cobertura

  Antecedentes:
    Dado que el folio tiene una ubicación completa y el usuario está en información técnica

  @calcular_prima_ui @smoke @critico
  Escenario: Calcular prima y ver resultado financiero
    Cuando hace clic en el botón "Calcular Prima"
    Entonces el resultado de prima neta es mayor que cero
    Y el resultado de prima comercial es mayor que cero

  @prima_comercial_mayor @smoke
  Escenario: La prima comercial es mayor que la prima neta
    Cuando hace clic en el botón "Calcular Prima"
    Entonces la prima comercial es mayor que la prima neta

  @avanzar_tras_calculo @smoke
  Escenario: Avanzar a términos tras calcular
    Cuando hace clic en el botón "Calcular Prima"
    Y hace clic en "Términos y Confirmación"
    Entonces es redirigido a la página de términos y confirmación

  @terminos_muestran_primas @smoke
  Escenario: La página de términos muestra las primas calculadas
    Cuando hace clic en el botón "Calcular Prima"
    Y hace clic en "Términos y Confirmación"
    Entonces la página de términos muestra los valores de prima
