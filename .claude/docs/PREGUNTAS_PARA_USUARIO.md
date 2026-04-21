# Preguntas para Aclaración antes de Implementación - Cotizador de Daños

**Documento:** Basado en ambigüedades detectadas en fase de especificación  
**Fecha:** 2026-04-17  
**Para:** Usuario/Tech Lead responsable del reto  

---

## ❓ Preguntas Críticas (debe responder SÍ o NO)

### 1. ¿Se requiere autenticación con Firebase en TODOS los endpoints?

**Contexto:** SPEC-001, SPEC-002, SPEC-003, SPEC-004

**Actual (supuesto):** Endpoints públicos. Autenticación es opcional.

**Si responde SÍ:**
- [ ] Todos los endpoints deben validar Firebase ID token
- [ ] Extender SPEC-001, SPEC-002, SPEC-003 con middleware de autenticación
- [ ] Frontend debe enviar token en header Authorization

**Si responde NO:**
- [ ] Endpoints permanecen públicos (acepto para fase 1)
- [ ] Agregar autenticación en fase 2 si se requiere

**Recomendación:** Aclarar si al menos el endpoint POST /v1/folios debe validar que usuario está autenticado.

---

### 2. ¿Existen endpoints reales del servicio `plataforma-core-ohs`?

**Contexto:** SPEC-002, SPEC-003 requieren consultar catálogos (agentes, CPs, giros, garantías, tarifas)

**Actual (supuesto):** No existen. Se usan fixtures/stubs con contrato documentado.

**Si responde SÍ:**
- [ ] Proporcionar lista de endpoints reales con estructura esperada
- [ ] Documentar URL base, tokens, timeouts
- [ ] Integrar llamadas reales en lugar de fixtures

**Si responde NO:**
- [ ] Confirmamos que fixtures son suficientes
- [ ] Versionamos fixtures en código (`/backend/fixtures/...`)
- [ ] Documentamos contrato de cada catálogo

**Recomendación:** Si existen endpoints, proporcionar documento con contrato OpenAPI.

---

### 3. ¿La fórmula de cálculo de prima es EXACTA o simplificada?

**Contexto:** SPEC-003, fase 5, fórmula propuesta:

```
Prima = Suma × Tasa × FactorZona × FactorConstruccion × FactorGiro × (1 + RecargoCat)
```

**Actual (supuesto):** Fórmula simplificada y demostrativa. No requiere actuario.

**Si responde "EXACTA":**
- [ ] Proporcionar fórmula correcta (documento actuarial o Excel con ejemplos)
- [ ] Validar redondeos, recargos, bonificaciones
- [ ] Incluir ajustes por antigüedad, zona, sector

**Si responde "SIMPLIFICADA":**
- [ ] Confirmamos que fórmula en SPEC-003 es aceptable
- [ ] Documentamos en README que es demostrativa
- [ ] Permitimos mejoras en fase 2

**Recomendación:** Si cálculo será usado en producción, validar con equipo actuarial antes de implementar.

---

### 4. ¿Se permiten ubicaciones incompletas en cálculo?

**Contexto:** SPEC-002, SPEC-003 permiten guardar ubicaciones con datos faltantes que generan alertas.

**Actual (supuesto):** SÍ se permiten. Generan alertas pero NO bloquean el flujo. Cálculo las omite.

**Si responde SÍ:**
- [ ] Confirmamos que es correcto el comportamiento en SPEC-002, SPEC-003
- [ ] Ubicación incompleta → alerta informativa → usuario puede continuar

**Si responde NO:**
- [ ] Bloquear navegación hasta completar todos los datos
- [ ] Cambiar flujo: validar al guardar, rechazar si incompleta
- [ ] Modificar SPEC-002 y SPEC-004 (frontend)

**Recomendación:** Aclarar política de negocio: ¿permitir "borrador" de ubicación o requerir completitud?

---

### 5. ¿Máximo de ubicaciones por cotización?

**Contexto:** SPEC-002 permite ilimitadas ubicaciones.

**Actual (supuesto):** Ilimitadas (pero validadas en modelo).

**Si responde "SÍ" (límite específico):**
- [ ] Especificar número: ej. máx 10 ubicaciones
- [ ] Validar en backend (returnar 400 si excede)
- [ ] Mostrar alerta en frontend

