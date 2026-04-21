---
id: SPEC-005
status: IN_PROGRESS
feature: cotizador-database
description: Modelo de datos MongoDB - esquemas, colecciones, índices y constraints
created: 2026-04-17
updated: 2026-04-17
author: spec-generator
version: "1.0"
related-specs: ["SPEC-001", "SPEC-002", "SPEC-003"]
---

# Spec: Database - Modelo de Datos MongoDB

> **Estado:** `APPROVED` ✅ Listo para implementación.

---

## 1. REQUERIMIENTOS

### Descripción

Este módulo define el esquema y estructura de datos MongoDB para el cotizador de daños. Comprende 8 colecciones principales: cotizaciones_danos, parametros_calculo, tarifas_incendio, tarifas_cat, tarifas_fhm, catalogo_cp_zonas, dim_zona_tev, dim_zona_fhm. Incluye definición de documentos, campos, índices, constraints y estrategia de versionado y auditoría.

### Requerimiento de Negocio

El sistema debe persistir datos de cotizaciones, parámetros de tarificación y catálogos de referencia de forma eficiente, con índices que permitan búsquedas rápidas, validación de datos mediante esquemas y auditoria de cambios. Los datos deben estar organizados por contexto (cotizaciones, tarifas, catálogos) y permitir evolución del modelo sin migración destructiva.

### Criterios de Aceptación

```gherkin
CRITERIO-DB-1: Crear cotización con todos los campos requeridos
  Dado que:    MongoDB está disponible
  Cuando:      inserto documento cotizacion_dano válido
  Entonces:    se persiste con _id, índices se aplican, validación pass

CRITERIO-DB-2: Buscar cotización por numeroFolio
  Dado que:    existe cotización con numeroFolio "F202604170001"
  Cuando:      query find({ numeroFolio: "F202604170001" })
  Entonces:    retorna documento en < 10ms (con índice)

CRITERIO-DB-3: Actualizar cotización con versionado
  Dado que:    cotización tiene version: 1
  Cuando:      updateOne con filtro { version: 1 }
  Entonces:    se actualiza si version coincide, failOnError si no

CRITERIO-DB-4: Obtener tarifas por giro
  Dado que:    existen tarifas para claveGiro "6311"
  Cuando:      query find({ claveGiro: "6311" })
  Entonces:    retorna array de tarifas

CRITERIO-DB-5: Validar código postal contra catálogo
  Dado que:    existe CP "28001" en catalogo_cp_zonas
  Cuando:      query find({ codigo_postal: "28001" })
  Entonces:    retorna zona, estado, es_zona_cat, etc.
```

---

## 2. DISEÑO

### Colecciones y Documentos

#### 1. Colección: `cotizaciones_danos`

**Descripción:** Documentos raíz de cotizaciones de daños. Agregado principal que contiene datos generales, ubicaciones, coberturas y resultados financieros.

