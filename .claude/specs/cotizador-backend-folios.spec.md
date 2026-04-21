---
id: SPEC-001
status: IMPLEMENTED
feature: cotizador-backend-folios
description: Gestión de folios y cotizaciones - endpoints de creación, consulta y actualización de datos generales
created: 2026-04-17
updated: 2026-04-20
author: spec-generator
version: "1.0"
related-specs: ["SPEC-002", "SPEC-003", "SPEC-005"]
---

# Spec: Backend API - Gestión de Folios y Cotizaciones

> **Estado:** `APPROVED` ✅ Listo para implementación.

---

## 1. REQUERIMIENTOS

### Descripción

Este módulo backend maneja el ciclo de vida completo de una cotización: creación de folios con idempotencia, consulta y actualización de datos generales del asegurado, gestión de opciones de cobertura, y consulta del estado de la cotización. Es el punto de entrada y agregado raíz del dominio de cotizador de daños.

### Requerimiento de Negocio

El sistema debe permitir a usuarios crear un nuevo folio de cotización de daños, recuperar un folio existente, actualizar datos generales (asegurado, conducción, tipo de negocio, clasificación de riesgo), consultar y configurar opciones de cobertura, y conocer el estado actual de la cotización en todo momento. El backend debe garantizar idempotencia en creación, versionado optimista en actualizaciones, y trazabilidad de cambios.

### Historias de Usuario

#### HU-01: Crear un nuevo folio de cotización

```
Como:        Usuario del sistema de cotización
Quiero:      Crear un nuevo folio para iniciar una cotización de daños
Para:        Registrar una nueva solicitud de cotización y obtener un identificador único

Prioridad:   Alta
Estimación:  S
Dependencias: Ninguna
Capa:        Backend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Crear folio nuevo exitosamente
  Dado que:    el usuario no tiene un folio activo
  Cuando:      invoca POST /v1/folios
  Entonces:    recibe HTTP 201 con { numeroFolio, estadoCotizacion: "CREADA", version: 1, fechaCreacion }
```

**Error Path**
```gherkin
CRITERIO-1.2: Crear folio con request inválido
  Dado que:    la solicitud carece de datos requeridos
  Cuando:      invoca POST /v1/folios con body vacío o malformado
  Entonces:    recibe HTTP 400 con { detail: "Request body inválido" }
```

**Edge Case**
```gherkin
CRITERIO-1.3: Idempotencia - reintentos de creación
  Dado que:    ya existe un folio con numeroFolio "F12345"
  Cuando:      reenvía POST /v1/folios con la misma request (mismo Idempotency-Key)
  Entonces:    recibe HTTP 201 con el mismo folio (no duplicado)
```

#### HU-02: Consultar datos generales de una cotización

```
Como:        Usuario del sistema de cotización
Quiero:      Recuperar los datos generales de una cotización existente
Para:        Ver quién es el asegurado, el agente y otros datos administrativos

Prioridad:   Alta
Estimación:  XS
Dependencias: HU-01
Capa:        Backend
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Obtener datos generales exitosamente
  Dado que:    existe un folio "F12345" con datos generales completos
  Cuando:      invoca GET /v1/quotes/{folio}/general-info
  Entonces:    recibe HTTP 200 con { datosAsegurado, datosConduccion, tipoNegocio, clasificacionRiesgo, version, fechaUltimaActualizacion }
```

**Error Path**
```gherkin
CRITERIO-2.2: Folio no existe
  Dado que:    no existe folio "FNOEXISTE"
  Cuando:      invoca GET /v1/quotes/FNOEXISTE/general-info
  Entonces:    recibe HTTP 404 con { detail: "Folio no encontrado" }
```

#### HU-03: Actualizar datos generales de una cotización

```
Como:        Usuario del sistema de cotización
Quiero:      Actualizar datos generales (nombre, agente, tipo de negocio, riesgo)
Para:        Mantener la información del asegurado y conducción actualizada

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01
Capa:        Backend
```

#### Criterios de Aceptación — HU-03

**Happy Path**
```gherkin
CRITERIO-3.1: Actualizar datos generales exitosamente
  Dado que:    existe folio "F12345" con version actual 1
  Cuando:      invoca PUT /v1/quotes/F12345/general-info con { datosAsegurado.nombre: "Nuevo Nombre", datosConduccion.codigoAgente: "AG002" } y version: 1
  Entonces:    recibe HTTP 200 con { ...datos actualizados, version: 2, fechaUltimaActualizacion: <timestamp actual> }
```

