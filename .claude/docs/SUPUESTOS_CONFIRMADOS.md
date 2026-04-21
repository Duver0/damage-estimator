# Supuestos Confirmados - Cotizador de Daños

**Fecha:** 2026-04-17  
**Status:** ✅ CONFIRMADOS Y ACTUALIZADOS EN TODAS LAS SPECS  
**Total de supuestos:** 13 confirmados + 30 específicos por spec  

---

## 🔴 SUPUESTOS GLOBALES CONFIRMADOS

### 1. Autenticación

**Confirmado:** NO obligatoria en fase 1

- ✅ Endpoints backend son PÚBLICOS (sin validación de token Firebase)
- ✅ Frontend NO requiere autenticación
- ✅ Puede agregarse en fase 2 si es necesario
- **Impacto:** SPEC-001, SPEC-002, SPEC-003, SPEC-004

---

### 2. Catálogos de Referencia

**Confirmado:** Usar fixtures/stubs (NO servicios reales)

- ✅ NO existe `plataforma-core-ohs` operacional
- ✅ Usar fixtures versionados con contrato documentado
- ✅ Fixtures en código (JSON o Python fixtures)
- ✅ Catálogos: agentes, códigos postales, giros, garantías, tarifas
- **Impacto:** SPEC-001, SPEC-002, SPEC-003, SPEC-005

---

### 3. Fórmula de Cálculo de Prima

**Confirmado:** SIMPLIFICADA y DEMOSTRATIVA (NO actuarial)

```
Prima = Suma × Tasa × FactorZona × FactorConstruccion × FactorGiro × (1 + RecargoCat)
```

- ✅ NO requiere validación actuarial
- ✅ NO requiere fórmula compleja de seguros
- ✅ Es demostrativa y trazable
- ✅ Documentar que es simplificada en README
- **Impacto:** SPEC-003

---

### 4. Ubicaciones Incompletas

**Confirmado:** SÍ permitidas (NO bloquean flujo)

- ✅ Ubicaciones sin datos obligatorios se guardan
- ✅ Generan alertas informativas (tipo: INCOMPLETO)
- ✅ NO bloquean navegación ni cálculo
- ✅ Se omiten del cálculo pero documentadas en alertas
- **Impacto:** SPEC-002, SPEC-003, SPEC-004

---

### 5. Precisión Numérica

**Confirmado:** float + round(x, 2) aceptable

- ✅ Python float es suficiente para fase 1
- ✅ Redondeo a 2 decimales (centavos MXN)
- ✅ NO usar Decimal en fase 1
- ✅ Validar precisión en tests
- **Impacto:** SPEC-003, SPEC-005

---

### 6. Límites de Datos

**Confirmado:** 

- ✅ **Ubicaciones:** Ilimitadas técnicamente (sin máximo en validación)
- ✅ **Suma asegurada:** Máx 50M MXN recomendado (sin validación en fase 1)
- ✅ **Coberturas:** Ilimitadas (todas disponibles)
- **Impacto:** SPEC-001, SPEC-002, SPEC-003

---

### 7. Número de Folio

**Confirmado:** SECUENCIAL por fecha

Formato: `F<YYYYMMDD><5 dígitos>`

Ejemplo: `F20260417-00001`, `F20260417-00002`

- ✅ No es aleatorio
- ✅ No es UUID
- ✅ Implementar counter en MongoDB per día
- ✅ Garantizar unicidad con índice
- **Impacto:** SPEC-001, SPEC-005

---

### 8. Historial de Cambios

**Confirmado:** NO implementado en fase 1

- ✅ Solo timestamps: `fechaCreacion`, `fechaUltimaActualizacion`
- ✅ Metadatos básicos: `usuarioCreacion`, `ultimoUsuarioActualizacion`
- ✅ Versionado optimista simple (campo `version` integer)
- ✅ Puede agregarse colección `_history` en fase 2
- **Impacto:** SPEC-001, SPEC-005

