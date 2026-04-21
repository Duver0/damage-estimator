---
id: SPEC-002
status: IMPLEMENTED
feature: cotizador-backend-ubicaciones
description: Gestión de ubicaciones de riesgo - endpoints para configurar layout, registrar, consultar y editar ubicaciones
created: 2026-04-17
updated: 2026-04-20
author: spec-generator
version: "1.0"
related-specs: ["SPEC-001", "SPEC-003"]
---

# Spec: Backend API - Gestión de Ubicaciones

> **Estado:** `APPROVED` ✅ Listo para implementación.

---

## 1. REQUERIMIENTOS

### Descripción

Este módulo maneja el ciclo de vida de ubicaciones de riesgo dentro de una cotización: configuración del layout (cuántas ubicaciones se capturarán), registro y edición de ubicaciones individuales, validación de datos de ubicación, y cálculo del estado de completitud. Las ubicaciones incompletas generan alertas pero no bloquean el cálculo general.

### Requerimiento de Negocio

El sistema debe permitir a usuarios definir un layout (cantidad de ubicaciones a asegurar), registrar datos detallados de cada ubicación (dirección, código postal, giro, tipo constructivo, etc.), validar que los datos requeridos sean correctos, y marcar ubicaciones como completas o incompletas. El backend valida contra catálogos de códigos postales, giros de negocio y garantías, permitiendo que ubicaciones incompletas generen alertas sin bloquear el flujo general.

### Historias de Usuario

#### HU-07: Configurar layout de ubicaciones

```
Como:        Usuario del sistema de cotización
Quiero:      Definir cuántas ubicaciones va a tener la cotización
Para:        Establecer la estructura de ubicaciones antes de capturar datos

Prioridad:   Alta
Estimación:  XS
Dependencias: HU-01 (folio debe existir)
Capa:        Backend
```

#### Criterios de Aceptación — HU-07

**Happy Path**
```gherkin
CRITERIO-7.1: Crear layout exitosamente
  Dado que:    existe folio "F12345" con layout sin definir
  Cuando:      invoca PUT /v1/quotes/{folio}/locations/layout con { cantidadUbicaciones: 3, version: 1 }
  Entonces:    recibe HTTP 200 con { cantidadUbicaciones: 3, puedeAgregarMas: true, version: 2 }
```

**Error Path**
```gherkin
CRITERIO-7.2: Cantidad inválida
  Dado que:    existe folio "F12345"
  Cuando:      invoca PUT /v1/quotes/F12345/locations/layout con { cantidadUbicaciones: 0 }
  Entonces:    recibe HTTP 400 con { detail: "cantidadUbicaciones debe ser >= 1" }
```

#### HU-08: Registrar ubicación

```
Como:        Usuario del sistema de cotización
Quiero:      Agregar una ubicación de riesgo a la cotización
Para:        Capturar datos técnicos y de ubicación geográfica de un riesgo

Prioridad:   Alta
Estimación:  M
Dependencias: HU-01, HU-07
Capa:        Backend
```

#### Criterios de Aceptación — HU-08

**Happy Path**
```gherkin
CRITERIO-8.1: Registrar ubicación nueva exitosamente
  Dado que:    existe folio "F12345" con layout de 2 ubicaciones
  Cuando:      invoca PUT /v1/quotes/{folio}/locations con { ubicaciones: [ { nombreUbicacion: "Casa Principal", ... } ] }
  Entonces:    recibe HTTP 200 con { ubicaciones: [ { indice: 0, ... } ], version: 3 }
```

**Error Path**
```gherkin
CRITERIO-8.2: Código postal inválido
  Dado que:    existe folio "F12345"
  Cuando:      invoca PUT /v1/quotes/F12345/locations con { ubicaciones: [ { codigoPostal: "XXXX" } ] }
  Entonces:    recibe HTTP 400 con { detail: "Código postal inválido: XXXX" }
```

