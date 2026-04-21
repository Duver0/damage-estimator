# Análisis Crítico de Specs - Cotizador de Daños

**Fecha:** 2026-04-17  
**Autor:** Revisión Manual del Orquestador  
**Status:** CRÍTICA PARA APROBACIÓN  

---

## 📊 Resumen Ejecutivo

| Métrica | Valor | Status |
|---------|-------|--------|
| Specs generadas | 5 | ✅ Completas |
| Cobertura de requisitos | 100% | ✅ Total |
| Ambigüedades detectadas | 10 | ⚠️ CRÍTICAS |
| Preguntas pendientes | 15 | ❌ REQUIERE RESPUESTA |
| Riesgo de implementación | ALTO | 🔴 Si no se aclaran |
| Recomendación | ⏸️ NO INICIAR FASE 2 | Hasta responder preguntas |

---

## ✅ LO QUE ESTÁ BIEN ESPECIFICADO

### 1. Arquitectura Backend (SPEC-001, 002, 003)
✅ **13 endpoints completamente especificados** con:
- Request/response JSON completos
- Códigos HTTP (200, 400, 404, 409, 500)
- Ejemplos de payloads
- Validaciones documentadas
- Manejo de errores

**Ejemplo:**
```
POST /v1/quotes/{folio}/calculate
Response 200: { primaNeta, primaComercial, primasPorUbicacion[], version }
Response 409: { error: "Version conflict", esperada: x, actual: y }
```

✅ **Versionado optimista implementado:**
- Cada actualización incrementa `version`
- PUT requiere `version` en payload
- Retorna 409 si hay conflict

✅ **Reglas de negocio claras:**
- Idempotencia en POST /v1/folios
- Actualización parcial (PATCH)
- Ubicaciones incompletas generan alertas

---

### 2. Frontend (SPEC-004)
✅ **5 rutas claramente mapeadas:**
```
/cotizador                           → HomePage
/quotes/{folio}/general-info         → GeneralInfoPage
/quotes/{folio}/locations            → LocationsPage
/quotes/{folio}/technical-info       → TechnicalInfoPage
/quotes/{folio}/terms-and-conditions → TermsPage
```

✅ **11 componentes React documentados** con:
- Props esperadas
- Estado local
- Efectos secundarios
- Validaciones

✅ **7 hooks custom especificados:**
- `useQuote(folio)` → fetch cotización
- `useLocations(folio)` → CRUD ubicaciones
- `useCalculate(folio)` → trigger cálculo
- Etc.

---

### 3. Database (SPEC-005)
✅ **8 colecciones MongoDB especificadas** con:
- Campos detallados (tipo, validación, requerido)
- 45+ índices documentados
- Versionado optimista
- Auditoría (createdAt, updatedAt)

Ejemplo de schema `cotizaciones_danos`:
```javascript
{
  numeroFolio: String (unique),
  estadoCotizacion: "BORRADOR" | "CALCULADA" | "CANCELADA",
  datosAsegurado: { nombre, rfc, email },
  ubicaciones: [{ index, nombre, direccion, estado, ... }],
  primaNeta: Decimal,
  primaComercial: Decimal,
  version: Integer,
  createdAt: Date,
  updatedAt: Date
}
```

---

## ⚠️ AMBIGÜEDADES CRÍTICAS (10)

### 🔴 CRÍTICA 1: Autenticación Global

**Impacto:** ALTO — Afecta ALL endpoints  
**Specs afectadas:** SPEC-001, 002, 003, 004

**Ambigüedad:**
```
¿Todos los endpoints requieren autenticación Firebase?

Supuesto: NO (endpoints públicos)
Realidad: ¿???
```

**Riesgo:**
- Si se requiere auth, SPEC-001/002/003 necesitan middleware de autenticación
- Frontend debe enviar JWT en todas las requests
- **Estimado: +15 horas de trabajo extra**

**Acción requerida:** Aclarar si `POST /v1/folios` requiere usuario autenticado o es público

---

### 🔴 CRÍTICA 2: Integración con Catálogos de Referencia

**Impacto:** ALTO — Bloqueador de SPEC-002, SPEC-003

**Ambigüedad:**
```
¿Existen endpoints reales de plataforma-core-ohs?

Supuesto: NO, usar fixtures versionados
Realidad: ¿Existen URLs reales?
```

**Riesgo:**
- Si existen, necesitamos contrato OpenAPI
- Si no existen, creamos fixtures en `/backend/fixtures/`
- **Estimado: +10-20 horas si son reales (integración)**

