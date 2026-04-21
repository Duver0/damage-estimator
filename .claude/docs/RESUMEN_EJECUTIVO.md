# Resumen Ejecutivo - Especificaciones ASDD Cotizador de Daños

**Fecha generación:** 2026-04-17  
**Estado general:** 5 SPECS GENERADAS - DRAFT  
**Deadline entrega reto:** 2026-03-30 18:00  

---

## 1. ✅ SPECS GENERADAS

Se han generado **5 especificaciones técnicas completas** en `.github/specs/`:

| # | Archivo | Tema | Status | Dependencias |
|---|---------|------|--------|--------------|
| **SPEC-001** | `cotizador-backend-folios.spec.md` | Gestión de folios y cotizaciones | DRAFT | Ninguna |
| **SPEC-002** | `cotizador-backend-ubicaciones.spec.md` | Gestión de ubicaciones de riesgo | DRAFT | SPEC-001 |
| **SPEC-003** | `cotizador-backend-calculo.spec.md` | Cálculo de primas | DRAFT | SPEC-001, SPEC-002 |
| **SPEC-004** | `cotizador-frontend-main.spec.md` | Flujo principal frontend (SPA) | DRAFT | SPEC-001, SPEC-002, SPEC-003 |
| **SPEC-005** | `cotizador-database.spec.md` | Modelo de datos MongoDB | DRAFT | Ninguna (paralelo) |

---

## 2. ⚠️ AMBIGÜEDADES DETECTADAS

Se identificaron puntos que requieren clarificación o donde se tomaron supuestos:

### A. Autenticación y Autorización

**Detectado en:** SPEC-001, SPEC-004, SPEC-005

**Pregunta:** ¿Se requiere autenticación con Firebase en todos los endpoints?

**Supuesto tomado:** NO es obligatoria en fase 1. Endpoints públicos. Se puede agregar en fase 2.

**Recomendación:** Aclarar si usuarios deben autenticarse antes de crear folio.

---

### B. Catálogos de Referencia

**Detectado en:** SPEC-002, SPEC-003, SPEC-005

**Pregunta:** ¿Existen endpoints reales de servicio `plataforma-core-ohs` o usar stubs/fixtures?

**Supuesto tomado:** Se aceptan stubs/mocks con contrato documentado. Fixtures versionados en código.

**Recomendación:** Documentar endpoints reales si existen o confirmar que fixtures son válidos.

---

### C. Fórmula Exacta de Cálculo de Prima

**Detectado en:** SPEC-003

**Pregunta:** La fórmula de prima simplificada en SPEC-003 (fase 5) es demostrativa. ¿Es correcta o requiere ajustes actuariales?

```
Prima = Suma × Tasa × FactorZona × FactorConstruccion × FactorGiro × (1 + RecargoCat)
```

**Supuesto tomado:** Fórmula simplificada y trazable. No requiere actuario certificado en fase 1.

**Recomendación:** Validar con equipo actuarial si existe antes de cálculo en producción.

---

### D. Persistencia de Ubicaciones Incompletas

**Detectado en:** SPEC-002, SPEC-003

**Pregunta:** ¿Se permiten guardar ubicaciones incompletas y que cálculo las omita, o bloquear hasta completarlas?

**Supuesto tomado:** Se permiten ubicaciones incompletas. Generan alertas informativas pero NO bloquean.

**Recomendación:** Confirmar si esto alinea con política de negocio.

---

### E. Transacciones Distribuidas

**Detectado en:** SPEC-001, SPEC-003

**Pregunta:** Si actualización de resultados financieros falla parcialmente, ¿hay rollback?

**Supuesto tomado:** MongoDB transacciones single-document son suficientes. No se requieren transacciones multi-documento.

**Recomendación:** Si se integra con sistemas externos, considerar saga pattern o evento.

---

### F. Límites de Datos

**Detectado en:** SPEC-001, SPEC-002, SPEC-004