```gherkin
CRITERIO-8.3: Giro sin clave de incendio
  Dado que:    existe folio "F12345"
  Cuando:      invoca PUT /v1/quotes/F12345/locations con { ubicaciones: [ { giro: { claveGiro: "0101", claveIncendio: null } } ] }
  Entonces:    recibe HTTP 400 con { detail: "Ubicación requiere giro.claveIncendio para cálculo" }
```

#### HU-09: Consultar ubicaciones

```
Como:        Usuario del sistema de cotización
Quiero:      Obtener todas las ubicaciones registradas de una cotización
Para:        Ver el estado y datos de cada ubicación

Prioridad:   Alta
Estimación:  XS
Dependencias: HU-08
Capa:        Backend
```

#### Criterios de Aceptación — HU-09

**Happy Path**
```gherkin
CRITERIO-9.1: Obtener ubicaciones exitosamente
  Dado que:    existe folio "F12345" con 2 ubicaciones registradas
  Cuando:      invoca GET /v1/quotes/{folio}/locations
  Entonces:    recibe HTTP 200 con { ubicaciones: [ { indice: 0, ... }, { indice: 1, ... } ], version: 3 }
```

#### HU-10: Editar ubicación individual

```
Como:        Usuario del sistema de cotización
Quiero:      Actualizar datos de una ubicación específica
Para:        Corregir o cambiar información de una ubicación

Prioridad:   Alta
Estimación:  S
Dependencias: HU-08
Capa:        Backend
```

#### Criterios de Aceptación — HU-10

**Happy Path**
```gherkin
CRITERIO-10.1: Editar ubicación exitosamente
  Dado que:    existe folio "F12345" con ubicación en índice 0
  Cuando:      invoca PATCH /v1/quotes/{folio}/locations/{índice} con { codigoPostal: "28001" } y version: 3
  Entonces:    recibe HTTP 200 con ubicación actualizada y version: 4
```

**Error Path**
```gherkin
CRITERIO-10.2: Índice inválido
  Dado que:    existe folio "F12345" con 2 ubicaciones (índices 0, 1)
  Cuando:      invoca PATCH /v1/quotes/F12345/locations/99 con { ... }
  Entonces:    recibe HTTP 404 con { detail: "Ubicación en índice 99 no existe" }
```

#### HU-11: Consultar resumen de ubicaciones

```
Como:        Usuario del sistema de cotización
Quiero:      Obtener un resumen de la completitud de ubicaciones
Para:        Saber cuántas ubicaciones están completas e incompletas

Prioridad:   Media
Estimación:  S
Dependencias: HU-08
Capa:        Backend
```

#### Criterios de Aceptación — HU-11

**Happy Path**
```gherkin
CRITERIO-11.1: Obtener resumen exitosamente
  Dado que:    existe folio "F12345" con 2 ubicaciones (1 completa, 1 incompleta)
  Cuando:      invoca GET /v1/quotes/{folio}/locations/summary
  Entonces:    recibe HTTP 200 con { completas: 1, incompletas: 1, alertas: [ ... ] }
```

### Reglas de Negocio

1. **Validación de código postal:** Debe existir en catálogo `catalogo_cp_zonas`. Validación contra servicio de referencia o fixture.

2. **Validación de giro:** El `giro.claveGiro` debe existir en catálogo. La `giro.claveIncendio` es obligatoria para cálculo (si falta, ubicación es incompleta).

3. **Garantías:** Deben ser válidas según catálogo de garantías. Cada garantía requiere `codigoGarantia`, `nombre`, `suma_asegurada`, `prima`.

4. **Estados de ubicación:**
   - `INCOMPLETA` — falta algún dato obligatorio (CP no validado, giro sin clave incendio, sin garantías)
   - `COMPLETA` — todos los datos requeridos están presentes y validados
   - Estado se calcula, no se asigna manualmente

