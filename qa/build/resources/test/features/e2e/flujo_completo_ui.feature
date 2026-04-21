# language: es
@e2e_ui @ui @smoke @critico
Característica: Flujo Completo de Cotización en la Interfaz de Usuario
  Como usuario del sistema de cotización
  Quiero completar el flujo completo de creación de una cotización en la UI
  Para verificar que el escenario de aceptación funciona de extremo a extremo

  @flujo_completo @escenario_aceptacion
  Escenario: Flujo completo desde dashboard hasta prima calculada con ubicación incompleta
    # Paso 1: Dashboard → crear cotización
    Dado que el usuario abre la aplicación en el dashboard
    Cuando hace clic en el botón "Nueva Cotización"
    Entonces la URL contiene "general-info"

    # Paso 2: Completar datos generales
    Cuando completa el campo "nombre" con "Empresa E2E Test S.A."
    Y completa el campo "apellidos" con "Corporacion Test"
    Y completa el campo "telefono" con "+573001234567"
    Y completa el campo "numeroIdentificacion" con "900555666"
    Y selecciona "NIT" en el campo "tipoIdentificacion"
    Y hace clic en "Siguiente"
    Entonces es redirigido a la página de ubicaciones

    # Paso 3: Configurar layout de 2 ubicaciones
    Cuando ingresa 2 en el campo de cantidad de ubicaciones
    Y hace clic en "Guardar Layout"
    Entonces el botón "+ Agregar Ubicación" es visible

    # Paso 4a: Agregar ubicación completa
    Cuando hace clic en "+ Agregar Ubicación"
    Y completa el campo "nombre_ubicacion" con "Sede Principal"
    Y completa el campo "direccion" con "Carrera 7 # 10-20"
    Y completa el campo "codigo_postal" con "110111"
    Y espera a que se cargue la información del CP
    Y selecciona el primer giro disponible
    Y selecciona "LADRILLO_CONCRETO" en el campo "tipo_constructivo"
    Y completa el campo "anio_construccion" con "2010"
    Y selecciona la garantía "INCENDIO_EDIFICIOS"
    Y hace clic en "Guardar Ubicación"
    Entonces la ubicación "Sede Principal" aparece en la lista

    # Paso 4b: Agregar segunda ubicación incompleta (sin garantías ni giro)
    Cuando hace clic en "+ Agregar Ubicación"
    Y completa el campo "nombre_ubicacion" con "Bodega Incompleta"
    Y completa el campo "direccion" con "Calle 80 # 30-40"
    Y agrega ubicacion incompleta sin giro ni garantias
    Entonces hay al menos una ubicacion en la lista

    # Paso 5: Avanzar a información técnica
    Cuando hace clic en "Siguiente"
    Entonces es redirigido a la página de información técnica

    # Paso 6: Calcular prima
    Cuando hace clic en el botón "Calcular Prima"
    Entonces el resultado de prima neta es mayor que cero
    Y el resultado de prima comercial es mayor que cero

    # Paso 7: Verificar prima comercial mayor que neta
    Y la prima comercial es mayor que la prima neta

    # Paso 8: Verificar alerta por ubicación incompleta
    Entonces se muestra alerta por ubicación incompleta en los resultados

    # Paso 9: Ver resultado en términos y confirmar estado
    Cuando hace clic en "Términos y Confirmación"
    Entonces es redirigido a la página de términos y confirmación
    Y la página de términos muestra los valores de prima

  @flujo_simple @smoke
  Escenario: Flujo básico desde cotizador hasta prima calculada
    # Paso 1: Ir al cotizador y crear folio
    Dado que el usuario navega a la página del cotizador
    Cuando ingresa el nombre del asegurado "Empresa Flujo Simple"
    Y ingresa el correo "simple@test.co"
    Y ingresa el código de agente "AG001"
    Y hace clic en el botón "Crear Folio"
    Entonces es redirigido a la página de datos generales
    Y el número de folio aparece en el encabezado

    # Paso 2: Avanzar datos generales
    Cuando hace clic en "Siguiente"
    Entonces es redirigido a la página de ubicaciones

    # Paso 3: Agregar ubicación
    Cuando ingresa 1 en el campo de cantidad de ubicaciones
    Y hace clic en "Guardar Layout"
    Y hace clic en "+ Agregar Ubicación"
    Y completa el campo "nombre_ubicacion" con "Sede Única"
    Y completa el campo "direccion" con "Carrera 15 # 93-75"
    Y completa el campo "codigo_postal" con "110111"
    Y espera a que se cargue la información del CP
    Y selecciona el primer giro disponible
    Y selecciona "LADRILLO_CONCRETO" en el campo "tipo_constructivo"
    Y completa el campo "anio_construccion" con "2015"
    Y selecciona la garantía "INCENDIO_EDIFICIOS"
    Y hace clic en "Guardar Ubicación"
    Y hace clic en "Siguiente"
    Entonces es redirigido a la página de información técnica

    # Paso 4: Calcular prima
    Cuando hace clic en el botón "Calcular Prima"
    Entonces el resultado de prima neta es mayor que cero
    Y el resultado de prima comercial es mayor que cero

    # Paso 5: Ver resultado en términos
    Cuando hace clic en "Términos y Confirmación"
    Entonces es redirigido a la página de términos y confirmación
    Y la página de términos muestra los valores de prima
