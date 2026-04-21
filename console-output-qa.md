
Welcome to Gradle 8.5!

Here are the highlights of this release:
 - Support for running on Java 21
 - Faster first use with Kotlin DSL
 - Improved error and warning messages

For more details see https://docs.gradle.org/8.5/release-notes.html

Starting a Gradle Daemon (subsequent builds will be faster)
> Task :clearReports SKIPPED
> Task :clean
> Task :compileJava NO-SOURCE
> Task :processResources NO-SOURCE
> Task :classes UP-TO-DATE
> Task :compileTestJava
> Task :processTestResources
> Task :testClasses
> Task :test

com.cotizador.runners.CotizadorRunnerIT > Cálculo de Prima desde la Interfaz de Usuario.Calcular prima y ver resultado financiero FAILED
    java.lang.AssertionError: [Prima Neta > 0] 
    Expecting actual:
      0.0
    to be greater than:
      0.0
        at com.cotizador.features.CalculoUIStepDefinitions.verificarPrimaNetaMayorQueCero(CalculoUIStepDefinitions.java:32)
        at ✽.el resultado de prima neta es mayor que cero(classpath:features/cotizador/calculo_ui.feature:14)

com.cotizador.runners.CotizadorRunnerIT > Cálculo de Prima desde la Interfaz de Usuario.La prima comercial es mayor que la prima neta FAILED
    java.lang.AssertionError: [Prima Comercial > Prima Neta] 
    Expecting actual:
      0.0
    to be greater than:
      0.0
        at com.cotizador.features.CalculoUIStepDefinitions.verificarPrimaComercialMayorQueNeta(CalculoUIStepDefinitions.java:45)
        at ✽.la prima comercial es mayor que la prima neta(classpath:features/cotizador/calculo_ui.feature:20)

com.cotizador.runners.CotizadorRunnerIT > Cálculo de Prima desde la Interfaz de Usuario.Avanzar a términos tras calcular PASSED

com.cotizador.runners.CotizadorRunnerIT > Cálculo de Prima desde la Interfaz de Usuario.La página de términos muestra las primas calculadas FAILED
    java.lang.AssertionError: [Al menos un valor de prima > 0 en términos] 
    Expecting actual:
      0.0
    to be greater than:
      0.0
        at com.cotizador.features.CalculoUIStepDefinitions.verificarTerminosMuestranPrimas(CalculoUIStepDefinitions.java:57)
        at ✽.la página de términos muestra los valores de prima(classpath:features/cotizador/calculo_ui.feature:32)

com.cotizador.runners.CotizadorRunnerIT > Creación de Folio desde el Cotizador.Crear folio completando el formulario básico PASSED

com.cotizador.runners.CotizadorRunnerIT > Creación de Folio desde el Cotizador.Intentar crear folio sin nombre muestra error PASSED

com.cotizador.runners.CotizadorRunnerIT > Creación de Folio desde el Cotizador.Las cotizaciones recientes se muestran en el panel derecho PASSED

com.cotizador.runners.CotizadorRunnerIT > Captura de Datos Generales del Asegurado.Completar datos generales y avanzar a ubicaciones PASSED

com.cotizador.runners.CotizadorRunnerIT > Captura de Datos Generales del Asegurado.Intentar avanzar sin nombre de asegurado PASSED

com.cotizador.runners.CotizadorRunnerIT > Captura de Datos Generales del Asegurado.El botón Atrás regresa al cotizador PASSED

com.cotizador.runners.CotizadorRunnerIT > Registro de Ubicaciones de Riesgo en UI.Definir layout de 2 ubicaciones PASSED

com.cotizador.runners.CotizadorRunnerIT > Registro de Ubicaciones de Riesgo en UI.Agregar ubicación completa con CP válido PASSED

com.cotizador.runners.CotizadorRunnerIT > Registro de Ubicaciones de Riesgo en UI.Agregar ubicación incompleta sin garantías muestra error de validación PASSED

com.cotizador.runners.CotizadorRunnerIT > Registro de Ubicaciones de Riesgo en UI.Avanzar a información técnica con ubicación registrada PASSED