**Si responde "NO" (ilimitadas):**
- [ ] Confirmamos que supuesto es correcto
- [ ] Posible limite en BD por performance (a monitorear)

**Recomendación:** Definir límite realista (ej. máx 10-20 ubicaciones).

---

### 6. ¿Máximo de sumas aseguradas permitidas?

**Contexto:** SPEC-001, SPEC-002, SPEC-003 usan ejemplo de 500k-1.5M MXN.

**Actual (supuesto):** Máx 50M MXN por ubicación (sin límite técnico).

**Si responde "SÍ" (límite específico):**
- [ ] Especificar: mín y máx cantidad asegurada por ubicación
- [ ] Ejemplo: 50,000 - 50,000,000 MXN
- [ ] Validar en servicio, returnar 400 si fuera de rango

**Si responde "NO" (sin límite):**
- [ ] Confirmamos que cualquier monto es válido
- [ ] Posible validación solo por tipo de construcción

**Recomendación:** Definir rangos según tipos de construcción y giros.

---

### 7. ¿Número de folio es SECUENCIAL o ALEATORIO?

**Contexto:** SPEC-001 propone formato `F<YYYYMMDD><5 dígitos>` (secuencial simple).

**Actual (supuesto):** Secuencial por día: F20260417-00001, F20260417-00002, etc.

**Si responde "SECUENCIAL":**
- [ ] Confirmamos formato propuesto es correcto
- [ ] Implementar counter en MongoDB per día

**Si responde "ALEATORIO":**
- [ ] Usar UUID + checksum: ej. F-a7f3d9e1-XYZW
- [ ] Validar unicidad en BD
- [ ] Formato más fácil de distribuir

**Si responde "EXISTENTE":**
- [ ] Proporcionar lógica de generación
- [ ] Documentar de dónde viene el número

**Recomendación:** Secuencial simple es más fácil de auditar. Aleatorio es mejor para distribuido.

---

### 8. ¿Se requiere historial completo de cambios?

**Contexto:** SPEC-001, SPEC-005 capturan versión y timestamps, pero no snapshots de cambios.

**Actual (supuesto):** NO. Solo timestamps de creación/actualización.

**Si responde SÍ:**
- [ ] Crear colección `cotizaciones_danos_history`
- [ ] Guardar snapshot en cada cambio
- [ ] Tracking de usuario que cambió
- [ ] Extender SPEC-005

**Si responde NO:**
- [ ] Confirmamos que timestamps + versión son suficientes
- [ ] Agregar historial en fase 2 si se requiere

**Recomendación:** Para auditoría, recomiendo historial. Pero puede ser fase 2.

---

### 9. ¿Dinero/precisión numérica es CRÍTICA?

**Contexto:** SPEC-003 redondea a 2 decimales (centavos MXN). Python float aceptable.

**Actual (supuesto):** Redondeo a 2 decimales. Python float + round() es suficiente.

**Si responde "SÍ" (crítica):**
- [ ] Usar `Decimal` en lugar de float
- [ ] Auditar cada operación aritmética
- [ ] Documentar estrategia de redondeo exacta
- [ ] Ejemplo: ROUND_HALF_UP vs otros

**Si responde "NO":**
- [ ] Confirmamos que float + round(x, 2) es aceptable
- [ ] Documentar en README

**Recomendación:** Para aplicaciones financieras, usar Decimal siempre.

---

### 10. ¿Integración POST-CÁLCULO con otro sistema?

**Contexto:** SPEC-003 termina en cálculo y persistencia. ¿Qué pasa después?

**Actual (supuesto):** Nada. Usuario ve resultado en frontend. No hay integración posterior.

**Si responde "SÍ":**
- [ ] Especificar: ¿A qué sistema? (emisión de póliza, órdenes, etc.)
- [ ] ¿Sincrónico o asincrónico?
- [ ] ¿Qué datos se envían?
- [ ] Agregar nuevo endpoint o evento

**Si responde "NO":**
- [ ] Confirmamos que cotizador es "final" en esta fase
- [ ] Integración en fase 2 o proyecto siguiente

**Recomendación:** Aclarar si esto es una herramienta standalone o parte de flujo mayor.

---

## ⚙️ Preguntas de Configuración (responder con valor específico)

### 11. ¿Margen comercial (%) es FIJO?

**Actual (supuesto):** 35% (0.35) en parámetros_calculo