5. **Alertas:** Ubicaciones incompletas generan alertas (tipo `INCOMPLETO`) en el `estado` general, pero NO bloquean cálculo de otras ubicaciones.

6. **Zona catastrófica:** Si el CP está en zona CAT (columna `es_zona_cat` en `catalogo_cp_zonas`), se marca `zonaCatastrofica: true` y se aplican validaciones especiales en cálculo.

7. **Actualización parcial (PATCH):** PATCH permite cambiar un campo sin enviar el documento entero. PUT requiere reenviar todos los campos de la ubicación.

8. **Versionado de ubicaciones:** La versión de la cotización se incrementa si se modifica ubicaciones (PUT o PATCH).

9. **Límite de ubicaciones:** No hay límite técnico; el layout define lo esperado, pero se permite agregar más si `puedeAgregarMas: true`.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas

| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `Ubicacion` | incluido en `Cotizacion.ubicaciones[]` | nueva | Datos técnicos y geográficos de cada riesgo |
| `ConfiguracionLayout` | incluido en `Cotizacion.configuracionLayout` | modificada | Cantidad y estado de ubicaciones |

#### Documento Ubicación (sub-documento en Cotización)

```json
{
  "indice": 0,
  "nombreUbicacion": "Casa Principal",
  "direccion": "Calle Principal 123",
  "codigoPostal": "28001",
  "estado": "MADRID",
  "municipio": "Madrid",
  "colonia": "Centro",
  "ciudad": "Madrid",
  "tipoConstructivo": "LADRILLO_CONCRETO",
  "nivel": 1,
  "anioConstruccion": 2010,
  "giro": {
    "claveGiro": "6311",
    "claveIncendio": "1000",
    "descripcion": "Oficinas administrativas"
  },
  "garantias": [
    {
      "codigoGarantia": "INCENDIO_EDIFICIOS",
      "nombre": "Incendio - Edificio",
      "sumaAsegurada": 500000,
      "prima": 0,
      "tasa": 0.005
    },
    {
      "codigoGarantia": "INCENDIO_CONTENIDOS",
      "nombre": "Incendio - Contenidos",
      "sumaAsegurada": 250000,
      "prima": 0,
      "tasa": 0.01
    }
  ],
  "zonaCatastrofica": false,
  "estadoValidacion": "COMPLETA",
  "alertasBloqueantes": [],
  "fechaCreacion": "2026-04-17T10:45:00Z",
  "fechaActualizacion": "2026-04-17T10:45:00Z"
}
```

#### Campos del modelo - Ubicación

| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `indice` | integer | sí | >= 0, único dentro array | Posición en array de ubicaciones |
| `nombreUbicacion` | string | sí | máx 200 chars, no vacío | Nombre descriptivo (ej. Casa Principal) |
| `direccion` | string | sí | máx 500 chars | Dirección completa |
| `codigoPostal` | string | sí | validar contra catálogo | Código postal (ej. 28001) |
| `estado` | string | sí | válido en catálogo | Entidad federativa (ej. MADRID) |
| `municipio` | string | sí | máx 200 chars | Municipio |
| `colonia` | string | no | máx 200 chars | Colonia/delegación |
| `ciudad` | string | sí | máx 200 chars | Ciudad principal |
| `tipoConstructivo` | enum | sí | válido en catálogo | LADRILLO_CONCRETO, ACERO, MADERA, etc. |
| `nivel` | integer | sí | >= 1 | Número de pisos o nivel principal |
| `anioConstruccion` | integer | sí | >= 1900, <= año actual | Año de construcción |
| `giro.claveGiro` | string | sí | validar contra catálogo | Clave del giro de negocio |
| `giro.claveIncendio` | string | sí para cálculo | no vacío | Clave de tarificación de incendio |
| `giro.descripcion` | string | no | máx 300 chars | Descripción del giro |
| `garantias[]` | array | sí | mín 1 garantía | Array de coberturas tarifables |
| `garantias[].codigoGarantia` | string | sí | validar contra catálogo | Código único de garantía |
| `garantias[].sumaAsegurada` | number | sí | > 0 | Monto asegurado |
| `zonaCatastrofica` | boolean | sí | derivada del CP | Si está en zona CAT |
| `estadoValidacion` | enum | sí | INCOMPLETA \| COMPLETA | Derivado de validaciones |
| `alertasBloqueantes` | array | sí | puede estar vacío | Listado de alertas si incompleta |

