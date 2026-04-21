# Índice de Especificaciones ASDD - Cotizador de Daños

**Generado:** 2026-04-17  
**Status Global:** DRAFT (5/5 specs listas para revisión)  

---

## Archivos de Especificación

### 1. SPEC-001: Backend API - Gestión de Folios y Cotizaciones

**Archivo:** `cotizador-backend-folios.spec.md`  
**Owner:** backend-developer  
**Dependencias:** Ninguna  
**Prioridad:** ALTA  
**Estimación:** S (Small)

**Contenido:**
- Endpoints: POST /v1/folios, GET/PUT /v1/quotes/{folio}/general-info, GET/PUT /v1/quotes/{folio}/coverage-options, GET /v1/quotes/{folio}/state
- Modelos: CotizacionCreate, CotizacionUpdate, CotizacionResponse, CotizacionDocument
- Servicios: create_folio (con idempotencia), get_general_info, update_general_info, get/update_coverage_options, get_state
- Reglas: versionado optimista, actualización parcial, timestamps UTC automáticos
- 6 historias de usuario, 11 criterios de aceptación

**Acciones clave:**
- [ ] Crear modelos Pydantic
- [ ] Crear repositorio con métodos CRUD
- [ ] Crear servicio con validaciones
- [ ] Crear router con endpoints
- [ ] 16 tests unitarios

---

### 2. SPEC-002: Backend API - Gestión de Ubicaciones

**Archivo:** `cotizador-backend-ubicaciones.spec.md`  
**Owner:** backend-developer  
**Dependencias:** SPEC-001  
**Prioridad:** ALTA  
**Estimación:** M (Medium)

**Contenido:**
- Endpoints: PUT/GET /v1/quotes/{folio}/locations/layout, PUT/GET /v1/quotes/{folio}/locations, PATCH /v1/quotes/{folio}/locations/{índice}, GET /v1/quotes/{folio}/locations/summary
- Modelos: GarantiaInput, GarantiaResponse, UbicacionInput, UbicacionResponse, LayoutUpdate
- Servicios: set_layout, set/get_ubicaciones, update_ubicacion, validate_ubicacion, get_summary
- Validaciones: código postal contra catálogo, giro con claveIncendio, garantías tarifables
- Estados: COMPLETA, INCOMPLETA con alertas
- 5 historias de usuario, 11 criterios de aceptación

**Acciones clave:**
- [ ] Crear modelos Pydantic
- [ ] Crear fixtures de catálogos (CPs, giros, garantías)
- [ ] Implementar validador de código postal
- [ ] Crear servicios de validación
- [ ] 16 tests unitarios

---

### 3. SPEC-003: Backend - Cálculo de Primas

**Archivo:** `cotizador-backend-calculo.spec.md`  
**Owner:** backend-developer  
**Dependencias:** SPEC-001, SPEC-002  
**Prioridad:** ALTA  
**Estimación:** L (Large)

**Contenido:**
- Endpoint: POST /v1/quotes/{folio}/calculate
- Algoritmo de 8 fases: leer cotización → parámetros → validar → resolver datos → calcular → consolidar → derivar comercial → persistir
- Componentes técnicos: Incendio edificios/contenidos, CATTEV, CATFHM, remoción escombros, gastos extraordinarios, pérdida rentas, BI, equipo electrónico, robo, dinero y valores, vidrios, anuncios
- Fórmula: Prima = Suma × Tasa × FactorZona × FactorConstruccion × FactorGiro × (1 + RecargoCat)
- Persistencia sin sobrescribir otras secciones
- 1 historia de usuario, 4 criterios de aceptación

**Acciones clave:**
- [ ] Crear modelos: PrimaComponente, PrimaUbicacion, ResultadoFinanciero
- [ ] Crear fixtures de parámetros y tarifas
- [ ] Implementar las 8 fases del algoritmo
- [ ] Validar redondeo a 2 decimales
- [ ] 16 tests unitarios

---

### 4. SPEC-004: Frontend - Flujo Principal de Cotización

**Archivo:** `cotizador-frontend-main.spec.md`  
**Owner:** frontend-developer  
**Dependencias:** SPEC-001, SPEC-002, SPEC-003  
**Prioridad:** ALTA  
**Estimación:** L (Large)

**Contenido:**
- Rutas: /cotizador, /quotes/{folio}/general-info, /quotes/{folio}/locations, /quotes/{folio}/technical-info, /quotes/{folio}/terms-and-conditions
- Páginas: CotizadorPage, GeneralInfoPage, LocationsPage, TechnicalInfoPage, TermsAndConditionsPage
- Componentes: HeaderNav, ProgressBar, InputField, SelectField, CheckboxField, AlertBox, ConfirmModal, LoadingSpinner, LocationCard, CoverageCheckbox, PriceBreakdown
- Hooks: useCotizacion, useGeneralInfo, useUbicaciones, useCoberturas, useCalculo, useAgentes, useCatalogos
- Services: cotizacionService, generalInfoService, ubicacionesService, coberturasService, calculoService, catalogosService
- Context: CotizacionContext
- 6 historias de usuario, 10 criterios de aceptación