**Error Path**
```gherkin
CRITERIO-3.2: Actualización con versionado optimista fallido
  Dado que:    existe folio "F12345" con version actual 2
  Cuando:      invoca PUT /v1/quotes/F12345/general-info con version: 1 (desactualizada)
  Entonces:    recibe HTTP 409 con { detail: "Versión desactualizada. Version actual es 2" }
```

```gherkin
CRITERIO-3.3: Actualizar datos inválidos
  Dado que:    existe folio "F12345"
  Cuando:      invoca PUT /v1/quotes/F12345/general-info con { datosConduccion.codigoAgente: "" }
  Entonces:    recibe HTTP 400 con { detail: "Validación fallida: codigoAgente no puede ser vacío" }
```

**Edge Case**
```gherkin
CRITERIO-3.4: Actualización parcial
  Dado que:    existe folio "F12345" con datos generales completos
  Cuando:      actualiza solo datosAsegurado.nombre (otros campos omitidos)
  Entonces:    recibe HTTP 200 con solo ese campo actualizado, resto sin cambios
```

#### HU-04: Consultar opciones de cobertura

```
Como:        Usuario del sistema de cotización
Quiero:      Ver las opciones de cobertura disponibles para una cotización
Para:        Seleccionar qué coberturas aplicar en la cotización

Prioridad:   Media
Estimación:  XS
Dependencias: HU-01
Capa:        Backend
```

#### Criterios de Aceptación — HU-04

**Happy Path**
```gherkin
CRITERIO-4.1: Obtener opciones de cobertura
  Dado que:    existe folio "F12345"
  Cuando:      invoca GET /v1/quotes/F12345/coverage-options
  Entonces:    recibe HTTP 200 con { opcionesCobertura: [ { nombre, descripcion, activa } ] }
```

#### HU-05: Actualizar opciones de cobertura

```
Como:        Usuario del sistema de cotización
Quiero:      Seleccionar/deseleccionar coberturas para la cotización
Para:        Personalizar las coberturas que aplican al riesgo

Prioridad:   Media
Estimación:  S
Dependencias: HU-01, HU-04
Capa:        Backend
```

#### Criterios de Aceptación — HU-05

**Happy Path**
```gherkin
CRITERIO-5.1: Activar coberturas
  Dado que:    existe folio "F12345" con coberturas iniciales
  Cuando:      invoca PUT /v1/quotes/F12345/coverage-options con { opcionesCobertura: [ { nombre: "CATFHM", activa: true }, ... ] } y version: 1
  Entonces:    recibe HTTP 200 con versión incrementada y coberturas activadas
```

#### HU-06: Consultar estado de la cotización

```
Como:        Usuario del sistema de cotización
Quiero:      Ver el estado actual de la cotización (progreso, alertas, ubicaciones incompletas)
Para:        Conocer qué falta completar para calcular la prima

Prioridad:   Alta
Estimación:  S
Dependencias: HU-01
Capa:        Backend
```

#### Criterios de Aceptación — HU-06

**Happy Path**
```gherkin
CRITERIO-6.1: Obtener estado de cotización
  Dado que:    existe folio "F12345" con múltiples ubicaciones (2 completas, 1 incompleta)
  Cuando:      invoca GET /v1/quotes/F12345/state
  Entonces:    recibe HTTP 200 con { estadoCotizacion, datosGeneralesCompleto: true, ubicacionesCompletas: 2, ubicacionesIncompletas: 1, alertas: [...], calculoRealizado: false }
```

### Reglas de Negocio

1. **Idempotencia en creación:** Las creaciones de folios se identifican por `Idempotency-Key` en headers. Misma key retorna el mismo folio, no duplica.

2. **Versionado optimista:** Cada actualización incrementa `version` en 1. PUT requiere pasar `version` actual; si no coincide, retorna 409 Conflict.

3. **Actualización parcial:** PUT permite actualizar solo algunos campos; campos omitidos mantienen su valor previo.

4. **Timestamps automáticos:** `fechaCreacion` y `fechaUltimaActualizacion` se generan en backend con `datetime.utcnow()`, nunca en cliente.

5. **Estado de cotización:** El estado es `CREADA` al inicio, evoluciona a `COTIZADA` tras cálculo exitoso, nunca regresa a estados anteriores.