#### Sub-documento Garantía

| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `codigoGarantia` | string | sí | único en array | Código de cobertura |
| `nombre` | string | sí | máx 200 chars | Nombre de la cobertura |
| `sumaAsegurada` | number | sí | > 0 | Suma a asegurar |
| `prima` | number | no | >= 0, calculado | Prima unitaria (calculado en paso siguiente) |
| `tasa` | number | no | >= 0, del catálogo | Tasa técnica |

#### Índices / Constraints

- **Index: cotizacion_id + indice** — búsqueda de ubicación específica
- **Index: codigoPostal** — búsqueda por zona geográfica
- **Index: estadoValidacion** — para reportes de completitud
- **Constraint: indice único dentro array** — no hay dos ubicaciones con mismo indice

### API Endpoints

#### PUT /v1/quotes/{folio}/locations/layout

- **Descripción:** Define el layout (cantidad de ubicaciones esperadas)
- **Auth requerida:** no
- **Request Body:**
  ```json
  {
    "version": 1,
    "cantidadUbicaciones": 3
  }
  ```
- **Response 200:**
  ```json
  {
    "numeroFolio": "F202604170001",
    "configuracionLayout": {
      "cantidadUbicaciones": 3,
      "puedeAgregarMas": true
    },
    "version": 2,
    "fechaUltimaActualizacion": "2026-04-17T10:45:00Z"
  }
  ```
- **Response 400:**
  ```json
  {
    "detail": "cantidadUbicaciones debe ser >= 1"
  }
  ```
- **Response 404:**
  ```json
  {
    "detail": "Folio no encontrado"
  }
  ```

#### GET /v1/quotes/{folio}/locations/layout

- **Descripción:** Obtiene la configuración del layout
- **Auth requerida:** no
- **Response 200:**
  ```json
  {
    "numeroFolio": "F202604170001",
    "configuracionLayout": {
      "cantidadUbicaciones": 3,
      "puedeAgregarMas": true
    },
    "version": 2
  }
  ```

#### PUT /v1/quotes/{folio}/locations

- **Descripción:** Registra o reemplaza el array completo de ubicaciones
- **Auth requerida:** no
- **Request Body:**
  ```json
  {
    "version": 2,
    "ubicaciones": [
      {
        "nombreUbicacion": "Casa Principal",
        "direccion": "Calle Principal 123",
        "codigoPostal": "28001",
        "estado": "MADRID",
        "municipio": "Madrid",
        "ciudad": "Madrid",
        "tipoConstructivo": "LADRILLO_CONCRETO",
        "nivel": 1,
        "anioConstruccion": 2010,
        "giro": {
          "claveGiro": "6311",
          "claveIncendio": "1000",
          "descripcion": "Oficinas administrativas"
        },
        "garantias": [
          {
            "codigoGarantia": "INCENDIO_EDIFICIOS",
            "nombre": "Incendio - Edificio",
            "sumaAsegurada": 500000
          }
        ]
      },
      {
        "nombreUbicacion": "Bodega",
        "direccion": "Calle Secundaria 456",
        "codigoPostal": "28004",
        "estado": "MADRID",
        "municipio": "Madrid",
        "ciudad": "Madrid",
        "tipoConstructivo": "ACERO",
        "nivel": 2,
        "anioConstruccion": 2015,
        "giro": {
          "claveGiro": "5210",
          "claveIncendio": "2000",
          "descripcion": "Almacenamiento"
        },
        "garantias": [
          {
            "codigoGarantia": "INCENDIO_EDIFICIOS",
            "nombre": "Incendio - Edificio",
            "sumaAsegurada": 800000
          }
        ]
      }
    ]
  }
  ```
