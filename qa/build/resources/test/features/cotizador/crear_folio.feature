# language: es
@cotizador @ui
Característica: Creación de Folio desde el Cotizador
  Como usuario del sistema
  Quiero crear un nuevo folio desde la página del cotizador
  Para iniciar el proceso de cotización

  Antecedentes:
    Dado que el usuario navega a la página del cotizador

  @crear_folio_ui @smoke
  Escenario: Crear folio completando el formulario básico
    Cuando ingresa el nombre del asegurado "Empresa Test S.A."
    Y ingresa el correo "test@empresa.co"
    Y ingresa el código de agente "AG001"
    Y hace clic en el botón "Crear Folio"
    Entonces es redirigido a la página de datos generales
    Y el número de folio aparece en el encabezado

  @campos_vacios @error_path
  Escenario: Intentar crear folio sin nombre muestra error
    Cuando hace clic en el botón "Crear Folio" sin completar campos
    Entonces permanece en la página del cotizador

  @cotizaciones_recientes @smoke
  Escenario: Las cotizaciones recientes se muestran en el panel derecho
    Dado que existen cotizaciones previas en el sistema
    Entonces el panel de cotizaciones recientes es visible