6. **Validación de datos generales:** 
   - `datosAsegurado.nombre` es obligatorio, máx 200 chars
   - `datosConduccion.codigoAgente` debe existir en catálogo de agentes (validado contra referencia)
   - `tipoNegocio` debe ser válido según catálogo
   - `clasificacionRiesgo` es derivada, no editable directamente

7. **Cascada de cambios:** Actualizar datos generales NO invalida ubicaciones ni cálculo previo (persistencia independiente por sección).

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas

| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `Cotizacion` | `cotizaciones_danos` | nueva | Documento raíz de la cotización |
| `DatosAsegurado` | incluido en `Cotizacion` | nueva | Datos personales del asegurado |
| `DatosConduccion` | incluido en `Cotizacion` | nueva | Datos de conducción/agente |
| `OpcionesCobertura` | incluido en `Cotizacion` | nueva | Array de coberturas seleccionables |

#### Documento Cotización (MongoDB)

```json
{
  "_id": ObjectId,
  "numeroFolio": "F202604170001",
  "estadoCotizacion": "CREADA",
  "datosAsegurado": {
    "nombre": "Juan Pérez López",
    "apellidos": "Pérez López",
    "tipoPersona": "FISICA",
    "numeroIdentificacion": "12345678",
    "tipoIdentificacion": "RFC",
    "email": "juan@example.com",
    "telefono": "+525555001234"
  },
  "datosConduccion": {
    "codigoAgente": "AG001",
    "nombreAgente": "Agente Premium S.A.",
    "correoAgente": "agent@example.com"
  },
  "tipoNegocio": "COMERCIAL",
  "clasificacionRiesgo": "MEDIO",
  "configuracionLayout": {
    "cantidadUbicaciones": 0,
    "puedeAgregarMas": true
  },
  "opcionesCobertura": [
    {
      "cobertura": "INCENDIO_EDIFICIOS",
      "nombre": "Incendio Edificios",
      "descripcion": "Cobertura de incendio en estructura del edificio",
      "activa": true,
      "obligatoria": true
    },
    {
      "cobertura": "CATFHM",
      "nombre": "CAT Fenómeno Hidrometeorológico",
      "descripcion": "Cobertura de CAT por fenómenos hidrometeorológicos",
      "activa": false,
      "obligatoria": false
    }
  ],
  "version": 1,
  "fechaCreacion": "2026-04-17T10:30:00Z",
  "fechaUltimaActualizacion": "2026-04-17T10:30:00Z",
  "metadatos": {
    "idempotencyKey": "idem-uuid-12345",
    "usuarioCreacion": "user-uid-firebase",
    "ultimoUsuarioActualizacion": "user-uid-firebase",
    "navegadorCreacion": "Mozilla/5.0..."
  }
}
```

#### Campos del modelo - Cotización

| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `numeroFolio` | string | sí | formato `F\d{12}`, único | ID único de la cotización |
| `estadoCotizacion` | enum | sí | `CREADA\|COTIZADA\|CANCELADA` | Estado actual del flujo |
| `datosAsegurado.nombre` | string | sí | máx 200 chars, no vacío | Nombre del asegurado |
| `datosAsegurado.tipoIdentificacion` | enum | sí | `RFC\|CURP\|PASAPORTE` | Tipo de ID del asegurado |
| `datosAsegurado.numeroIdentificacion` | string | sí | único, no vacío | Identificación del asegurado |
| `datosConduccion.codigoAgente` | string | sí | validar contra catálogo | Código único del agente |
| `tipoNegocio` | enum | sí | válido en catálogo | Tipo de negocio: COMERCIAL, RESIDENCIAL, etc. |
| `clasificacionRiesgo` | enum | no | derivada de análisis | BAJO, MEDIO, ALTO (calculada, no editable) |
| `configuracionLayout.cantidadUbicaciones` | integer | sí | >= 0 | Número de ubicaciones capturadas |
| `opcionesCobertura[]` | array | sí | min 1 | Array de coberturas disponibles/seleccionadas |
| `opcionesCobertura[].activa` | boolean | sí | true \| false | Si la cobertura está seleccionada |
| `version` | integer | sí | >= 1, incrementa | Versionado optimista |
| `fechaCreacion` | datetime (UTC) | sí | auto-generado | Timestamp creación |
| `fechaUltimaActualizacion` | datetime (UTC) | sí | auto-generado | Timestamp última edición |
| `metadatos.idempotencyKey` | string | no | uuid, opcional | Clave para idempotencia en creación |

#### Índices / Constraints