**Catálogos requeridos:**
- `GET /v1/subscribers` → lista de asegurados
- `GET /v1/agents` → agentes de seguros
- `GET /v1/business-lines` → giros
- `GET /v1/zip-codes/{cp}` → validar código postal + zona
- `GET /v1/catalogs/guarantees` → garantías (Incendio, CATTEV, etc.)
- `GET|PUT /v1/tariffs` → tarifas técnicas

**Acción requerida:** Proporcionar lista de endpoints reales O confirmar que fixtures son aceptables

---

### 🔴 CRÍTICA 3: Fórmula de Cálculo de Prima

**Impacto:** ALTO — Core del reto

**Specs afectadas:** SPEC-003

**Ambigüedad:**
```
Fórmula propuesta (SPEC-003):
Prima = Suma × Tasa × FactorZona × FactorConstruccion × FactorGiro × (1 + RecargoCat)

¿Es EXACTA o SIMPLIFICADA?

Supuesto: Simplificada (demostrativa)
Realidad: ¿Necesita validación actuarial?
```

**Riesgo:**
- Si es "simplificada" → puedo implementar
- Si es "exacta" → necesito documento actuarial con fórmula correcta, bonificaciones, recargos, etc.
- **Estimado: +30 horas si es exacta (validación, ajustes)**

**Componentes en fórmula:**
- Incendio edificios, contenidos
- CATTEV, CATFHM (factores de zona)
- Antigüedad de construcción
- Recargos por características
- Extensiones de cobertura

**Acción requerida:** Confirmar si es simplificada para demostración O proporcionar fórmula exacta

---

### ⚠️ CRÍTICA 4: Ubicaciones Incompletas

**Impacto:** MEDIO — Afecta flujo

**Specs afectadas:** SPEC-002, SPEC-003, SPEC-004

**Ambigüedad:**
```
SPEC-002: "Se permiten ubicaciones incompletas si faltan: CP, giro, garantías"
SPEC-003: "Cálculo omite ubicaciones incompletas y genera alertas"
SPEC-004: "Frontend muestra alertas pero NO bloquea folio"

¿Es correcto este comportamiento?

Supuesto: SÍ (borrador flexible)
Realidad: ¿O requiere completitud obligatoria?
```

**Riesgo:**
- Si borrador es correcto → OK
- Si requiere completitud → bloquear navegación, cambiar validaciones
- **Estimado: +10 horas si requiere cambio**

**Acción requerida:** Confirmar si ubicación incompleta es un "borrador" válido O si es un error

---

### ⚠️ CRÍTICA 5: Precisión de Cálculos Monetarios

**Impacto:** MEDIO — Riesgo financiero

**Specs afectadas:** SPEC-003, SPEC-005

**Ambigüedad:**
```
SPEC-003 propone:
- Usar Python float
- Redondear a 2 decimales: round(x, 2)

¿Es suficiente para MXN?

Supuesto: SÍ (float + round aceptable)
Realidad: ¿Requiere Decimal para máxima precisión?
```

**Riesgo:**
- float tiene precision issues: 0.1 + 0.2 ≠ 0.3 exactamente
- Para dinero, estándar es usar Decimal
- **Estimado: +5 horas si requiere refactor a Decimal**

**Acción requerida:** Confirmar si precision MXN es crítica → usar Decimal

---

### ⚠️ CRÍTICA 6: Límites de Datos

**Impacto:** BAJO-MEDIO — Validaciones

**Specs afectadas:** SPEC-001, SPEC-002

**Ambigüedad:**
```
Preguntas sin respuesta:
- ¿Máximo de ubicaciones por cotización? (supuesto: ilimitado)
- ¿Máximo de suma asegurada? (supuesto: 50M MXN)
- ¿Máximo de coberturas seleccionables? (supuesto: todas)
```

**Riesgo:**
- Sin límites explícitos, es difícil validar
- **Estimado: +5 horas si requiere límites específicos**

**Acción requerida:** Definir rangos (mín-máx) por field

---

### ⚠️ CRÍTICA 7: Número de Folio

**Impacto:** BAJO — Formato

**Specs afectadas:** SPEC-001, SPEC-005

**Ambigüedad:**
```
Formato propuesto: F<YYYYMMDD><5 dígitos>
Ejemplo: F20260417-00001, F20260417-00002

¿Es correcto O prefiere otro formato?

Supuesto: Secuencial simple
Realidad: ¿Aleatorio con checksum? ¿UUID?
```