**Preguntas:**
- ¿Máximo de ubicaciones por cotización? (supuesto: ilimitado)
- ¿Máximo de coberturas? (supuesto: todas disponibles)
- ¿Máximo de sumas aseguradas? (supuesto: 50M MXN)

**Supuesto tomado:** Validado en modelos pero no limitado en lógica.

**Recomendación:** Definir límites de negocio antes de implementación.

---

### G. Manejo de Errores de Red / Timeouts

**Detectado en:** SPEC-004 (Frontend)

**Pregunta:** ¿Implementar reintentos automáticos en cliente o delegar al usuario?

**Supuesto tomado:** Spinner + timeout 30s. Usuario puede reintentar.

**Recomendación:** Considerar exponential backoff si reintentos son frecuentes.

---

### H. Versioning de Tarifas

**Detectado en:** SPEC-003, SPEC-005

**Pregunta:** ¿Cómo manejar cambios de tarifas en mitad del año? ¿Cotizaciones antiguas usan tarifas antiguas o nuevas?

**Supuesto tomado:** Parámetros y tarifas tienen versión, pero no se crea snapshot automático.

**Recomendación:** Documentar política de auditoría si tarifas cambian.

---

### I. Precisión de Cálculos Monetarios

**Detectado en:** SPEC-003

**Pregunta:** ¿Usar `Decimal` en lugar de `float` para precisión en MXN?

**Supuesto tomado:** Redondear a 2 decimales (centavos). Python `float` aceptable si se redondea.

**Recomendación:** Usar `Decimal` para máxima precisión en cálculos financieros.

---

### J. Cancelación de Cotización

**Detectado en:** SPEC-001

**Pregunta:** ¿Se puede cancelar una cotización? ¿Qué sucede si se cancela?

**Supuesto tomado:** Campo `estadoCotizacion` permite "CANCELADA" pero lógica no está especificada.

**Recomendación:** Definir flujo de cancelación (auditoría, alertas, etc.).

---

## 3. ❓ PREGUNTAS PENDIENTES

Preguntas que el usuario debe responder antes de pasar a implementación:

1. **¿Autenticación es obligatoria en fase 1?**
   - Si sí: extender SPEC-001, SPEC-002, SPEC-003 con middleware Firebase
   - Si no: confirmar que público es aceptable

2. **¿Existen datos reales de tarifas o usar solo fixtures?**
   - Si datos reales: proporcionar estructura y endpoint
   - Si fixtures: validar que estructura es correcta

3. **¿Fórmula de cálculo requiere revisión actuarial?**
   - Si sí: proporcionar fórmula exacta antes de implementación
   - Si no: confirmamos que simplificada es aceptable

4. **¿Máximos de datos?** (ubicaciones, coberturas, sumas)
   - Definir para validación en frontend y backend

5. **¿Número de folios es secuencial o distribuido?**
   - Si secuencial simple: aceptar `F<YYYYMMDD><5 dígitos>`
   - Si distribuido: implementar UUID + checksum

6. **¿Requiere historial completo de cambios?**
   - Si sí: extender SPEC-005 con colección `_history`
   - Si no: solo timestamps de creación/actualización

7. **¿Integración con sistema de órdenes posterior?**
   - Si sí: definir evento de cotización calculada
   - Si no: finaliza en cálculo de prima

8. **¿Reporte de cotizaciones?** (exportar a PDF, email, etc.)
   - Si sí: agregar especificación de reportes
   - Si no: solo visualización en web

9. **¿Multi-moneda o solo MXN?**
   - Si multi: extender modelos con campo de moneda
   - Si solo MXN: confirmamos

10. **¿Soporte para múltiples aseguradores?**
    - Si sí: agregar campo de asegurador en modelo
    - Si no: confirmamos

---

## 4. 🔄 DEPENDENCIAS ENTRE SPECS

```
SPEC-001 (Backend - Folios)
    ↓
SPEC-002 (Backend - Ubicaciones)  ←─┐
    ↓                              |
SPEC-003 (Backend - Cálculo) ──────┘
    ↓
SPEC-004 (Frontend - SPA) ←────────────── SPEC-005 (Database - Paralelo)
    ↓
    v
Implementación paralela: Backend + Frontend
```