- **PK: numeroFolio** — búsqueda rápida por folio (índice único)
- **Index: datosAsegurado.numeroIdentificacion** — búsqueda por ID cliente
- **Index: datosConduccion.codigoAgente** — análisis por agente
- **Index: fechaCreacion** — auditoría y reporte por fecha
- **Index: version + numeroFolio** — validar versionado optimista

### API Endpoints

#### POST /v1/folios

- **Descripción:** Crea un nuevo folio de cotización
- **Auth requerida:** no (público, pero recomendable validar)
- **Headers especiales:** `Idempotency-Key: <uuid>` (recomendado para idempotencia)
- **Request Body:**
  ```json
  {
    "datosAsegurado": {
      "nombre": "Juan Pérez",
      "tipoIdentificacion": "RFC",
      "numeroIdentificacion": "JPL820415HGTXYZ09",
      "email": "juan@example.com",
      "telefono": "+525555001234"
    },
    "datosConduccion": {
      "codigoAgente": "AG001"
    },
    "tipoNegocio": "COMERCIAL"
  }
  ```
- **Response 201 — Éxito:**
  ```json
  {
    "numeroFolio": "F202604170001",
    "estadoCotizacion": "CREADA",
    "version": 1,
    "fechaCreacion": "2026-04-17T10:30:00Z",
    "datosAsegurado": { ... },
    "datosConduccion": { ... }
  }
  ```
- **Response 400 — Validación:**
  ```json
  {
    "detail": "Request body inválido: datosAsegurado.nombre es obligatorio"
  }
  ```
- **Response 409 — Conflicto (idempotencia):**
  ```json
  {
    "detail": "Folio ya existe con Idempotency-Key: <uuid>"
  }
  ```

#### GET /v1/quotes/{folio}/general-info

- **Descripción:** Obtiene datos generales de una cotización
- **Auth requerida:** no (pero rastreable si es necesario)
- **Response 200:**
  ```json
  {
    "numeroFolio": "F202604170001",
    "datosAsegurado": { ... },
    "datosConduccion": { ... },
    "tipoNegocio": "COMERCIAL",
    "clasificacionRiesgo": "MEDIO",
    "version": 1,
    "fechaUltimaActualizacion": "2026-04-17T10:30:00Z"
  }
  ```
- **Response 404:**
  ```json
  {
    "detail": "Folio F202604170001 no encontrado"
  }
  ```

#### PUT /v1/quotes/{folio}/general-info

- **Descripción:** Actualiza datos generales (parcialmente o completos)
- **Auth requerida:** no
- **Request Body:**
  ```json
  {
    "version": 1,
    "datosAsegurado": {
      "nombre": "Juan Nuevo"
    },
    "datosConduccion": {
      "codigoAgente": "AG002"
    }
  }
  ```
- **Response 200 — Éxito:**
  ```json
  {
    "numeroFolio": "F202604170001",
    "datosAsegurado": { ... },
    "datosConduccion": { ... },
    "version": 2,
    "fechaUltimaActualizacion": "2026-04-17T10:35:00Z"
  }
  ```
- **Response 409 — Versionado:**
  ```json
  {
    "detail": "Versión desactualizada. Version actual es 2, esperada 1"
  }
  ```
- **Response 400 — Validación:**
  ```json
  {
    "detail": "Validación fallida: datosConduccion.codigoAgente no válido"
  }
  ```
- **Response 404:**
  ```json
  {
    "detail": "Folio no encontrado"
  }
  ```

#### GET /v1/quotes/{folio}/coverage-options

- **Descripción:** Obtiene opciones de cobertura disponibles
- **Auth requerida:** no
- **Response 200:**
  ```json
  {
    "numeroFolio": "F202604170001",
    "opcionesCobertura": [
      {
        "cobertura": "INCENDIO_EDIFICIOS",
        "nombre": "Incendio Edificios",
        "descripcion": "Cobertura de incendio en estructura",
        "activa": true,
        "obligatoria": true
      },
      {
        "cobertura": "CATFHM",
        "nombre": "CAT Fenómeno Hidrometeorológico",
        "activa": false,
        "obligatoria": false
      }
    ],
    "version": 1
  }
  ```
- **Response 404:**
  ```json
  {
    "detail": "Folio no encontrado"
  }
  ```

#### PUT /v1/quotes/{folio}/coverage-options

- **Descripción:** Actualiza opciones de cobertura seleccionadas
- **Auth requerida:** no
- **Request Body:**
  ```json
  {
    "version": 1,
    "opcionesCobertura": [
      {
        "cobertura": "INCENDIO_EDIFICIOS",
        "activa": true
      },
      {
        "cobertura": "CATFHM",
        "activa": true
      }
    ]
  }
  ```