**Documento de ejemplo:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "numeroFolio": "F202604170001",
  "estadoCotizacion": "COTIZADA",
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
    "cantidadUbicaciones": 2,
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
  "ubicaciones": [
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
          "prima": 2500,
          "tasa": 0.005
        },
        {
          "codigoGarantia": "INCENDIO_CONTENIDOS",
          "nombre": "Incendio - Contenidos",
          "sumaAsegurada": 250000,
          "prima": 2500,
          "tasa": 0.01
        }
      ],
      "zonaCatastrofica": false,
      "estadoValidacion": "COMPLETA",
      "alertasBloqueantes": [],
      "fechaCreacion": "2026-04-17T10:45:00Z",
      "fechaActualizacion": "2026-04-17T10:45:00Z"
    },
    {
      "indice": 1,
      "nombreUbicacion": "Bodega",
      "direccion": "Calle Secundaria 456",
      "codigoPostal": "28004",
      "estado": "MADRID",
      "municipio": "Madrid",
      "colonia": null,
      "ciudad": "Madrid",
      "tipoConstructivo": "ACERO",
      "nivel": 2,
      "anioConstruccion": 2015,
      "giro": {
        "claveGiro": null,
        "claveIncendio": null,
        "descripcion": null
      },
      "garantias": [],
      "zonaCatastrofica": false,
      "estadoValidacion": "INCOMPLETA",
      "alertasBloqueantes": [
        {
          "tipo": "FALTA_GIRO",
          "mensaje": "Requiere giro con claveIncendio para cálculo"
        }
      ],
      "fechaCreacion": "2026-04-17T10:50:00Z",
      "fechaActualizacion": "2026-04-17T10:50:00Z"
    }
  ],
  "primaNeta": 5000,
  "primaComercial": 6750,
  "primasPorUbicacion": [
    {
      "ubicacionIndice": 0,
      "nombreUbicacion": "Casa Principal",
      "primasComponentes": [
        {
          "cobertura": "INCENDIO_EDIFICIOS",
          "nombre": "Incendio - Edificio",
          "sumaAsegurada": 500000,
          "tasa": 0.005,
          "factorZona": 1.0,
          "factorConstruccion": 1.0,
          "factorGiro": 1.0,
          "recargoCat": 0.0,
          "primaUnitaria": 2500,
          "primaCalculada": 2500
        }
      ],
      "primaNeta_Ubicacion": 5000,
      "primaComercial_Ubicacion": 6750,
      "alertas": [],
      "fechaCalculo": "2026-04-17T11:00:00Z"
    }
  ],
  "version": 4,
  "fechaCreacion": "2026-04-17T10:30:00Z",
  "fechaUltimaActualizacion": "2026-04-17T11:00:00Z",
  "metadatos": {
    "idempotencyKey": "idem-uuid-12345",
    "usuarioCreacion": "user-uid-firebase",
    "ultimoUsuarioActualizacion": "user-uid-firebase",
    "navegadorCreacion": "Mozilla/5.0...",
    "parametrosCalculoUtilizados": {
      "margenComercial": 0.35,
      "versionTarifas": "2026-01-01"
    }
  }
}
```

**Campos principales:**

| Campo | Tipo | Requerido | Validación | Índice | Descripción |
|-------|------|-----------|-----------|--------|-------------|
| `_id` | ObjectId | sí | auto | sí (PK) | Identificador único MongoDB |
| `numeroFolio` | string | sí | único, formato `F\d{12}` | sí (UNIQUE) | Identificador de folio |
| `estadoCotizacion` | enum | sí | CREADA\|COTIZADA\|CANCELADA | sí | Estado del flujo |
| `datosAsegurado` | object | sí | requerido | no | Datos personales |
| `datosConduccion` | object | sí | requerido | no | Datos de agente |
| `tipoNegocio` | string | sí | válido en catálogo | sí | Tipo de negocio |
| `clasificacionRiesgo` | enum | no | derivada | no | Clasificación de riesgo |
| `configuracionLayout` | object | sí | cantidadUbicaciones >= 1 | no | Layout de ubicaciones |
| `opcionesCobertura` | array | sí | mín 1 | no | Coberturas disponibles |
| `ubicaciones` | array | sí | puede estar vacío inicialmente | no | Array de ubicaciones |
| `primaNeta` | number | no | >= 0 | no | Prima neta total |
| `primaComercial` | number | no | >= 0 | no | Prima comercial total |
| `primasPorUbicacion` | array | no | después de cálculo | no | Desglose por ubicación |
| `version` | integer | sí | >= 1, incrementa | sí | Versionado optimista |
| `fechaCreacion` | datetime | sí | auto UTC | sí | Timestamp creación |
| `fechaUltimaActualizacion` | datetime | sí | auto UTC | sí | Timestamp última edición |
| `metadatos` | object | no | auditoría | no | Metadatos internos |

**Índices:**

```javascript
db.cotizaciones_danos.createIndex({ numeroFolio: 1 }, { unique: true });
db.cotizaciones_danos.createIndex({ estadoCotizacion: 1 });
db.cotizaciones_danos.createIndex({ tipoNegocio: 1 });
db.cotizaciones_danos.createIndex({ fechaCreacion: 1 });
db.cotizaciones_danos.createIndex({ version: 1, numeroFolio: 1 });
db.cotizaciones_danos.createIndex({ "metadatos.idempotencyKey": 1 });
```

---

#### 2. Colección: `parametros_calculo`

**Descripción:** Parámetros globales para cálculo de primas (márgenes, factores, recargos).

**Documento de ejemplo:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "codigoParametro": "PARAMS_DEFAULT_2026",
  "version": "1.0",
  "descripcion": "Parámetros de cálculo para cotizador de daños 2026",
  "margenComercial": 0.35,
  "recargoPrimera": 0.15,
  "desvaloracionAntiguedad": [
    { "anioConstruccion_Min": 0, "anioConstruccion_Max": 1950, "factor": 1.5 },
    { "anioConstruccion_Min": 1951, "anioConstruccion_Max": 1980, "factor": 1.2 },
    { "anioConstruccion_Min": 1981, "anioConstruccion_Max": 2010, "factor": 1.0 },
    { "anioConstruccion_Min": 2011, "anioConstruccion_Max": 9999, "factor": 0.9 }
  ],
  "factoresConstruccion": {
    "LADRILLO_CONCRETO": 1.0,
    "ACERO": 0.8,
    "MADERA": 1.5,
    "HORMIGON_ARMADO": 0.7
  },
  "factoresZonaCat": {
    "APLICABLE": 1.5,
    "NO_APLICABLE": 1.0
  },
  "recargosCAT": {
    "CATFHM": 0.25,
    "CATTEV": 0.15
  },
  "fechaCreacion": "2026-01-01T00:00:00Z",
  "activo": true
}
```

