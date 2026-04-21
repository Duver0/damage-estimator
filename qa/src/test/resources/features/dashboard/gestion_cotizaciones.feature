# language: es
@dashboard @ui
Característica: Gestión de Cotizaciones en el Dashboard
  Como usuario del sistema de cotización
  Quiero gestionar mis cotizaciones desde el dashboard
  Para tener control centralizado de todas mis cotizaciones

  Antecedentes:
    Dado que el usuario abre la aplicación en el dashboard

  @dashboard_carga @smoke
  Escenario: El dashboard carga con título y tabla visibles
    Entonces ve el título "Dashboard de Cotizaciones"
    Y la tabla de cotizaciones es visible en la página

  @nueva_cotizacion_dashboard @smoke
  Escenario: El botón Nueva Cotización crea una cotización y navega a datos generales
    Cuando hace clic en el botón "Nueva Cotización"
    Entonces la URL contiene "general-info"

  @eliminar_cotizacion @smoke
  Escenario: Eliminar cotización desde el dashboard
    Dado que existe al menos una cotización registrada
    Cuando hace clic en el botón eliminar de la primera cotización
    Y confirma la eliminación en el diálogo
    Entonces la lista de cotizaciones se actualiza

  @ver_cotizacion @smoke
  Escenario: Ver detalle de una cotización existente
    Dado que existe al menos una cotización registrada
    Cuando hace clic en el botón ver de la primera cotización
    Entonces la URL contiene "/view"

  @editar_cotizacion @smoke
  Escenario: Editar cotización navega a datos generales
    Dado que existe al menos una cotización registrada
    Cuando hace clic en el botón editar de la primera cotización
    Entonces la URL contiene "/general-info"
