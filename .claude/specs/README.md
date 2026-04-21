# Especificaciones ASDD - Cotizador de Daños

**Status General:** ✅ **APPROVED** — Todas 5 specs listas para implementación  
**Fecha de aprobación:** 2026-04-17  
**Metodología:** ASDD (Arquitectura, Spec, Desarrollo, Deployment)

---

## 📋 SPECS APROBADAS

### SPEC-001: Backend API - Gestión de Folios y Cotizaciones ✅ APPROVED

**Archivo:** `cotizador-backend-folios.spec.md`  
**Owner:** backend-developer  
**Status:** `APPROVED`  
**Prioridad:** ALTA  
**Estimación:** S (Small)

**Cubre:**
- Creación de folios con idempotencia
- Consulta y actualización de datos generales
- Gestión de opciones de cobertura
- Consulta de estado de cotización
- 7 endpoints, 6 HU, 11 criterios de aceptación

**Supuestos confirmados:**
- ✅ Sin autenticación (endpoints públicos)
- ✅ Catálogos via fixtures
- ✅ Folio secuencial F<YYYYMMDD><5 dígitos>
- ✅ Versionado optimista simple

**Tareas:** 25+ (9 implementación backend, 16 tests)

---

### SPEC-002: Backend API - Gestión de Ubicaciones ✅ APPROVED

**Archivo:** `cotizador-backend-ubicaciones.spec.md`  
**Owner:** backend-developer  
**Status:** `APPROVED`  
**Prioridad:** ALTA  
**Estimación:** M (Medium)

**Cubre:**
- Configuración de layout de ubicaciones
- Registro y edición de ubicaciones
- Validaciones de CP, giro, garantías
- Resumen de completitud
- 6 endpoints, 5 HU, 11 criterios de aceptación

**Supuestos confirmados:**
- ✅ Ubicaciones incompletas permitidas (alertas, no bloquean)
- ✅ Catálogos via fixtures
- ✅ Zona catastrófica auto-determinada
- ✅ Límite ilimitado de ubicaciones

**Tareas:** 25+ (9 implementación backend, 16 tests)

---

### SPEC-003: Backend - Cálculo de Primas ✅ APPROVED

**Archivo:** `cotizador-backend-calculo.spec.md`  
**Owner:** backend-developer  
**Status:** `APPROVED`  
**Prioridad:** ALTA  
**Estimación:** L (Large)

**Cubre:**
- Cálculo de primas (8 fases)
- Fórmula simplificada y trazable
- Persistencia sin sobrescribir otras secciones
- 1 endpoint, 1 HU, 4 criterios de aceptación

**Supuestos confirmados:**
- ✅ Fórmula SIMPLIFICADA (demostrativa, no actuarial)
- ✅ Margen comercial 35% fijo
- ✅ Factor zona CAT 1.5x fijo
- ✅ Redondeo a 2 decimales (float aceptable)
- ✅ Moneda única: MXN
- ✅ Ubicaciones incompletas omitidas

**Tareas:** 25+ (9 implementación backend, 16 tests)

---

### SPEC-004: Frontend - Flujo Principal de Cotización ✅ APPROVED

**Archivo:** `cotizador-frontend-main.spec.md`  
**Owner:** frontend-developer  
**Status:** `APPROVED`  
**Prioridad:** ALTA  
**Estimación:** L (Large)

**Cubre:**
- 5 rutas/páginas principales
- 11 componentes reutilizables
- 7 hooks + 6 services
- Context API para estado global
- 6 HU, 10 criterios de aceptación

**Supuestos confirmados:**
- ✅ Sin autenticación (endpoints públicos)
- ✅ Ubicaciones incompletas con alertas (no bloquean)
- ✅ localStorage para guardar folio actual
- ✅ Desktop-first (no responsivo obligatorio)
- ✅ Textos en español (no i18n)

**Tareas:** 27+ (19 implementación frontend, 19 tests)

---

### SPEC-005: Database - Modelo de Datos MongoDB ✅ APPROVED

**Archivo:** `cotizador-database.spec.md`  
**Owner:** database-agent  
**Status:** `APPROVED`  
**Prioridad:** ALTA  
**Estimación:** S (Small)

**Cubre:**
- 8 colecciones MongoDB
- 45+ índices documentados
- Schema validation
- Versionado optimista
- Auditoría: timestamps + metadatos
- 5 criterios de aceptación

**Supuestos confirmados:**
- ✅ Moneda única: MXN
- ✅ Precisión float aceptable
- ✅ Historial NO implementado (solo timestamps)
- ✅ Single node/local development aceptable

**Tareas:** 21+ (9 creación + índices, 12 tests)

---

## 📊 ESTADÍSTICAS GLOBALES

| Métrica | Valor |
|---------|-------|
| **Specs aprobadas** | 5/5 ✅ |
| **Historias de usuario** | 18 |
| **Criterios de aceptación** | 27 (100% Gherkin) |
| **Endpoints backend** | 13 |
| **Rutas frontend** | 5 |
| **Componentes frontend** | 11 |
| **Hooks/Services** | 13 (7+6) |
| **Colecciones MongoDB** | 8 |
| **Índices MongoDB** | 45+ |
| **Tareas totales** | 98+ |
| **Tests estimados** | 79+ |
| **Cobertura objetivo** | 80%+ |

---

## 🔄 DEPENDENCIAS DE IMPLEMENTACIÓN

```
SPEC-001 (Backend - Folios) ← BASE
    ↓
SPEC-002 (Backend - Ubicaciones) ← Depende de SPEC-001
    ↓
SPEC-003 (Backend - Cálculo) ← Depende de SPEC-001, SPEC-002
    ↓
SPEC-004 (Frontend - SPA) ← Depende de SPEC-001, 002, 003
    ↓
SPEC-005 (Database) ← Paralelo desde inicio
```