**Explicación:**

- **SPEC-005 (Database)** es **independiente** → puede implementarse en paralelo
- **SPEC-001** es base → debe estar primero
- **SPEC-002** depende de SPEC-001 (folio debe existir)
- **SPEC-003** depende de SPEC-001 y SPEC-002 (datos completos)
- **SPEC-004** depende de SPEC-001, SPEC-002, SPEC-003 (APIs backend)

---

## 5. ⏱️ RECOMENDACIÓN DE ORDEN DE IMPLEMENTACIÓN (FASE 2)

### Iteración 1: Fundamentos (Semana 1-2)

**En paralelo:**

1. **backend-developer**
   - [ ] Implementar SPEC-001: folios_router, folios_service, folios_repository, folios_model
   - [ ] Crear fixtures de catálogos (agentes, tipos de negocio)
   - [ ] Tests unitarios de SPEC-001

2. **database-agent**
   - [ ] Crear colecciones en MongoDB (SPEC-005)
   - [ ] Crear índices y constraints
   - [ ] Cargar fixtures iniciales
   - [ ] Validar schema validation

3. **frontend-developer**
   - [ ] Setup Vite + React 19
   - [ ] Crear estructura de directorios (pages, components, hooks, services)
   - [ ] Implementar CotizadorPage (crear folio)
   - [ ] Implementar routing base (React Router)

---

### Iteración 2: Captura de Datos (Semana 2-3)

**En paralelo:**

1. **backend-developer**
   - [ ] Implementar SPEC-002: ubicaciones_router, ubicaciones_service, ubicaciones_repository
   - [ ] Crear fixtures de catálogos (CPs, giros, garantías)
   - [ ] Tests unitarios de SPEC-002
   - [ ] Implementar SPEC-004: technical_info_router, coberturas_service

2. **frontend-developer**
   - [ ] Implementar GeneralInfoPage (SPEC-004)
   - [ ] Implementar LocationsPage (SPEC-004)
   - [ ] Crear hooks: useCotizacion, useGeneralInfo, useUbicaciones
   - [ ] Crear services: cotizacionService, generalInfoService, ubicacionesService
   - [ ] Validaciones en cliente (CP, agente, etc.)

---

### Iteración 3: Cálculo y Resultado (Semana 3-4)

**En paralelo:**

1. **backend-developer**
   - [ ] Implementar SPEC-003: calculo_router, calculo_service (8 fases)
   - [ ] Crear fixtures de tarifas y parámetros de cálculo
   - [ ] Tests unitarios de SPEC-003
   - [ ] Tests de integración end-to-end

2. **frontend-developer**
   - [ ] Implementar TechnicalInfoPage (coberturas + cálculo)
   - [ ] Implementar TermsAndConditionsPage (opcional)
   - [ ] Crear hook useCalculo
   - [ ] Crear componentes PriceBreakdown, ProgressBar

---

### Iteración 4: Testing y Pulido (Semana 4-5)

**En paralelo:**

1. **test-engineer-backend**
   - [ ] Suite de tests unitarios: cobertura >= 80%
   - [ ] Tests de integración: creación → ubicación → cálculo
   - [ ] Tests de contract (API)
   - [ ] Validar error paths (400, 409, 500)

2. **test-engineer-frontend**
   - [ ] Suite de tests de componentes
   - [ ] Tests de hooks
   - [ ] Tests de integración E2E (Playwright/Cypress)
   - [ ] Validar UX (alertas, validaciones, loading states)

3. **qa-agent**
   - [ ] Gherkin case generation de todos los criterios
   - [ ] Risk identifier: clasificar riesgos técnicos
   - [ ] Validar cobertura de tests vs criterios
   - [ ] Pruebas manuales end-to-end

---

### Iteración 5: Documentación y Operaciones (Semana 5)