**Acciones clave:**
- [ ] Setup Vite + React 19 + React Router
- [ ] Crear estructura de directorios
- [ ] Implementar 5 páginas + 11 componentes
- [ ] Crear 7 hooks + 6 services
- [ ] Validaciones en cliente (async)
- [ ] Manejo de loading/errores
- [ ] 19 tests de componentes y hooks

---

### 5. SPEC-005: Database - Modelo de Datos MongoDB

**Archivo:** `cotizador-database.spec.md`  
**Owner:** database-agent  
**Dependencias:** Ninguna (paralelo)  
**Prioridad:** ALTA  
**Estimación:** S (Small)

**Contenido:**
- 8 colecciones: cotizaciones_danos, parametros_calculo, tarifas_incendio, tarifas_cat, tarifas_fhm, catalogo_cp_zonas, dim_zona_tev, dim_zona_fhm
- Campos detallados, tipos, validaciones, índices
- Schema validation
- Constraints y relaciones (validadas en aplicación)
- Estrategia de versionado optimista
- Auditoría: timestamps, usuario, idempotencyKey
- 5 criterios de aceptación

**Acciones clave:**
- [ ] Crear colecciones con schema validation
- [ ] Crear índices (45+)
- [ ] Crear fixtures de parámetros y tarifas
- [ ] Crear script de seeding
- [ ] 12 tests de persistencia

---

## Resumen Ejecutivo

**Archivo:** `RESUMEN_EJECUTIVO.md`

Contiene:
- ✅ Lista de specs generadas
- ⚠️ 10 ambigüedades detectadas
- ❓ 10 preguntas pendientes de usuario
- 🔄 Dependencias entre specs
- ⏱️ Orden de implementación recomendado (5 iteraciones)
- 📋 Checklist de entregables
- 📊 Estadísticas de specs

---

## Resumen Rápido

| Spec | Feature | Endpoints | Modelos | Servicios | Hooks | Components |
|------|---------|-----------|---------|-----------|-------|------------|
| SPEC-001 | Folios | 7 | 4 | 1 | - | - |
| SPEC-002 | Ubicaciones | 6 | 4 | 1 | - | - |
| SPEC-003 | Cálculo | 1 | 3 | 1 | - | - |
| SPEC-004 | Frontend | - | - | - | 7 | 11 |
| SPEC-005 | Database | - | 8 colecciones | - | - | - |

**Totales:**
- Endpoints: 13 (backend)
- Modelos/Colecciones: 8 (database)
- Servicios backend: 3
- Servicios frontend: 6
- Hooks: 7
- Componentes: 11
- Historias de usuario: 18
- Criterios de aceptación: 27
- Tests estimados: 67+

---

## Uso de Este Índice

1. **Para entender la arquitectura:** Leer RESUMEN_EJECUTIVO.md
2. **Para revisar una spec:** Abrir archivo correspondiente
3. **Para implementar:** Seguir orden de iteraciones en RESUMEN_EJECUTIVO.md
4. **Para QA:** Usar criterios de aceptación (Gherkin) en cada spec
5. **Para testing:** Ver sección "LISTA DE TAREAS" en cada spec

---

## Cambio de Status de Specs

Para aprobar una spec, cambiar en el frontmatter:

```yaml
# De:
status: DRAFT

# A:
status: APPROVED
updated: 2026-04-17
```

Una vez aprobadas todas las specs, pasar a fase 2 de IMPLEMENTACIÓN.

---

## Convenciones de Nombres de Archivos

```
.github/specs/
├── cotizador-backend-folios.spec.md         ← Backend: folios y cotizaciones
├── cotizador-backend-ubicaciones.spec.md    ← Backend: ubicaciones
├── cotizador-backend-calculo.spec.md        ← Backend: cálculo de primas
├── cotizador-frontend-main.spec.md          ← Frontend: flujo principal
├── cotizador-database.spec.md               ← Database: esquemas MongoDB
├── RESUMEN_EJECUTIVO.md                     ← Este documento
└── INDEX.md                                 ← Este índice
```

Formato: `<contexto>-<nombre-en-kebab-case>.spec.md`

---

## Links Útiles

- **Reto original:** `.claude/reto/RETO.md`
- **Objetivo JSON:** `.claude/reto/objetivo.json`
- **Reglas backend:** `.claude/rules/backend.md`
- **Reglas frontend:** `.claude/rules/frontend.md`
- **Reglas database:** `.claude/rules/database.md`
- **Plantilla de specs:** `.claude/skills/generate-spec/spec-template.md`

---

**Documento generado:** 2026-04-17 por spec-generator  
**Estado:** LISTO PARA REVISAR