---

### 9. Integración Post-Cálculo

**Confirmado:** NO hay integración posterior (standalone)

- ✅ Cotizador termina en cálculo y persistencia de prima
- ✅ NO integra con sistemas de emisión, órdenes o pagos
- ✅ NO genera eventos para otros servicios
- ✅ Puede agregarse integración en fase 2 o proyecto siguiente
- **Impacto:** SPEC-003

---

### 10. Margen Comercial

**Confirmado:** 35% FIJO

- ✅ `Prima_Comercial = Prima_Neta × 1.35`
- ✅ Margen NO varía por tipo de negocio, giro o zona
- ✅ Guardado en `parametros_calculo.margenComercial: 0.35`
- ✅ Un solo set de parámetros activo
- **Impacto:** SPEC-003, SPEC-005

---

### 11. Factor Zona Catastrófica

**Confirmado:** 1.5x FIJO

- ✅ Si `zonaCatastrofica: true` → factor 1.5x
- ✅ Si `zonaCatastrofica: false` → factor 1.0x
- ✅ NO depende del tipo de CAT (CATFHM, CATTEV)
- ✅ Guardado en `parametros_calculo.factoresZonaCat`
- **Impacto:** SPEC-003, SPEC-005

---

### 12. Multi-Moneda

**Confirmado:** NO (solo MXN)

- ✅ Todos los cálculos en MXN
- ✅ NO agregar campo `moneda` en documentos
- ✅ NO implementar conversión de divisas
- ✅ Recomendación: agregar en fase 2 si se requiere
- **Impacto:** SPEC-001, SPEC-002, SPEC-003, SPEC-004, SPEC-005

---

### 13. Multi-Asegurador

**Confirmado:** NO (un solo asegurador)

- ✅ NO existe campo `codigoAsegurador` en cotización
- ✅ Sin selector de asegurador en frontend
- ✅ Todos los datos pertenecen a un asegurador implícito
- ✅ Puede agregarse en fase 2 si se requiere
- **Impacto:** SPEC-001, SPEC-004

---

## 📋 SUPUESTOS ESPECÍFICOS POR SPEC

### SPEC-001: Backend - Folios

1. ✅ Endpoints públicos (sin autenticación)
2. ✅ Versionado optimista basado en campo `version` (integer)
3. ✅ Idempotencia via `Idempotency-Key` en headers
4. ✅ Timestamps UTC automáticos en backend
5. ✅ Catálogos via fixtures para agentes y tipos de negocio

### SPEC-002: Backend - Ubicaciones

1. ✅ Ubicaciones incompletas permitidas (no bloquean)
2. ✅ Validación de CP contra catálogo local (fixture)
3. ✅ Zona catastrófica determinada automáticamente por CP
4. ✅ Índices de ubicación auto-asignados (0, 1, 2, ...)
5. ✅ Alertas informativas, no bloquean flujo
6. ✅ Límite ilimitado de ubicaciones (sin máximo)

### SPEC-003: Backend - Cálculo

1. ✅ Fórmula simplificada (demostrativa)
2. ✅ Margen comercial 35% fijo
3. ✅ Factor zona CAT 1.5x fijo
4. ✅ Redondeo a 2 decimales (float aceptable)
5. ✅ Moneda única: MXN
6. ✅ Ubicaciones incompletas omitidas pero documentadas
7. ✅ Parámetros únicos (un set activo)
8. ✅ Tarifas por giro/clave incendio (mapeo simple)

### SPEC-004: Frontend - SPA

1. ✅ Endpoints público (sin autenticación)
2. ✅ Ubicaciones incompletas muestran alertas (no bloquean)
3. ✅ Catálogos cargados desde API backend (fixtures)
4. ✅ Búsqueda de agentes async con debounce 300ms
5. ✅ Validación de CP async contra API
6. ✅ localStorage para guardar folio actual
7. ✅ Desktop-first (no responsivo obligatorio)
8. ✅ Textos en español (no i18n)
9. ✅ Sin accesibilidad obligatoria (a11y fase 2)
10. ✅ Sin analytics