- **Response 200:**
  ```json
  {
    "numeroFolio": "F202604170001",
    "opcionesCobertura": [ ... ],
    "version": 2,
    "fechaUltimaActualizacion": "2026-04-17T10:40:00Z"
  }
  ```
- **Response 409:**
  ```json
  {
    "detail": "Versión desactualizada. Version actual es 2, esperada 1"
  }
  ```

#### GET /v1/quotes/{folio}/state

- **Descripción:** Obtiene el estado actual de la cotización (progreso, alertas, completitud)
- **Auth requerida:** no
- **Response 200:**
  ```json
  {
    "numeroFolio": "F202604170001",
    "estadoCotizacion": "CREADA",
    "estadosSeccion": {
      "datosGeneralesCompleto": true,
      "ubicacionesCapturadas": 2,
      "ubicacionesCompletas": 1,
      "ubicacionesIncompletas": 1,
      "coberturasDefinidas": true,
      "calculoRealizado": false
    },
    "alertas": [
      {
        "tipo": "INCOMPLETO",
        "ubicacionIndice": 1,
        "mensaje": "Ubicación 2 incompleta: falta código postal"
      }
    ],
    "version": 1,
    "fechaUltimaActualizacion": "2026-04-17T10:30:00Z"
  }
  ```

### Arquitectura y Dependencias

#### Capas de Backend

```
routes/folios_router.py
  ↓
services/folios_service.py
  ↓
repositories/folios_repository.py
  ↓
MongoDB (cotizaciones_danos)
```

#### Servicios y Repositorio

**`models/folios_model.py`** — Schemas Pydantic:
- `CotizacionCreate` — datos para creación de folio
- `CotizacionUpdate` — datos para actualización (con `version`)
- `CotizacionResponse` — respuesta de API
- `CotizacionDocument` — documento interno de MongoDB

**`repositories/folios_repository.py`** — acceso a datos:
- `async def create(doc: dict) -> dict` — insert en MongoDB
- `async def find_by_folio(folio: str) -> dict` — buscar por numeroFolio
- `async def update_general_info(folio: str, data: dict, current_version: int) -> dict` — actualización con versionado
- `async def find_by_idempotency_key(key: str) -> dict` — verificar idempotencia
- `async def increment_version(folio: str)` — helper para versionado

**`services/folios_service.py`** — lógica de negocio:
- `async def create_folio(create_dto: CotizacionCreate) -> CotizacionResponse` — crear con idempotencia
- `async def get_general_info(folio: str) -> CotizacionResponse`
- `async def update_general_info(folio: str, update_dto: CotizacionUpdate) -> CotizacionResponse` — validar versión y datos
- `async def get_coverage_options(folio: str) -> dict`
- `async def update_coverage_options(folio: str, options: dict, version: int) -> dict`
- `async def get_state(folio: str) -> dict` — calcular estado actual

**`routes/folios_router.py`** — HTTP endpoints:
- Registrar todos los endpoints arriba listados
- Parsear headers y body
- Delegar al service

#### Dependencias

- **Servicios externos:** Validación contra catálogos de agentes, tipos de negocio (se aceptan stubs/mocks)
- **Motor async:** AsyncIOMotorClient para MongoDB
- **Pydantic v2:** Validación de schemas
- **FastAPI:** Framework HTTP

#### Paquetes nuevos

Ninguno adicional — usar stack existente.

### Notas de Implementación

1. **Generación de numeroFolio:** Patrón `F<YYYYMMDD><SECUENCIAL_5_DÍGITOS>` (ej. F202604170001)

2. **Idempotencia:** Guardar `Idempotency-Key` en `metadatos.idempotencyKey`. Si llega la misma key, devolver folio existente, no crear duplicado.

3. **Versionado optimista:** La lógica es:
   - Cliente pasa `version` en PUT
   - Backend valida: `doc.version == request.version`
   - Si no coincide, retorna 409
   - Al actualizar, incrementa version y actualiza `fechaUltimaActualizacion`

4. **Validación de agente y tipo de negocio:** Consumir stub/servicio de referencia. Si no existe, retornar 400 con detalle.

5. **Timestamps UTC:** Siempre usar `datetime.utcnow()` en backend, nunca confiar en timestamps del cliente.

6. **Estado de cotización:** Es calculado, no editado. Cuando se crea, es "CREADA". Cuando se calcula prima exitosamente, pasa a "COTIZADA".