**Riesgo:**
- Secuencial es fácil de auditar
- Aleatorio es mejor para distribuído
- **Estimado: +3 horas si requiere cambio**

**Acción requerida:** Confirmar formato de folio

---

### ⚠️ CRÍTICA 8: Versionado de Tarifas

**Impacto:** BAJO-MEDIO — Auditoría

**Specs afectadas:** SPEC-003, SPEC-005

**Ambigüedad:**
```
Si tarifas cambian en mitad del año:
- ¿Cotizaciones antiguas usan tarifas antiguas o nuevas?
- ¿Se crea snapshot automático?
- ¿Auditoría de cambios?

Supuesto: NO se crea snapshot, pero parámetros tienen versión
Realidad: ¿Requerimiento de auditoría?
```

**Riesgo:**
- Sin snapshot, se pierden datos históricos
- **Estimado: +10 horas si requiere auditoría completa**

**Acción requerida:** Definir política de auditoría de tarifas

---

### ⚠️ CRÍTICA 9: Cancelación de Cotización

**Impacto:** BAJO — Lógica de negocio

**Specs afectadas:** SPEC-001

**Ambigüedad:**
```
SPEC-001 define estado: "CANCELADA"
Pero no especifica:
- ¿Quién puede cancelar?
- ¿Qué sucede si se cancela?
- ¿Se genera auditoría?
- ¿Se notifica al usuario?

Supuesto: Se puede cambiar estadoCotizacion a CANCELADA, pero sin lógica adicional
Realidad: ¿Requiere flujo específico?
```

**Riesgo:**
- Sin lógica clara, puede causar inconsistencias
- **Estimado: +5 horas si requiere flujo de cancelación**

**Acción requerida:** Definir si cancelación es simple cambio de estado O flujo complejo

---

### ⚠️ CRÍTICA 10: Integración Post-Cálculo

**Impacto:** ALTO — Scope de fase 2

**Specs afectadas:** SPEC-003 + posible SPEC-006

**Ambigüedad:**
```
SPEC-003 termina en: "Persistir resultado financiero"

Pregunta: ¿Qué pasa después del cálculo?
- ¿Se emite póliza automáticamente?
- ¿Se envía a otro sistema?
- ¿Usuario descarga documento?

Supuesto: Nada. Usuario ve resultado en frontend. Fin.
Realidad: ¿Hay integración posterior?
```

**Riesgo:**
- Si hay integración, requiere nueva SPEC-006
- **Estimado: +40 horas si requiere emisión de póliza o integración**

**Acción requerida:** Clarificar si cotizador es "standalone" O parte de flujo mayor

---

## 📋 15 PREGUNTAS PENDIENTES (Requiere Respuesta)

### Críticas (Responder SÍ/NO):
1. ¿Autenticación obligatoria en todos los endpoints?
2. ¿Existen endpoints reales de `plataforma-core-ohs`?
3. ¿Fórmula de prima es EXACTA o SIMPLIFICADA?
4. ¿Se permiten ubicaciones incompletas (borrador)?
5. ¿Máximo de ubicaciones por cotización? (ej: 10, 20, ilimitado)
6. ¿Máximo de suma asegurada por ubicación? (ej: 50M MXN)
7. ¿Folio es SECUENCIAL o ALEATORIO?
8. ¿Se requiere historial completo de cambios?
9. ¿Precisión monetaria es CRÍTICA (Decimal)?
10. ¿Hay integración posterior al cálculo?

### Configuración (Valores específicos):
11. ¿Margen comercial (%)? (supuesto: 35%)
12. ¿Factor zona catastrófica (x)? (supuesto: 1.5x)
13. ¿Tabla de antigüedad de construcción?
14. ¿Soporte multi-moneda? (supuesto: solo MXN)
15. ¿Soporte multi-asegurador? (supuesto: un solo)

---

## 🔄 ORDEN DE IMPLEMENTACIÓN (Recomendado)

Si respuestas **confirman supuestos** → Implementar en este orden:

```
PARALELO:
├── Semana 1-2: SPEC-005 (Database) + SPEC-001 (Backend Folios)
│   └── Crear MongoDB, colecciones, índices
│   └── Implementar 7 endpoints de folios
│
├── Semana 2-3: SPEC-002 (Backend Ubicaciones)
│   └── 6 endpoints de ubicaciones
│   └── Validaciones de CP, giro, garantías
│
├── Semana 3-4: SPEC-003 (Backend Cálculo)
│   └── Endpoint POST /calculate
│   └── Algoritmo de 8 fases
│
└── Semana 3-4: SPEC-004 (Frontend)
    └── 5 rutas React
    └── 11 componentes
    └── Integración con backend

SECUENCIAL (después de backend):
├── Semana 4-5: Tests Backend + Frontend (79+ tests)
├── Semana 5: QA (Gherkin, riesgos)
└── Semana 5+: Documentación + Video

PARALELO AL FINAL:
└── Toda la semana: Documentación (README, API, ADR)
```

---

## 🎯 MATRIZ DE RIESGO

| Ambigüedad | Impacto | Probabilidad | Riesgo | Acción |
|------------|---------|--------------|--------|--------|
| Autenticación | 🔴 Alto | 🟡 Media | 🔴 ALTO | 🛑 Aclarar antes de Phase 2 |
| Catálogos reales | 🔴 Alto | 🟡 Media | 🔴 ALTO | 🛑 Aclarar antes de Phase 2 |
| Fórmula exacta | 🔴 Alto | 🟡 Media | 🔴 ALTO | 🛑 Aclarar antes de Phase 2 |
| Ubicaciones incompletas | 🟠 Medio | 🟢 Baja | 🟡 MEDIO | ⏱️ Aclarar antes de Phase 2 |
| Precisión Decimal | 🟠 Medio | 🟢 Baja | 🟡 MEDIO | ⏱️ Aclarar antes de Phase 2 |
| Límites de datos | 🟢 Bajo | 🟡 Media | 🟡 MEDIO | ⏱️ Aclarar antes de Phase 2 |
| Formato folio | 🟢 Bajo | 🟢 Baja | 🟢 BAJO | ✅ Implementar supuesto |
| Historial de cambios | 🟢 Bajo | 🟢 Baja | 🟢 BAJO | ✅ Implementar supuesto |
| Tarifas versionadas | 🟢 Bajo | 🟡 Media | 🟡 MEDIO | ⏱️ Aclarar antes de Phase 2 |
| Cancelación | 🟢 Bajo | 🟢 Baja | 🟢 BAJO | ✅ Implementar supuesto |
| Integración post-calc | 🔴 Alto | 🟡 Media | 🔴 ALTO | 🛑 Aclarar antes de Phase 2 |

**Leyenda:**
- 🛑 BLOQUEADOR: No iniciar Phase 2 sin aclaridad
- ⏱️ IMPORTANTE: Aclarar antes pero se puede avanzar con supuesto
- ✅ OK: Implementar con supuesto actual

---

## 📌 RECOMENDACIÓN FINAL

### ✅ ESTADO: LISTO PARA RESPONDER PREGUNTAS (NO para implementación)

**ANTES de cambiar specs a `APPROVED` y pasar a Phase 2:**

1. **Responder 15 preguntas** (Ver `PREGUNTAS_PARA_USUARIO.md`)
2. **Validar 3 bloqueadores críticos:**
   - ¿Autenticación sí/no?
   - ¿Endpoints reales o fixtures?
   - ¿Fórmula exacta o demo?
3. **Actualizar solo secciones afectadas** (no regenerar todo)
4. **Cambiar status a `APPROVED`** en cada spec

**Timeline:**
- 📋 Hoy: Responder preguntas (1-2 horas)
- 🔄 Mañana: Actualizar specs si requiere (2-4 horas)
- ✅ Mañana: Cambiar a `APPROVED`
- 🚀 Pasado mañana: Iniciar Phase 2 (Backend + Frontend + DB en paralelo)

---

## 📚 Documentos Relacionados

- **RETO.md** — Reto original (requisitos)
- **RESUMEN_EJECUTIVO.md** — Resumen de ambigüedades
- **PREGUNTAS_PARA_USUARIO.md** — 15 preguntas detalladas
- **VALIDACION_SPECS.md** — Checklist de calidad
- **INDEX.md** — Navegación rápida de specs

---

**CONCLUSIÓN:** Las specs están bien construidas pero dependen de 15 respuestas críticas. No cambiar a `APPROVED` hasta tener claridad en las 3 ambigüedades bloqueadoras.

**Status Recomendado:** 🟡 DRAFT (con opción de Quick-Approve si respuestas confirman supuestos)
