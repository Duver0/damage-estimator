# QA Suite — Cotizador de Daños

Suite automatizada con **Serenity BDD** + **Cucumber** + **Selenium** (patrón Screenplay).

Stack: Java 17, Gradle 8.x, Serenity BDD 3.9.8, Cucumber 7.15.0, Selenium 4.18.1.

---

## Requisitos Previos

- Java 17+
- Google Chrome instalado
- Frontend corriendo en `http://localhost:5173` (o configurar vía `-Dfrontend.url`)
- Backend corriendo en `http://localhost:8000`
- MongoDB con fixtures cargadas

---

## Ejecución

### Modo local (Chrome headless)
```bash
cd qa
./gradlew clean test -Denvironment=local -Dfrontend.url=http://localhost:5173
```

### Todos los tests (entorno Docker por defecto)
```bash
./gradlew clean test
```

### Solo smoke (críticos, rápido)
```bash
./gradlew clean test -Denvironment=local -Dcucumber.filter.tags="@smoke"
```

### Solo E2E (escenario de aceptación del RETO)
```bash
./gradlew clean test -Denvironment=local -Dcucumber.filter.tags="@escenario_aceptacion"
```

### Solo por feature
```bash
./gradlew clean test -Denvironment=local -Dcucumber.filter.tags="@cotizador"
./gradlew clean test -Denvironment=local -Dcucumber.filter.tags="@ubicaciones_ui"
./gradlew clean test -Denvironment=local -Dcucumber.filter.tags="@calculo_ui"
./gradlew clean test -Denvironment=local -Dcucumber.filter.tags="@dashboard"
```

### Solo generar reporte (sobre resultados existentes)
```bash
./gradlew serenityReport
```

Reportes HTML generados en: `target/site/serenity/`
 para ver el reporte desde linux:

```bash
xdg-open target/site/serenity/index.html
```
---

## Estructura del Proyecto

```
qa/
├── build.gradle                         # Gradle: Serenity 3.9.8, Cucumber 7.15.0, Selenium 4.18.1
├── settings.gradle
├── gradle.properties
├── README.md
└── src/test/
    ├── java/com/cotizador/
    │   ├── features/                    # Step Definitions (Cucumber)
    │   │   ├── CommonUIStepDefinitions  # Steps genéricos reutilizables + backgrounds
    │   │   ├── CotizadorStepDefinitions # Steps de crear folio
    │   │   ├── DashboardStepDefinitions # Steps del dashboard
    │   │   ├── UbicacionesUIStepDefinitions # Steps de ubicaciones
    │   │   └── CalculoUIStepDefinitions # Steps de cálculo de prima
    │   ├── screenplay/
    │   │   ├── actors/                  # Actores y abilities (p. ej. Usuario)
    │   │   ├── interactions/            # Interacciones de bajo nivel (p. ej. TriggerBlur)
    │   │   ├── tasks/                   # Verbos de negocio
    │   │   │   ├── NavegarA             # Navegar a rutas del frontend
    │   │   │   ├── CompletarCampo       # Llenar campo de formulario
    │   │   │   ├── SeleccionarOpcion    # Seleccionar en dropdown
    │   │   │   ├── CrearFolioDesdeUI    # Crear folio desde CotizadorPage
    │   │   │   └── PrepararFolioConUbicacion # Setup: folio + ubicación completa
    │   │   ├── questions/               # Estados observables
    │   │   │   ├── UrlActual            # URL del navegador
    │   │   │   ├── CantidadDeElementos  # Número de elementos en DOM
    │   │   │   └── ValorNumericoEnPantalla # Extraer número de un elemento
    │   │   └── targets/                 # Locators de elementos UI
    │   │       ├── CotizadorTargets
    │   │       ├── DashboardTargets
    │   │       ├── FormularioTargets
    │   │       ├── UbicacionesTargets
    │   │       └── CalculoTargets
    │   ├── runners/                     # JUnit runners (uno por feature)
    │   │   ├── CotizadorRunnerIT
    │   │   ├── DashboardRunnerIT
    │   │   ├── E2EUIRunnerIT
    │   │   └── SmokeUIRunnerIT
    │   └── utils/
    │       └── ConfiguracionUI          # URL base del frontend
    └── resources/
        ├── features/
        │   ├── cotizador/
        │   │   ├── crear_folio.feature
        │   │   ├── datos_generales.feature
        │   │   ├── ubicaciones_ui.feature
        │   │   └── calculo_ui.feature
        │   ├── dashboard/
        │   │   └── gestion_cotizaciones.feature
        │   └── e2e/
        │       └── flujo_completo_ui.feature
        └── serenity.conf               # Configuración de browser y URLs
```