**Índices:**

```javascript
db.parametros_calculo.createIndex({ codigoParametro: 1 }, { unique: true });
db.parametros_calculo.createIndex({ activo: 1 });
db.parametros_calculo.createIndex({ version: 1 });
```

---

#### 3. Colección: `tarifas_incendio`

**Descripción:** Tarifas de incendio por giro de negocio y clave de incendio.

**Documento de ejemplo:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "claveGiro": "6311",
  "claveIncendio": "1000",
  "descripcionGiro": "Oficinas administrativas",
  "garantia": "INCENDIO_EDIFICIOS",
  "tasa": 0.005,
  "tasaContenidos": 0.01,
  "factorRiesgo": 1.0,
  "minSumaAsegurada": 50000,
  "maxSumaAsegurada": 50000000,
  "fecha_Vigencia": "2026-01-01",
  "vigente": true
}
```

**Índices:**

```javascript
db.tarifas_incendio.createIndex({ claveGiro: 1, claveIncendio: 1 });
db.tarifas_incendio.createIndex({ garantia: 1 });
db.tarifas_incendio.createIndex({ vigente: 1 });
```

---

#### 4. Colección: `tarifas_cat`

**Descripción:** Tarifas para coberturas CAT (CATFHM, CATTEV).

**Documento de ejemplo:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439014"),
  "claveGiro": "6311",
  "claveIncendio": "1000",
  "coberturaCat": "CATFHM",
  "tasaCat": 0.025,
  "recargo": 0.25,
  "descripcion": "CAT por Fenómeno Hidrometeorológico",
  "zona": ["VERACRUZ", "TAMAULIPAS", "YUCATAN"],
  "vigente": true
}
```

**Índices:**

```javascript
db.tarifas_cat.createIndex({ claveGiro: 1, coberturaCat: 1 });
db.tarifas_cat.createIndex({ vigente: 1 });
```