---

## ⏱️ ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### **Iteración 1: Fundamentos (Semana 1-2)**

En paralelo:
- [ ] backend-developer: SPEC-001 (folios, fixtures)
- [ ] database-agent: SPEC-005 (crear colecciones, índices, fixtures)
- [ ] frontend-developer: setup React 19 + Vite, routing base

### **Iteración 2: Captura de Datos (Semana 2-3)**

En paralelo:
- [ ] backend-developer: SPEC-002 (ubicaciones)
- [ ] frontend-developer: GeneralInfoPage, LocationsPage

### **Iteración 3: Cálculo y Resultado (Semana 3-4)**

En paralelo:
- [ ] backend-developer: SPEC-003 (cálculo, 8 fases)
- [ ] frontend-developer: TechnicalInfoPage (coberturas, cálculo)

### **Iteración 4: Testing (Semana 4-5)**

En paralelo:
- [ ] test-engineer-backend: suite de 60+ tests
- [ ] test-engineer-frontend: suite de 19+ tests
- [ ] qa-agent: tests automatizados E2E

### **Iteración 5: Entregables (Semana 5)**

- [ ] documentation-agent: README, arquitectura, instrucciones
- [ ] backend-developer: scripts de arranque, colección Postman
- [ ] orchestrator: video, validación final

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
.github/specs/
├── SPEC-001: cotizador-backend-folios.spec.md ✅ APPROVED
├── SPEC-002: cotizador-backend-ubicaciones.spec.md ✅ APPROVED
├── SPEC-003: cotizador-backend-calculo.spec.md ✅ APPROVED
├── SPEC-004: cotizador-frontend-main.spec.md ✅ APPROVED
├── SPEC-005: cotizador-database.spec.md ✅ APPROVED
├── SUPUESTOS_CONFIRMADOS.md (13 supuestos globales + 30 específicos)
├── RESUMEN_EJECUTIVO.md (contexto, ambigüedades, preguntas)
├── INDEX.md (navegación rápida)
├── VALIDACION_SPECS.md (checklist de calidad)
├── PREGUNTAS_PARA_USUARIO.md (preguntas resueltas)
└── README.md (este archivo)
```

---

## ✅ VALIDACIÓN PRE-IMPLEMENTACIÓN

Antes de iniciar Fase 2, verificar:

- [x] Todas las 5 specs tienen `status: APPROVED`
- [x] Sección "Supuestos Confirmados ✅" presente en cada spec
- [x] 13 supuestos globales confirmados en `SUPUESTOS_CONFIRMADOS.md`
- [x] 100% cobertura de requisitos del RETO.md
- [x] 27 criterios de aceptación en Gherkin
- [x] Tareas accionables en cada spec (DoR/DoD)
- [x] Dependencias mapeadas
- [x] Estimaciones asignadas

**Status:** ✅ **LISTO PARA IMPLEMENTACIÓN**

---

## 🚀 INICIAR IMPLEMENTACIÓN

### Paso 1: Setup del Proyecto

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
npm run dev

# Database
# Crear BD local MongoDB (ver SPEC-005)
```

### Paso 2: Generar Fixtures

- [ ] SPEC-001: fixtures de agentes y tipos de negocio
- [ ] SPEC-002: fixtures de CPs, giros, garantías
- [ ] SPEC-003: fixtures de parámetros y tarifas
- [ ] SPEC-005: cargar todas en MongoDB

### Paso 3: Implementar en Orden

1. SPEC-001 + SPEC-005 (paralelo)
2. SPEC-002
3. SPEC-003
4. SPEC-004
5. Tests + QA

### Paso 4: Documentar

- [ ] README.md principal
- [ ] Contratos API (Postman)
- [ ] Instrucciones de instalación
- [ ] Variables de entorno
- [ ] Explicación de lógica

---

## 📞 CONTACTO Y REFERENCIAS

**Repositorio:** GitLab Sofka (será creado)  
**Contacto:** duversiro@gmail.com  
**Reto:** `.claude/reto/RETO.md`  
**Objetivo:** `.claude/reto/objetivo.json`  

### Documentos de Referencia

- [SUPUESTOS_CONFIRMADOS.md](SUPUESTOS_CONFIRMADOS.md) — 13 supuestos confirmados
- [RESUMEN_EJECUTIVO.md](RESUMEN_EJECUTIVO.md) — Contexto y ambigüedades resueltas
- [INDEX.md](INDEX.md) — Navegación rápida por specs
- [VALIDACION_SPECS.md](VALIDACION_SPECS.md) — Checklist de calidad (100% pass)

---

## 📝 CAMBIO DE LOG

**2026-04-17 — Primera aprobación**
- ✅ 5 specs generadas en DRAFT
- ✅ 10 ambigüedades identificadas
- ✅ 15 preguntas pendientes documentadas

**2026-04-17 — Aprobación final (hoy)**
- ✅ Todas las 5 specs cambiadas a APPROVED
- ✅ 13 supuestos confirmados y documentados
- ✅ Supuestos específicos agregados a cada spec
- ✅ Documento SUPUESTOS_CONFIRMADOS.md creado
- ✅ Listo para Fase 2: IMPLEMENTACIÓN

---

## 🎯 PRÓXIMO MILESTONE

**Fase 2: IMPLEMENTACIÓN**  
**Fecha inicio recomendada:** 2026-04-18  
**Fecha fin estimada:** 2026-05-17 (antes del 30 de marzo)  
**Status:** ✅ LISTO PARA INICIAR

---

**Documento:** README.md - Especificaciones ASDD  
**Status:** ✅ APROBADO  
**Versión:** 1.0  
**Última actualización:** 2026-04-17