**Respuesta esperada:** 
```
Margen comercial: ___% 
Puede variar por: [ ] Tipo de negocio [ ] Giro [ ] Zona [ ] No, es fijo
```

---

### 12. ¿Factor de zona catastrófica es FIJO?

**Actual (supuesto):** 1.5x si zona CAT, 1.0x si normal

**Respuesta esperada:**
```
Factor zona CAT: ___x
¿Depende de tipo de CAT (CATFHM, CATTEV)?: [ ] Sí [ ] No
```

---

### 13. ¿Recargo por antigüedad de construcción?

**Actual (supuesto):** Tabla de desvalorización:
- Antes de 1950: 1.5x
- 1951-1980: 1.2x
- 1981-2010: 1.0x
- Después 2010: 0.9x

**Respuesta esperada:**
```
¿Es correcta la tabla anterior?: [ ] Sí [ ] No, usar esta otra:
[tabla alternativa]
```

---

### 14. ¿Soporte para múltiples monedas?

**Actual (supuesto):** Solo MXN

**Respuesta esperada:**
```
¿Multi-moneda requerida?: [ ] Sí, estas: _______ [ ] No, solo MXN
```

---

### 15. ¿Soporte para múltiples aseguradores?

**Actual (supuesto):** No. Un solo asegurador.

**Respuesta esperada:**
```
¿Multi-asegurador requerida?: [ ] Sí [ ] No, un solo asegurador
Si sí, ¿cómo se selecciona?: [ ] Manual [ ] Por giro [ ] Por zona
```

---

## 📋 Checklist de Respuestas

**Imprimir y devolver con respuestas:**

```
Preguntas críticas:
[ ] 1. ¿Autenticación obligatoria?
[ ] 2. ¿Endpoints reales de catálogos?
[ ] 3. ¿Fórmula exacta o simplificada?
[ ] 4. ¿Se permiten ubicaciones incompletas?
[ ] 5. ¿Máximo de ubicaciones?
[ ] 6. ¿Máximo de suma asegurada?
[ ] 7. ¿Folio secuencial o aleatorio?
[ ] 8. ¿Historial de cambios?
[ ] 9. ¿Precisión numérica crítica?
[ ] 10. ¿Integración posterior?

Configuración:
[ ] 11. Margen comercial: ___%
[ ] 12. Factor zona CAT: __x
[ ] 13. Tabla antigüedad: ✓ / ✗
[ ] 14. Multi-moneda: [ ] Sí [ ] No
[ ] 15. Multi-asegurador: [ ] Sí [ ] No
```

---

## 📧 Envío de Respuestas

1. Responder todas las preguntas anterior
2. Enviar a: duversiro@gmail.com (email del spec-generator)
3. Asunto: "Respuestas a Preguntas - Cotizador de Daños"
4. Adjuntar: este documento completo con respuestas

---

## Impacto de Respuestas en Specs

| Respuesta | Impacto | Specs Afectadas |
|-----------|---------|-----------------|
| Autenticación obligatoria | Alto | SPEC-001, 002, 003, 004 |
| Endpoints reales | Medio | SPEC-002, 003, 005 |
| Fórmula exacta | Alto | SPEC-003 |
| Ubicaciones incompletas | Medio | SPEC-002, 003, 004 |
| Límite ubicaciones | Bajo | SPEC-002, 004 |
| Límite suma | Bajo | SPEC-002, 003 |
| Folio aleatorio | Bajo | SPEC-001, 005 |
| Historial | Bajo | SPEC-005 |
| Precisión Decimal | Bajo | SPEC-003, 005 |
| Integración posterior | Alto | (nueva SPEC-006) |
| Margen comercial | Bajo | SPEC-003, 005 |
| Factor zona | Bajo | SPEC-003, 005 |
| Multi-moneda | Medio | SPEC-001, 002, 003, 004 |
| Multi-asegurador | Medio | SPEC-001, 004 |

---

## Nota Importante

**Las specs SPEC-001 a SPEC-005 son funcionales con supuestos actuales.** Si las respuestas confirman los supuestos, pueden implementarse directamente. Si requieren cambios, se actualizarán solo las secciones afectadas.

**Esto permite iniciar implementación en paralelo mientras se espera clarificación en puntos específicos.**

---

**Documento listo para enviar al usuario**  
**Fecha:** 2026-04-17  
**Versión:** 1.0