---

#### 5. Colección: `catalogo_cp_zonas`

**Descripción:** Catálogo de códigos postales y zonas catastróficas.

**Documento de ejemplo:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439015"),
  "codigo_postal": "28001",
  "estado": "MADRID",
  "municipio": "Madrid",
  "colonia": "Centro",
  "ciudad": "Madrid",
  "es_zona_cat": false,
  "zona_tev": "NO_APLICABLE",
  "zona_fhm": "NORMAL",
  "factor_riesgo": 1.0,
  "descripcion": "Zona urbana central"
}
```

**Índices:**

```javascript
db.catalogo_cp_zonas.createIndex({ codigo_postal: 1 }, { unique: true });
db.catalogo_cp_zonas.createIndex({ estado: 1 });
db.catalogo_cp_zonas.createIndex({ es_zona_cat: 1 });
db.catalogo_cp_zonas.createIndex({ municipio: 1 });
```

---

#### 6. Colección: `catalogo_giros`

**Descripción:** Catálogo de giros de negocio.

**Documento de ejemplo:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439016"),
  "claveGiro": "6311",
  "claveIncendio": "1000",
  "descripcion": "Oficinas administrativas",
  "sector": "Servicios",
  "riesgo": "BAJO",
  "requiereClaveIncendio": true,
  "activo": true
}
```

**Índices:**

```javascript
db.catalogo_giros.createIndex({ claveGiro: 1 }, { unique: true });
db.catalogo_giros.createIndex({ claveIncendio: 1 });
db.catalogo_giros.createIndex({ activo: 1 });
```

---

#### 7. Colección: `catalogo_garantias`

**Descripción:** Catálogo de garantías disponibles.

**Documento de ejemplo:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439017"),
  "codigoGarantia": "INCENDIO_EDIFICIOS",
  "nombre": "Incendio - Edificio",
  "descripcion": "Cobertura de incendio en la estructura del edificio",
  "grupo": "INCENDIO",
  "obligatoria": true,
  "tarifable": true,
  "activa": true,
  "sumaMinimaAsegurada": 50000,
  "sumaMaximaAsegurada": 50000000
}
```

**Índices:**

```javascript
db.catalogo_garantias.createIndex({ codigoGarantia: 1 }, { unique: true });
db.catalogo_garantias.createIndex({ grupo: 1 });
db.catalogo_garantias.createIndex({ activa: 1 });
```

---

#### 8. Colecciones de Referencia: `dim_zona_tev`, `dim_zona_fhm`

**Descripción:** Dimensiones de zonas catastróficas para TEV y FHM (usadas en reportes y análisis).

**Documento `dim_zona_tev`:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439018"),
  "zona": "COSTA_PACIFICO",
  "descripcion": "Zonas de terremoto - Océano Pacífico",
  "es_zona_tev": true,
  "estados": ["JALISCO", "COLIMA", "MICHOACAN"],
  "factor_aplicable": 1.5
}
```