### SPEC-005: Database - MongoDB

1. ✅ Moneda única: MXN
2. ✅ Precisión float aceptable (round a 2 decimales)
3. ✅ Historial NO implementado (solo timestamps)
4. ✅ Versionado optimista simple (campo `version`)
5. ✅ Integridad referencial validada en aplicación (no FK)
6. ✅ Schema validation en MongoDB
7. ✅ 8 colecciones principales documentadas
8. ✅ 45+ índices especificados
9. ✅ Single node/local development aceptable

---

## ✅ VALIDACIÓN DE SUPUESTOS

Todos los supuestos confirmados han sido:

- ✅ Documentados en sección "Supuestos Confirmados" de cada spec
- ✅ Incorporados en diseño técnico
- ✅ Reflejados en criterios de aceptación
- ✅ Incluidos en lista de tareas
- ✅ Validados contra RETO.md

---

## 🔄 PRÓXIMOS PASOS

### Fase 2: IMPLEMENTACIÓN

Con supuestos confirmados, los agentes pueden:

1. ✅ **backend-developer** inicia SPEC-001, SPEC-002, SPEC-003
   - Crear fixtures de catálogos
   - Implementar endpoints sin autenticación
   - Usar float para precisión (round a 2 decimales)

2. ✅ **database-agent** inicia SPEC-005
   - Crear 8 colecciones
   - Cargar fixtures de parámetros y tarifas
   - Crear índices (45+)

3. ✅ **frontend-developer** inicia SPEC-004
   - Setup React 19 + Vite
   - Crear componentes sin autenticación
   - Usar localStorage para folio actual
   - Validaciones async contra API

4. ✅ **test-engineer** desarrolla cobertura >= 80%
5. ✅ **orchestrator** monitorea progreso

---

## 📊 IMPACTO RESUMIDO

| Supuesto | Specs Afectadas | Severidad | Riesgo |
|----------|-----------------|-----------|--------|
| Sin autenticación | 001, 002, 003, 004 | ALTA | ✅ BAJO (cliente lo aprueba) |
| Fixtures vs servicios reales | 001, 002, 003, 005 | MEDIA | ✅ BAJO (stubs suficientes) |
| Fórmula simplificada | 003 | MEDIA | ✅ BAJO (demostrativa aceptada) |
| Ubicaciones incompletas permitidas | 002, 003, 004 | MEDIA | ✅ BAJO (alertas no bloquean) |
| Float aceptable | 003, 005 | BAJA | ✅ BAJO (fase 1 aceptado) |
| Moneda única MXN | 001, 002, 003, 004, 005 | BAJA | ✅ BAJO (scope claro) |
| Folio secuencial | 001, 005 | BAJA | ✅ BAJO (simple implementar) |
| Sin historial | 001, 005 | BAJA | ✅ BAJO (timestamps suficientes) |
| Standalone (sin integración) | 003 | MEDIA | ✅ BAJO (fase 2 puede extender) |
| Margen 35% fijo | 003, 005 | BAJA | ✅ BAJO (configurable si cambia) |

**Riesgo General:** ✅ **BAJO** — Todos los supuestos están confirmados y documentados

---

## 📞 CONTACTO

Si durante implementación se requiere clarificar algún supuesto:
- Revisar sección "Supuestos Confirmados ✅" de spec relevante
- Contactar en: duversiro@gmail.com
- Referencia: "Supuestos confirmados - Cotizador de Daños"

---

**Documento generado:** 2026-04-17  
**Status:** ✅ LISTO PARA IMPLEMENTACIÓN  
**Todas las 5 specs actualizado a APPROVED con supuestos confirmados**