---

## Features y Escenarios Cubiertos

### `@cotizador` — Crear Folio
- Crear folio completando el formulario básico
- Intentar crear folio sin nombre (validación)
- Cotizaciones recientes visibles en panel derecho

### `@datos_generales` — Datos Generales
- Completar datos y avanzar a ubicaciones
- Intentar avanzar sin nombre (validación)
- Botón Atrás regresa al cotizador

### `@ubicaciones_ui` — Ubicaciones de Riesgo
- Definir layout de N ubicaciones
- Agregar ubicación completa (CP + giro + garantía)
- Agregar ubicación incompleta sin garantías (error de validación)
- Avanzar a información técnica
- Botón Atrás regresa a datos generales

### `@calculo_ui` — Cálculo de Prima
- Calcular prima y ver resultado financiero
- Prima comercial mayor que prima neta
- Avanzar a términos tras calcular
- Página de términos muestra primas

### `@dashboard` — Dashboard de Cotizaciones
- Dashboard carga con título y tabla visibles
- Crear nueva cotización desde dashboard
- Eliminar cotización
- Ver y editar cotización existente

### `@e2e_ui @escenario_aceptacion` — Flujo Completo (Escenario de Aceptación RETO)

Cubre los 9 pasos del RETO:
1. Crear folio nuevo desde dashboard
2. Capturar datos generales
3. Definir layout de 2 ubicaciones
4. Registrar ubicación completa (CP + giro + garantía INCENDIO_EDIFICIOS)
5. Intentar agregar ubicación incompleta (sin garantías) → error de validación
6. Calcular prima
7. Ver prima neta y comercial calculadas
8. Ver que prima comercial > prima neta (margen 35%)
9. Navegar a términos y confirmación → ver primas

---

## Datos de Prueba

Valores reales de fixtures del backend (`/backend/fixtures/`):
- **CP**: `110111` → Bogotá D.C., La Candelaria (no zona CAT)
- **Agente**: `AG001`
- **Giro**: primer giro disponible del catálogo
- **Garantía**: `INCENDIO_EDIFICIOS` → label "Incendio - Edificio"
- **Tipo constructivo**: `LADRILLO_CONCRETO`

---

## Configuración de Entornos

`serenity.conf` soporta tres entornos:

| Entorno | Driver | URL Frontend |
|---------|--------|-------------|
| `default` | Remote Selenium (Docker) | `http://cotizador_frontend:80` |
| `local` | Chrome headless local | Configurable con `-Dfrontend.url=...` |
| `docker` | Remote Selenium | `http://selenium:4444` |

Ejemplo ejecución local completa:
```bash
./gradlew clean test \
  -Denvironment=local \
  -Dfrontend.url=http://localhost:5173
```

---

## Patrón Screenplay

- **Actors** (actores): centralizados en `screenplay/actors`, configurados en `ScreenplayHooks` (habilidades como `BrowseTheWeb`).
- **Interactions** (interacciones): operaciones de bajo nivel en `screenplay/interactions` (ej. `TriggerBlur`).
- **Tasks** (verbos): `NavegarA`, `CompletarCampo`, `SeleccionarOpcion`, `CrearFolioDesdeUI`, `PrepararFolioConUbicacion`
- **Questions** (estado observable): `UrlActual`, `CantidadDeElementos`, `ValorNumericoEnPantalla`, `PrimaPorLabel`, `TextoDelElemento`
- **Targets** (locators): agrupados por página/sección

---

## Supuestos

- Sin autenticación en fase 1
- CP `110111` existe en fixtures del backend
- Los giros del backend están cargados en MongoDB (via seed)
- La garantía `INCENDIO_EDIFICIOS` tiene label "Incendio - Edificio" en el frontend
- El margen comercial es 35% fijo
- El frontend usa CSS Modules — los selectores con `[class*='nombre']` son compatibles