- **Response 200:**
  ```json
  {
    "numeroFolio": "F202604170001",
    "ubicaciones": [
      {
        "indice": 0,
        "nombreUbicacion": "Casa Principal",
        ...,
        "estadoValidacion": "COMPLETA",
        "alertasBloqueantes": []
      },
      {
        "indice": 1,
        "nombreUbicacion": "Bodega",
        ...,
        "estadoValidacion": "INCOMPLETA",
        "alertasBloqueantes": [
          {
            "tipo": "FALTA_GARANTIA",
            "mensaje": "Requiere al menos una garantía para cálculo"
          }
        ]
      }
    ],
    "version": 3,
    "fechaUltimaActualizacion": "2026-04-17T10:50:00Z"
  }
  ```
- **Response 400:**
  ```json
  {
    "detail": "Validación fallida en ubicación índice 1: Código postal 28999 no válido"
  }
  ```

#### GET /v1/quotes/{folio}/locations

- **Descripción:** Obtiene todas las ubicaciones registradas
- **Auth requerida:** no
- **Response 200:** (mismo formato que PUT respuesta)

#### PATCH /v1/quotes/{folio}/locations/{índice}

- **Descripción:** Actualiza parcialmente una ubicación específica
- **Auth requerida:** no
- **Request Body:**
  ```json
  {
    "version": 3,
    "codigoPostal": "28002",
    "nivel": 2
  }
  ```
- **Response 200:**
  ```json
  {
    "indice": 0,
    "nombreUbicacion": "Casa Principal",
    ...,
    "codigoPostal": "28002",
    "nivel": 2,
    "estadoValidacion": "COMPLETA",
    "alertasBloqueantes": []
  }
  ```
- **Response 404:**
  ```json
  {
    "detail": "Ubicación en índice 99 no existe"
  }
  ```
- **Response 409:**
  ```json
  {
    "detail": "Versión desactualizada"
  }
  ```

#### GET /v1/quotes/{folio}/locations/summary

- **Descripción:** Obtiene resumen de completitud de ubicaciones
- **Auth requerida:** no
- **Response 200:**
  ```json
  {
    "numeroFolio": "F202604170001",
    "resumen": {
      "totalUbicaciones": 2,
      "ubicacionesCompletas": 1,
      "ubicacionesIncompletas": 1,
      "porcentajeCompletitud": 50
    },
    "alertas": [
      {
        "ubicacionIndice": 1,
        "tipo": "INCOMPLETO",
        "mensaje": "Ubicación 2: falta giro con claveIncendio"
      }
    ],
    "version": 3
  }
  ```

### Arquitectura y Dependencias

#### Capas de Backend

```
routes/ubicaciones_router.py
  ↓
services/ubicaciones_service.py
  ↓
repositories/ubicaciones_repository.py (acceso a ubicaciones dentro Cotizacion)
  ↓
MongoDB (cotizaciones_danos)
```

**Servicios externos consultados:**
- Catálogo de códigos postales (`catalogo_cp_zonas`)
- Catálogo de giros de negocio (`catalogo_giros`)
- Catálogo de garantías (`catalogo_garantias`)
- Validador de datos (stub aceptable)

#### Servicios y Repositorio

**`models/ubicaciones_model.py`** — Schemas Pydantic:
- `GarantiaInput` — datos de garantía desde cliente
- `GarantiaResponse` — respuesta de garantía
- `UbicacionInput` — ubicación desde cliente
- `UbicacionResponse` — ubicación en respuesta
- `UbicacionesUpdate` — update con version
- `LayoutUpdate` — actualización de layout