7. **Actualización parcial:** Si cliente envía solo `{ version: 1, datosAsegurado: { nombre: "..." } }`, actualizar solo ese campo; no sobrescribir todo.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.

### Backend

#### Implementación

- [ ] Crear `models/folios_model.py` con schemas: `CotizacionCreate`, `CotizacionUpdate`, `CotizacionResponse`, `CotizacionDocument`
- [ ] Crear `repositories/folios_repository.py` con métodos: `create`, `find_by_folio`, `update_general_info`, `find_by_idempotency_key`, `increment_version`
- [ ] Crear `services/folios_service.py` con lógica de: creación con idempotencia, validación de versión, actualización parcial
- [ ] Crear `routes/folios_router.py` con endpoints: POST /v1/folios, GET/PUT /v1/quotes/{folio}/general-info, GET/PUT /v1/quotes/{folio}/coverage-options, GET /v1/quotes/{folio}/state
- [ ] Registrar router en punto de entrada de la app (main.py o __init__.py)
- [ ] Crear stub/fixture para catálogo de agentes (si no existe servicio externo)
- [ ] Crear stub/fixture para tipos de negocio
- [ ] Implementar generador de numeroFolio (F<YYYYMMDD><SECUENCIAL>)
- [ ] Implementar versionado optimista en servicio

#### Tests Backend

- [ ] `test_folios_service_create_success` — crear folio nuevo, retorna 201
- [ ] `test_folios_service_create_idempotent` — misma Idempotency-Key retorna mismo folio
- [ ] `test_folios_service_create_invalid_request` — body inválido retorna 400
- [ ] `test_folios_service_get_general_info_success` — obtener datos generales existentes
- [ ] `test_folios_service_get_general_info_not_found` — folio inexistente retorna 404
- [ ] `test_folios_service_update_general_info_success` — actualizar con versión correcta
- [ ] `test_folios_service_update_general_info_conflict` — versión desactualizada retorna 409
- [ ] `test_folios_service_update_partial` — actualizar solo algunos campos
- [ ] `test_folios_service_update_invalid_agent` — agente inválido retorna 400
- [ ] `test_folios_service_coverage_options_get` — obtener opciones de cobertura
- [ ] `test_folios_service_coverage_options_update` — actualizar coberturas con versión
- [ ] `test_folios_service_state_multiple_locations` — estado con ubicaciones completas e incompletas
- [ ] `test_folios_repo_idempotency_key_uniqueness` — idempotency key es único
- [ ] `test_folios_router_post_201` — endpoint POST retorna 201
- [ ] `test_folios_router_get_200` — endpoint GET retorna 200
- [ ] `test_folios_router_put_409` — endpoint PUT con versión desactualizada retorna 409

### Frontend

- [ ] (Dependencia: spec-cotizador-frontend-main.spec.md)
- [ ] En página crear folio, capturar datosAsegurado y datosConduccion
- [ ] En página editar general-info, mostrar datos y permitir actualización con versión

### QA

- [ ] Ejecutar skill `/gherkin-case-generator` con criterios CRITERIO-1.1 a 6.1
- [ ] Ejecutar skill `/risk-identifier` — clasificar riesgos técnicos
- [ ] Revisar cobertura de tests contra criterios de aceptación
- [ ] Validar validaciones y errores en todos los endpoints
- [ ] Prueba manual: crear folio, actualizar datos, actualizar coberturas, ver estado
- [ ] Actualizar estado spec: `status: IN_PROGRESS` al iniciar desarrollo

---

## Supuestos Confirmados ✅

1. **Autenticación:** NO obligatoria en endpoints. Fase 1 = endpoints públicos sin validación de token Firebase.

2. **Catálogos de referencia:** NO existen servicios reales. Usar fixtures versionados (stubs/mocks) con contrato documentado en código.

3. **Números de folio:** SECUENCIAL por fecha: `F<YYYYMMDD><5 dígitos>` (ej. F20260417-00001).

4. **Versionado optimista:** Basado en campo `version` simple (integer). Sin timestamps de versión.

5. **Histórico de cambios:** NO implementado en fase 1. Solo timestamps de creación/actualización + metadatos básicos.

6. **Límites de solicitud:** Sin rate-limit. Puede agregarse en fase 2 si se requiere.

7. **Precisión numérica:** En esta spec no aplica (es backend de gestión, no cálculo). Ver SPEC-003 para primas.

---