com.cotizador.runners.CotizadorRunnerIT > Registro de Ubicaciones de Riesgo en UI.El botón Atrás regresa a datos generales PASSED

com.cotizador.runners.DashboardRunnerIT > Gestión de Cotizaciones en el Dashboard.El dashboard carga con título y tabla visibles PASSED

com.cotizador.runners.DashboardRunnerIT > Gestión de Cotizaciones en el Dashboard.El botón Nueva Cotización crea una cotización y navega a datos generales PASSED

com.cotizador.runners.DashboardRunnerIT > Gestión de Cotizaciones en el Dashboard.Eliminar cotización desde el dashboard PASSED

com.cotizador.runners.DashboardRunnerIT > Gestión de Cotizaciones en el Dashboard.Ver detalle de una cotización existente PASSED

com.cotizador.runners.DashboardRunnerIT > Gestión de Cotizaciones en el Dashboard.Editar cotización navega a datos generales PASSED

com.cotizador.runners.E2EUIRunnerIT > Flujo Completo de Cotización en la Interfaz de Usuario.Flujo completo desde dashboard hasta prima calculada con ubicación incompleta FAILED
    java.lang.AssertionError: [Prima Neta > 0] 
    Expecting actual:
      0.0
    to be greater than:
      0.0
        at com.cotizador.features.CalculoUIStepDefinitions.verificarPrimaNetaMayorQueCero(CalculoUIStepDefinitions.java:32)
        at ✽.el resultado de prima neta es mayor que cero(classpath:features/e2e/flujo_completo_ui.feature:55)

com.cotizador.runners.E2EUIRunnerIT > Flujo Completo de Cotización en la Interfaz de Usuario.Flujo básico desde cotizador hasta prima calculada FAILED
    java.lang.AssertionError: [Prima Neta > 0] 
    Expecting actual:
      0.0
    to be greater than:
      0.0
        at com.cotizador.features.CalculoUIStepDefinitions.verificarPrimaNetaMayorQueCero(CalculoUIStepDefinitions.java:32)
        at ✽.el resultado de prima neta es mayor que cero(classpath:features/e2e/flujo_completo_ui.feature:102)

com.cotizador.runners.SmokeUIRunnerIT > Cálculo de Prima desde la Interfaz de Usuario.Calcular prima y ver resultado financiero FAILED
    java.lang.AssertionError: [Prima Neta > 0] 
    Expecting actual:
      0.0
    to be greater than:
      0.0
        at com.cotizador.features.CalculoUIStepDefinitions.verificarPrimaNetaMayorQueCero(CalculoUIStepDefinitions.java:32)
        at ✽.el resultado de prima neta es mayor que cero(classpath:features/cotizador/calculo_ui.feature:14)

com.cotizador.runners.SmokeUIRunnerIT > Cálculo de Prima desde la Interfaz de Usuario.La prima comercial es mayor que la prima neta FAILED
    java.lang.AssertionError: [Prima Comercial > Prima Neta] 
    Expecting actual:
      0.0
    to be greater than:
      0.0
        at com.cotizador.features.CalculoUIStepDefinitions.verificarPrimaComercialMayorQueNeta(CalculoUIStepDefinitions.java:45)
        at ✽.la prima comercial es mayor que la prima neta(classpath:features/cotizador/calculo_ui.feature:20)

com.cotizador.runners.SmokeUIRunnerIT > Cálculo de Prima desde la Interfaz de Usuario.Avanzar a términos tras calcular PASSED

com.cotizador.runners.SmokeUIRunnerIT > Cálculo de Prima desde la Interfaz de Usuario.La página de términos muestra las primas calculadas FAILED
    java.lang.AssertionError: [Al menos un valor de prima > 0 en términos] 
    Expecting actual:
      0.0
    to be greater than:
      0.0
        at com.cotizador.features.CalculoUIStepDefinitions.verificarTerminosMuestranPrimas(CalculoUIStepDefinitions.java:57)
        at ✽.la página de términos muestra los valores de prima(classpath:features/cotizador/calculo_ui.feature:32)