**`repositories/ubicaciones_repository.py`** — acceso a datos:
- `async def set_layout(folio: str, cantidad: int) -> dict`
- `async def get_layout(folio: str) -> dict`
- `async def set_ubicaciones(folio: str, ubicaciones: list) -> dict`
- `async def get_ubicaciones(folio: str) -> list`
- `async def update_ubicacion(folio: str, indice: int, data: dict) -> dict`
- `async def get_ubicacion(folio: str, indice: int) -> dict`

**`services/ubicaciones_service.py`** — lógica de negocio:
- `async def set_layout(folio: str, cantidad: int, version: int) -> dict` — validar cantidad, incrementar version
- `async def get_layout(folio: str) -> dict`
- `async def set_ubicaciones(folio: str, ubicaciones: list, version: int) -> dict` — validar cada ubicación contra catálogos, marcar como completa/incompleta
- `async def get_ubicaciones(folio: str) -> list`
- `async def update_ubicacion(folio: str, indice: int, data: dict, version: int) -> dict` — validación parcial
- `async def validate_ubicacion(ubicacion: dict) -> tuple[bool, list]` — retorna (es_valida, alertas)
- `async def get_summary(folio: str) -> dict` — calcula resumen y alertas

**`routes/ubicaciones_router.py`** — HTTP endpoints:
- Registrar todos los endpoints arriba listados

#### Dependencias

- **Catálogos:** Consumir o simular con fixtures (códigos postales, giros, garantías)
- **Validador de CP:** Puede ser endpoint externo o tabla local
- **Motor async:** Acceso a MongoDB
- **Pydantic v2:** Validación

### Notas de Implementación

1. **Validación de código postal:**
   - Consultar colección `catalogo_cp_zonas`
   - Campos esperados: `codigo_postal`, `estado`, `municipio`, `ciudad`, `es_zona_cat`
   - Si no existe, retornar 400
   - Si está en zona CAT, marcar `zonaCatastrofica: true`

2. **Validación de giro:**
   - Consultar catálogo de giros
   - `claveIncendio` es obligatoria para que ubicación sea calculable
   - Si falta, marcar ubicación como INCOMPLETA y agregar alerta

3. **Validación de garantías:**
   - Cada garantía requiere `codigoGarantia` válido
   - Mínimo 1 garantía para que ubicación sea calculable
   - Si falta, marcar INCOMPLETA

4. **Estado de validación:**
   - `COMPLETA` si: CP válido, giro con claveIncendio, mín 1 garantía
   - `INCOMPLETA` si alguno de lo anterior falta

5. **Actualización de versión:**
   - Siempre que se modifique ubicaciones (PUT o PATCH), incrementar version de Cotización
   - Esto asegura que cambios en ubicaciones sean trazables

6. **Índice de ubicación:**
   - Se asigna automáticamente al insertar (0, 1, 2, ...)
   - PATCH requiere índice válido

7. **PATCH vs PUT:**
   - PUT: reemplaza/crea todas las ubicaciones
   - PATCH: modifica solo los campos enviados de una ubicación específica

---

## 3. LISTA DE TAREAS

### Backend

#### Implementación

- [ ] Crear `models/ubicaciones_model.py` con schemas: `GarantiaInput`, `GarantiaResponse`, `UbicacionInput`, `UbicacionResponse`, `UbicacionesUpdate`, `LayoutUpdate`
- [ ] Crear `repositories/ubicaciones_repository.py` con métodos CRUD para ubicaciones (set_layout, get_layout, set_ubicaciones, get_ubicaciones, update_ubicacion)
- [ ] Crear `services/ubicaciones_service.py` con lógica de: validación de ubicación, cálculo de estado, validación de datos contra catálogos
- [ ] Crear `routes/ubicaciones_router.py` con endpoints: PUT/GET locations/layout, PUT/GET locations, PATCH locations/{índice}, GET locations/summary
- [ ] Registrar router en punto de entrada
- [ ] Crear fixtures/stubs para: catálogo de códigos postales, catálogo de giros, catálogo de garantías
- [ ] Implementar validador de código postal
- [ ] Implementar generador de alertas de incomplitud
- [ ] Implementar cálculo de `estadoValidacion` y `alertasBloqueantes`