1. **documentation-agent**
   - [ ] README.md principal
   - [ ] Arquitectura overview
   - [ ] Instrucciones de instalación y setup local
   - [ ] Variables de entorno (.env.example)
   - [ ] Contratos API (OpenAPI/Postman)
   - [ ] Explicación de lógica de cálculo
   - [ ] Supuestos y limitaciones

2. **backend-developer**
   - [ ] Scripts de arranque (docker-compose, .env setup)
   - [ ] Colección Postman/Bruno con requests
   - [ ] Seeding de datos de prueba

3. **orchestrator**
   - [ ] Video explicativo (máximo 10 min, modo oculto)
   - [ ] Validación de entregables contra reto
   - [ ] Checklist final

---

## 6. 📋 CHECKLIST DE ENTREGABLES

### Fase 2 - Implementación

Según RETO.md, se requieren:

- [ ] ✅ Todos los Specs ASDD generados (5 specs en `.github/specs/`)
- [ ] Código backend (FastAPI + Motor + Pydantic v2)
- [ ] Código frontend (React 19 + Vite + CSS Modules)
- [ ] Pruebas unitarias (cobertura >= 80%)
- [ ] Pruebas automatizadas (mínimo 3 flujos críticos)
- [ ] README.md principal (instalación, ejecución)
- [ ] Colección API (Postman/Bruno)
- [ ] Scripts de arranque (docker-compose, setup local)
- [ ] Fixtures/mocks/semillas de datos
- [ ] Video YouTube (máximo 10 min, modo oculto)
- [ ] Repositorio GitLab Sofka

### Opcionales

- [ ] docker-compose.yml (recomendado)
- [ ] Pipeline CI (GitHub Actions o similar)
- [ ] Cobertura de tests (recomendado 80%+)

---

## 7. 📊 ESTADÍSTICAS DE SPECS

| Aspecto | Valor |
|--------|-------|
| Total de specs | 5 |
| Historias de usuario | 18 |
| Criterios de aceptación (Gherkin) | 27 |
| Endpoints backend | 13 |
| Páginas frontend | 5 |
| Componentes frontend | 11 |
| Colecciones MongoDB | 8 |
| Índices MongoDB | 45+ |
| Hooks React | 7 |
| Services JS | 6 |

---

## 8. 🎯 PRÓXIMOS PASOS

1. **Revisar ambigüedades y preguntas pendientes**
   - Usuario responde preguntas 1-10 (sección 3)
   - Aclarar supuestos donde sea necesario

2. **Aprobar specs**
   - Cambiar status de DRAFT a APPROVED una a una
   - Actualizar `updated` date

3. **Iniciar implementación**
   - Seguir orden de iteraciones (sección 5)
   - backend-developer y database-agent inician SPEC-001 + SPEC-005
   - frontend-developer prepara setup

4. **Monitorear progreso**
   - orchestrator verifica checklists en cada spec
   - Actualizar status a IN_PROGRESS cuando iniciado
   - Cambiar a IMPLEMENTED al terminar + tests + QA

---

## 9. 📞 CONTACTO Y REFERENCIAS

- **Reto:** `.claude/reto/RETO.md`
- **Objetivo:** `.claude/reto/objetivo.json`
- **Reglas Backend:** `.claude/rules/backend.md`
- **Reglas Frontend:** `.claude/rules/frontend.md`
- **Reglas Database:** `.claude/rules/database.md`
- **Reglas Specs:** `.claude/rules/specs.md`
- **Plantilla Specs:** `.claude/skills/generate-spec/spec-template.md`

---

## 📝 NOTAS FINALES

- **Specs están completas y listas para revisar**
- **Ambigüedades identificadas para clarificación**
- **Preguntas pendientes deben responderse antes de implementar**
- **Orden de iteraciones es recomendado pero flexible**
- **Cada spec tiene definición clara de tareas (DoR/DoD)**
- **Se aceptan cambios de scope en fase 2 si es necesario**

---

**Documento generado:** 2026-04-17  
**Generador:** spec-generator (ASDD)  
**Status:** LISTO PARA REVISAR Y APROBAR

