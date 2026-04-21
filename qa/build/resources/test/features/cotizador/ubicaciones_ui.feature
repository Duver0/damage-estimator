# language: es
@ubicaciones_ui @ui
Característica: Registro de Ubicaciones de Riesgo en UI
  Como usuario del sistema
  Quiero registrar ubicaciones de riesgo usando la interfaz gráfica
  Para capturar los inmuebles a asegurar en la cotización

  Antecedentes:
    Dado que existe un folio con datos generales completos y el usuario está en ubicaciones

  @definir_layout @smoke
  Escenario: Definir layout de 2 ubicaciones
    Cuando ingresa 2 en el campo de cantidad de ubicaciones
    Y hace clic en "Guardar Layout"
    Entonces el botón "+ Agregar Ubicación" es visible

  @agregar_ubicacion_completa @smoke
  Escenario: Agregar ubicación completa con CP válido
    Dado que el layout está configurado con 1 ubicaciones
    Cuando hace clic en "+ Agregar Ubicación"
    Y completa el campo "nombre_ubicacion" con "Oficina Central"
    Y completa el campo "direccion" con "Carrera 7 # 10-20"
    Y completa el campo "codigo_postal" con "110111"
    Y espera a que se cargue la información del CP
    Y selecciona el primer giro disponible
    Y selecciona "LADRILLO_CONCRETO" en el campo "tipo_constructivo"
    Y completa el campo "anio_construccion" con "2010"
    Y selecciona la garantía "INCENDIO_EDIFICIOS"
    Y hace clic en "Guardar Ubicación"
    Entonces la ubicación "Oficina Central" aparece en la lista

  @agregar_ubicacion_incompleta @smoke @critico
  Escenario: Agregar ubicación incompleta sin garantías muestra error de validación
    Dado que el layout está configurado con 2 ubicaciones
    Y hay al menos una ubicación registrada en la UI
    Cuando hace clic en "+ Agregar Ubicación"
    Y completa el campo "nombre_ubicacion" con "Sucursal Incompleta"
    Y completa el campo "direccion" con "Calle 50 # 20-30"
    Y completa el campo "codigo_postal" con "110111"
    Y espera a que se cargue la información del CP
    Y hace clic en "Guardar Ubicación"
    Entonces permanece en la página de ubicaciones con error de validación

  @avanzar_con_ubicacion @smoke
  Escenario: Avanzar a información técnica con ubicación registrada
    Dado que hay al menos una ubicación registrada en la UI
    Cuando hace clic en "Siguiente"
    Entonces es redirigido a la página de información técnica

  @navegacion_atras_ubicaciones @smoke
  Escenario: El botón Atrás regresa a datos generales
    Cuando hace clic en "Atrás"
    Entonces la URL contiene "/general-info"