com.cotizador.runners.SmokeUIRunnerIT > Creación de Folio desde el Cotizador.Crear folio completando el formulario básico PASSED

com.cotizador.runners.SmokeUIRunnerIT > Creación de Folio desde el Cotizador.Las cotizaciones recientes se muestran en el panel derecho PASSED

com.cotizador.runners.SmokeUIRunnerIT > Captura de Datos Generales del Asegurado.Completar datos generales y avanzar a ubicaciones PASSED

com.cotizador.runners.SmokeUIRunnerIT > Captura de Datos Generales del Asegurado.El botón Atrás regresa al cotizador PASSED

com.cotizador.runners.SmokeUIRunnerIT > Registro de Ubicaciones de Riesgo en UI.Definir layout de 2 ubicaciones PASSED

com.cotizador.runners.SmokeUIRunnerIT > Registro de Ubicaciones de Riesgo en UI.Agregar ubicación completa con CP válido PASSED

com.cotizador.runners.SmokeUIRunnerIT > Registro de Ubicaciones de Riesgo en UI.Agregar ubicación incompleta sin garantías muestra error de validación PASSED

com.cotizador.runners.SmokeUIRunnerIT > Registro de Ubicaciones de Riesgo en UI.Avanzar a información técnica con ubicación registrada PASSED

com.cotizador.runners.SmokeUIRunnerIT > Registro de Ubicaciones de Riesgo en UI.El botón Atrás regresa a datos generales PASSED

com.cotizador.runners.SmokeUIRunnerIT > Gestión de Cotizaciones en el Dashboard.El dashboard carga con título y tabla visibles PASSED

com.cotizador.runners.SmokeUIRunnerIT > Gestión de Cotizaciones en el Dashboard.El botón Nueva Cotización crea una cotización y navega a datos generales PASSED

com.cotizador.runners.SmokeUIRunnerIT > Gestión de Cotizaciones en el Dashboard.Eliminar cotización desde el dashboard PASSED

com.cotizador.runners.SmokeUIRunnerIT > Gestión de Cotizaciones en el Dashboard.Ver detalle de una cotización existente PASSED

com.cotizador.runners.SmokeUIRunnerIT > Gestión de Cotizaciones en el Dashboard.Editar cotización navega a datos generales PASSED

com.cotizador.runners.SmokeUIRunnerIT > Flujo Completo de Cotización en la Interfaz de Usuario.Flujo completo desde dashboard hasta prima calculada con ubicación incompleta FAILED
    java.lang.AssertionError: [Prima Neta > 0] 
    Expecting actual:
      0.0
    to be greater than:
      0.0
        at com.cotizador.features.CalculoUIStepDefinitions.verificarPrimaNetaMayorQueCero(CalculoUIStepDefinitions.java:32)
        at ✽.el resultado de prima neta es mayor que cero(classpath:features/e2e/flujo_completo_ui.feature:55)

com.cotizador.runners.SmokeUIRunnerIT > Flujo Completo de Cotización en la Interfaz de Usuario.Flujo básico desde cotizador hasta prima calculada FAILED
    java.lang.AssertionError: [Prima Neta > 0] 
    Expecting actual:
      0.0
    to be greater than:
      0.0
        at com.cotizador.features.CalculoUIStepDefinitions.verificarPrimaNetaMayorQueCero(CalculoUIStepDefinitions.java:32)
        at ✽.el resultado de prima neta es mayor que cero(classpath:features/e2e/flujo_completo_ui.feature:102)

42 tests completed, 10 failed

> Task :test FAILED

> Task :aggregate
Generating Serenity Reports
  - Main report: file:///app/target/site/serenity/index.html
      - Test Root: null
      - Requirements base directory: null

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':test'.
> There were failing tests. See the report at: file:///app/build/reports/tests/test/index.html

* Try:
> Run with --scan to get full insights.

BUILD FAILED in 12m 27s5 actionable tasks: 5 executed