**Documento `dim_zona_fhm`:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439019"),
  "zona": "CICLONES_ATLANTICO",
  "descripcion": "Zonas de ciclones - Océano Atlántico",
  "es_zona_fhm": true,
  "estados": ["VERACRUZ", "TAMAULIPAS", "QUINTANA_ROO"],
  "factor_aplicable": 1.25
}
```

---

### Estrategia de Versionado y Auditoría

#### Versionado Optimista

- Campo `version` en `cotizaciones_danos` se incrementa con cada actualización
- Update condicional: `{ numeroFolio, version: current } → { ...updates, version: current+1 }`
- Retorna error 409 si versión no coincide

#### Auditoría

- Campo `metadatos.usuarioCreacion` y `metadatos.ultimoUsuarioActualizacion`
- Timestamps: `fechaCreacion` (inmutable), `fechaUltimaActualizacion` (se actualiza)
- Idempotencia: `metadatos.idempotencyKey` para operaciones de creación

#### Historial Completo (Opcional - Fase 2)

Crear colección `cotizaciones_danos_history` con snapshots de cambios:

```json
{
  "_id": ObjectId,
  "numeroFolio": "F202604170001",
  "version": 1,
  "cambios": { "datosAsegurado.nombre": ["Viejo", "Nuevo"] },
  "usuarioQuieChange": "user-uid",
  "fechaChange": "2026-04-17T10:35:00Z"
}
```

---

### Constraints y Validaciones de Schema (Nivel BD)

```javascript
// MongoDB Schema Validation (Pydantic valida en aplicación)
db.createCollection("cotizaciones_danos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["numeroFolio", "estadoCotizacion", "datosAsegurado", "version", "fechaCreacion"],
      properties: {
        _id: { bsonType: "objectId" },
        numeroFolio: {
          bsonType: "string",
          pattern: "^F[0-9]{12}$",
          description: "Formato F + 12 dígitos"
        },
        estadoCotizacion: {
          enum: ["CREADA", "COTIZADA", "CANCELADA"],
          description: "Estado válido"
        },
        version: {
          bsonType: "int",
          minimum: 1,
          description: "Versionado optimista"
        },
        fechaCreacion: {
          bsonType: "date",
          description: "Timestamp UTC"
        },
        fechaUltimaActualizacion: {
          bsonType: "date",
          description: "Timestamp UTC"
        }
      }
    }
  }
});
```

---

### Relaciones y Integridad Referencial

**Nota:** MongoDB no tiene FK como las BD relacionales. La integridad se valida en aplicación:

| Campo | Referencia | Validación |
|-------|-----------|-----------|
| `datosConduccion.codigoAgente` | `catalogo_agentes.codigo` | Validar al actualizar en backend |
| `tipoNegocio` | `catalogo_tipo_negocio` | Validar al crear en backend |
| `ubicaciones[].giro.claveGiro` | `catalogo_giros.claveGiro` | Validar al capturar ubicación |
| `ubicaciones[].codigoPostal` | `catalogo_cp_zonas.codigo_postal` | Validar al capturar ubicación |
| `ubicaciones[].garantias[].codigoGarantia` | `catalogo_garantias.codigoGarantia` | Validar al capturar ubicación |
| `opcionesCobertura[].cobertura` | `catalogo_garantias.codigoGarantia` | Validado en front y back |

---

## 3. LISTA DE TAREAS

### Database

#### Creación de Colecciones y Índices

- [ ] Crear colección `cotizaciones_danos` con schema validation
- [ ] Crear índices en `cotizaciones_danos`: numeroFolio (UNIQUE), estadoCotizacion, tipoNegocio, fechaCreacion, version, idempotencyKey
- [ ] Crear colección `parametros_calculo` con índices: codigoParametro (UNIQUE), activo, version
- [ ] Crear colección `tarifas_incendio` con índices: claveGiro + claveIncendio, garantia, vigente
- [ ] Crear colección `tarifas_cat` con índices: claveGiro + coberturaCat, vigente
- [ ] Crear colección `catalogo_cp_zonas` con índices: codigo_postal (UNIQUE), estado, es_zona_cat, municipio
- [ ] Crear colección `catalogo_giros` con índices: claveGiro (UNIQUE), claveIncendio, activo
- [ ] Crear colección `catalogo_garantias` con índices: codigoGarantia (UNIQUE), grupo, activa
- [ ] Crear colecciones de referencia: `dim_zona_tev`, `dim_zona_fhm`

#### Fixtures e Inicialización

- [ ] Crear fixture de `parametros_calculo` v1.0 con márgenes, factores
- [ ] Crear fixture de `tarifas_incendio` (mínimo 5 giros de ejemplo)
- [ ] Crear fixture de `tarifas_cat` (CATFHM, CATTEV con ejemplos)
- [ ] Crear fixture de `catalogo_cp_zonas` (mínimo 10 CPs válidos, algunos en zona CAT)
- [ ] Crear fixture de `catalogo_giros` (mínimo 5 giros con claves de incendio)
- [ ] Crear fixture de `catalogo_garantias` (mínimo 10 garantías)
- [ ] Crear script de seeding: `db/seeds/init_data.py`

#### Scripts de Administración

- [ ] Crear script de validación de índices
- [ ] Crear script de limpieza de datos de prueba
- [ ] Crear script de backup de colecciones (opcional)
- [ ] Crear script de migración de esquema (para fase 2 si requiere)

#### Tests Database

- [ ] `test_cotizacion_insert_success` — insertar documento válido
- [ ] `test_cotizacion_unique_constraint_numeroFolio` — numeroFolio es único
- [ ] `test_cotizacion_index_numeroFolio_exists` — índice existe
- [ ] `test_cotizacion_find_by_folio` — búsqueda rápida por folio
- [ ] `test_cotizacion_update_optimistic_locking` — versionado funciona
- [ ] `test_cotizacion_update_conflict_version` — falla si version no coincide
- [ ] `test_parametros_calculo_load_active` — obtener parámetros activos
- [ ] `test_tarifas_incendio_find_by_giro` — búsqueda de tarifas
- [ ] `test_catalogo_cp_find_valid` — CP válido existe
- [ ] `test_catalogo_cp_not_found` — CP inválido no existe
- [ ] `test_catalogo_giros_find_by_clave` — búsqueda de giro
- [ ] `test_garantias_find_by_codigo` — búsqueda de garantía

### Backend (integración con DB)

- [ ] Crear `conftest.py` con fixture MongoDB de prueba (mock o testcontainer)
- [ ] Implementar Motor client en `app/config/database.py`
- [ ] Implementar repositorios con métodos async Motor
- [ ] Implementar validaciones de integridad referencial en services

### QA

- [ ] Validar que todas las colecciones están creadas
- [ ] Validar que todos los índices están presentes
- [ ] Validar que fixtures están completas
- [ ] Prueba de performance: búsqueda por numeroFolio < 10ms
- [ ] Prueba de concurrencia: múltiples updates con versionado
- [ ] Validar constraints y validaciones de schema

---

## Supuestos

1. **MongoDB versión:** 4.4 o superior (recomendado 6.0+)

## Supuestos Confirmados ✅

1. **Moneda:** Solo MXN. Sin multi-moneda. Campo `moneda` NO se agrega.

2. **Precisión numérica:** float + round(x, 2) aceptable. Sin Decimal en fase 1.

3. **Historial de cambios:** NO implementado en fase 1. Solo timestamps de creación/actualización + versión.

4. **Seguridad:** NO en alcance. Conexión local asumida.

5. **Replicación:** NO requerida. Single node/local development aceptable.

6. **TTL (Time To Live):** NO. Cotizaciones se guardan indefinidamente.

7. **Backups:** NO en alcance. Scripts de manual aceptable.

8. **Sharding:** NO requerido. Single node/replica set suficiente.

9. **Caché:** NO implementado. Catálogos en fixtures/BD local aceptable.

10. **Encriptación:** NO en fase 1. Recomendación para producción: encriptar PII en reposo.

---

## Referencia Rápida de Comandos MongoDB

```javascript
// Conectarse a BD
use cotizador_danos

// Ver todas las colecciones
show collections

// Ver índices de una colección
db.cotizaciones_danos.getIndexes()

// Cargar fixtures
load("/path/to/fixtures/init_data.js")

// Estadísticas de colección
db.cotizaciones_danos.stats()

// Backup de colección
mongoexport --db cotizador_danos --collection cotizaciones_danos --out backup.json

// Restore de colección
mongoimport --db cotizador_danos --collection cotizaciones_danos --file backup.json
```

---

