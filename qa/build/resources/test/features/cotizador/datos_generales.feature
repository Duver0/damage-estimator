# language: es
@datos_generales @ui
Característica: Captura de Datos Generales del Asegurado
  Como usuario del sistema
  Quiero completar los datos generales de la cotización
  Para continuar con el registro de ubicaciones

  Antecedentes:
    Dado que existe un folio activo y el usuario está en datos generales

  @completar_datos @smoke
  Escenario: Completar datos generales y avanzar a ubicaciones
    Cuando completa el campo "nombre" con "Empresa Colombiana S.A."
    Y completa el campo "apellidos" con "Sociedad Anónima"
    Y completa el campo "email" con "empresa@co.co"
    Y completa el campo "telefono" con "+573001234567"
    Y completa el campo "numeroIdentificacion" con "900123456"
    Y selecciona "NIT" en el campo "tipoIdentificacion"
    Y hace clic en "Siguiente"
    Entonces es redirigido a la página de ubicaciones

  @campo_requerido @error_path
  Escenario: Intentar avanzar sin nombre de asegurado
    Cuando borra el contenido del campo "nombre"
    Y hace clic en "Siguiente"
    Entonces permanece en la página de datos generales

  @navegacion_atras @smoke
  Escenario: El botón Atrás regresa al cotizador
    Cuando hace clic en "Atrás"
    Entonces la URL contiene "/cotizador"