#### Tests Backend

- [ ] `test_ubicaciones_service_set_layout_success` — definir layout válido
- [ ] `test_ubicaciones_service_set_layout_invalid_cantidad` — cantidad 0 o negativa retorna 400
- [ ] `test_ubicaciones_service_set_ubicaciones_success` — registrar ubicaciones válidas
- [ ] `test_ubicaciones_service_set_ubicaciones_invalid_cp` — código postal inválido retorna 400
- [ ] `test_ubicaciones_service_set_ubicaciones_missing_clave_incendio` — giro sin claveIncendio marca incompleta
- [ ] `test_ubicaciones_service_validate_ubicacion_completa` — ubicación válida retorna completa
- [ ] `test_ubicaciones_service_validate_ubicacion_incompleta` — ubicación sin giro retorna incompleta con alertas
- [ ] `test_ubicaciones_service_update_ubicacion_success` — PATCH actualiza un campo
- [ ] `test_ubicaciones_service_update_ubicacion_invalid_index` — índice inexistente retorna 404
- [ ] `test_ubicaciones_service_summary_multiple_locations` — resumen con ubicaciones completas e incompletas
- [ ] `test_ubicaciones_service_zona_catastrofica` — CP en zona CAT marca `zonaCatastrofica: true`
- [ ] `test_ubicaciones_repo_get_ubicacion_by_index` — obtener ubicación específica
- [ ] `test_ubicaciones_router_put_layout_201` — endpoint PUT layout retorna 200
- [ ] `test_ubicaciones_router_put_locations_200` — endpoint PUT locations retorna 200
- [ ] `test_ubicaciones_router_patch_200` — endpoint PATCH retorna 200
- [ ] `test_ubicaciones_router_get_summary_200` — endpoint GET summary retorna 200

### Frontend

- [ ] (Dependencia: spec-cotizador-frontend-main.spec.md)
- [ ] En página ubicaciones, permitir definir layout
- [ ] En página ubicaciones, capturar datos de cada ubicación
- [ ] Mostrar validaciones en tiempo real (CP existe, giro válido, garantías)
- [ ] Mostrar alertas de ubicaciones incompletas

### QA

- [ ] Ejecutar skill `/gherkin-case-generator` con criterios CRITERIO-7.1 a 11.1
- [ ] Ejecutar skill `/risk-identifier` — riesgos de validación y datos
- [ ] Validar cobertura de tests
- [ ] Prueba manual: definir layout, registrar 2 ubicaciones (1 completa, 1 incompleta), ver summary con alertas
- [ ] Validar que ubicaciones incompletas no bloquean flujo general

---

## Supuestos Confirmados ✅

1. **Catálogos de referencia:** NO existen servicios reales. Usar fixtures versionados (stubs/mocks) con contrato documentado en código.

2. **Ubicaciones incompletas:** SÍ permitidas. Generan alertas informativas pero NO bloquean el flujo ni el cálculo posterior.

3. **Zona catastrófica:** Si código postal está en zona CAT (tabla catalogo_cp_zonas), se marca automáticamente `zonaCatastrofica: true`. No requiere input usuario.

4. **Índices de ubicación:** Se asignan automáticamente (0, 1, 2, ...). Sin espacios vacíos ni eliminación en fase 1.

5. **Límite de ubicaciones:** Ilimitadas técnicamente (sin máximo en validación). Posible límite de performance (ej. 50-100) a monitorear en producción.

6. **Precisión de datos:** Código postal se valida contra catálogo. Otros campos validados pero sin límites numéricos (agregados en SPEC-003 para cálculo).

---

