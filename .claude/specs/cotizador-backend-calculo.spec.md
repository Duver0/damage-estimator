---
id: SPEC-003
status: IMPLEMENTED
feature: cotizador-backend-calculo
description: Cálculo de primas - endpoint de cálculo y lógica de tarificación por ubicación
created: 2026-04-17
updated: 2026-04-20
author: spec-generator
version: "1.0"
related-specs: ["SPEC-001", "SPEC-002"]
---

# Spec: Backend - Cálculo de Primas

> **Estado:** `APPROVED` ✅ Listo para implementación.

---

## 1. REQUERIMIENTOS

### Descripción

Este módulo orquesta el cálculo de prima neta y comercial para una cotización. Lee datos de ubicaciones, consulta parámetros de tarificación y catálogos, ejecuta el algoritmo de cálculo por ubicación, consolida resultados y persiste sin sobrescribir otras secciones del folio. Ubicaciones incompletas generan alertas pero no detienen el cálculo de ubicaciones válidas.

### Requerimiento de Negocio

El sistema debe permitir calcular la prima de seguros de daños mediante un algoritmo consistente que considere características de cada ubicación (giro, tipo constructivo, zona catastrófica, garantías) y aplique tarifas según parámetros de negocio. El backend debe persistir primas por ubicación, prima neta total y prima comercial (con margen), mientras mantiene la integridad de otros datos de la cotización.

### Historias de Usuario

#### HU-12: Ejecutar cálculo de prima

```
Como:        Usuario del sistema de cotización
Quiero:      Calcular la prima de una cotización basado en datos capturados
Para:        Obtener el valor financiero de la cobertura

Prioridad:   Alta
Estimación:  L
Dependencias: HU-01, HU-02, HU-03, HU-08, HU-05
Capa:        Backend
```

#### Criterios de Aceptación — HU-12

**Happy Path**
```gherkin
CRITERIO-12.1: Cálculo exitoso con ubicaciones completas
  Dado que:    existe folio "F12345" con 2 ubicaciones completas (suma: 1.5M)
  Cuando:      invoca POST /v1/quotes/{folio}/calculate
  Entonces:    recibe HTTP 200 con { primaNeta: X, primaComercial: Y, primasPorUbicacion: [ ... ], estado: "COTIZADA", version: 4 }
```

**Partial Path**
```gherkin
CRITERIO-12.2: Cálculo con ubicaciones mixtas (completas e incompletas)
  Dado que:    existe folio "F12345" con 2 ubicaciones (1 completa, 1 incompleta)
  Cuando:      invoca POST /v1/quotes/F12345/calculate
  Entonces:    recibe HTTP 200 con prima solo de ubicación completa, alerta de incompleta
```

**Error Path**
```gherkin
CRITERIO-12.3: Sin ubicaciones válidas para calcular
  Dado que:    existe folio "F12345" con 0 ubicaciones
  Cuando:      invoca POST /v1/quotes/F12345/calculate
  Entonces:    recibe HTTP 400 con { detail: "No hay ubicaciones válidas para calcular" }
```

```gherkin
CRITERIO-12.4: Parámetros de cálculo incompletos
  Dado que:    existen ubicaciones pero faltan parámetros de tarificación
  Cuando:      invoca POST /v1/quotes/F12345/calculate
  Entonces:    recibe HTTP 500 con { detail: "Parámetros de cálculo incompletos" }
```

### Reglas de Negocio

1. **Pasos del cálculo (8 fases):**
   - **Fase 1:** Leer cotización completa por folio
   - **Fase 2:** Leer parámetros globales de cálculo (`parametros_calculo`)
   - **Fase 3:** Validar que exista al menos 1 ubicación calculable (completa)
   - **Fase 4:** Para cada ubicación completa, resolver datos técnicos y tarifas
   - **Fase 5:** Calcular prima por ubicación (suma de garantías)
   - **Fase 6:** Consolidar prima neta total
   - **Fase 7:** Derivar prima comercial (aplicar margen)
   - **Fase 8:** Persistir en `primasPorUbicacion[]`, `primaNeta`, `primaComercial`, cambiar estado a "COTIZADA"

2. **Componentes técnicos tarificables:**
   - Incendio edificios
   - Incendio contenidos
   - Extensión de cobertura
   - CATTEV (CAT Terrestre)
   - CATFHM (CAT Fenómeno Hidrometeorológico)
   - Remoción de escombros
   - Gastos extraordinarios
   - Pérdida de rentas
   - Business Interruption (BI)
   - Equipo electrónico
   - Robo
   - Dinero y valores
   - Vidrios
   - Anuncios luminosos

3. **Fórmula de prima por garantía (simplificada):**
   ```
   Prima_Garantía = Suma_Asegurada × Tasa × Factor_Zona × Factor_Construcción × Factor_Giro × (1 + Recargo_CAT)
   ```
   Donde:
   - Suma_Asegurada: de la ubicación
   - Tasa: del catálogo de tarifas según garantía y giro
   - Factor_Zona: 1.0 (normal) o 1.5+ (si zona catastrófica)
   - Factor_Construcción: según tipo constructivo
   - Factor_Giro: según clave de incendio y riesgo
   - Recargo_CAT: si ubicación está en zona CAT

4. **Prima neta total:**
   ```
   Prima_Neta = SUM(Prima_Ubicación)
   ```

5. **Prima comercial:**
   ```
   Prima_Comercial = Prima_Neta × (1 + Margen_Comercial)
   ```
   Margen_Comercial viene de `parametros_calculo.margenComercial` (ej. 0.35 = 35%)

6. **Ubicaciones incompletas:** Se omiten del cálculo pero generan alerta informativa (no bloquean).

7. **Moneda:** Todos los cálculos en MXN. No se realiza conversión.

8. **Persistencia sin sobrescritura:**
   - El cálculo solo modifica: `primaNeta`, `primaComercial`, `primasPorUbicacion[]`, `estadoCotizacion` (a "COTIZADA"), `version` (+1)
   - NO modifica: `datosAsegurado`, `ubicaciones[]`, `opcionesCobertura`, etc.
   - Cada cálculo subsecuente reemplaza resultados anteriores.

9. **Trazabilidad:** Se almacenan fechas de último cálculo y parámetros utilizados en metadatos.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas

| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| `PrimasPorUbicacion` | incluido en `Cotizacion` | nueva | Detalle de prima por ubicación |
| `ResultadoFinanciero` | incluido en `Cotizacion` | nueva | Primas neta y comercial totales |
| `ParametrosCalculo` | `parametros_calculo` | consulta | Parámetros globales de tarificación |
| `TarifasIncendio` | `tarifas_incendio` | consulta | Tarifas de incendio por giro |
| `TarifasCAT` | `tarifas_cat` | consulta | Tarifas de cobertura CAT |

#### Sub-documento Prima por Ubicación

```json
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
    },
    {
      "cobertura": "INCENDIO_CONTENIDOS",
      "nombre": "Incendio - Contenidos",
      "sumaAsegurada": 250000,
      "tasa": 0.01,
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
```

#### Sub-documento Resultado Financiero

```json
{
  "primaNeta": 5000,
  "primaComercial": 6750,
  "margenAplicado": 0.35,
  "primasPorUbicacion": [ ... ],
  "totalUbicacionesCalculadas": 2,
  "totalUbicacionesOmitidas": 0,
  "metodologia": "Tarifas por giro y zona - v1.0",
  "fechaUltimoCalculo": "2026-04-17T11:00:00Z",
  "parametrosUtilizados": {
    "margenComercial": 0.35,
    "versionTarifas": "2026-01-01",
    "versionParametros": "1.0"
  }
}
```

#### Documento Parámetros Cálculo (colección `parametros_calculo`)

```json
{
  "_id": ObjectId,
  "codigoParametro": "PARAMS_DEFAULT_2026",
  "version": "1.0",
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

#### Documento Tarifa Incendio (ejemplo de `tarifas_incendio`)

```json
{
  "_id": ObjectId,
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

#### Campos del modelo - Prima por Ubicación

| Campo | Tipo | Obligatorio | Validación | Descripción |
|-------|------|-------------|------------|-------------|
| `ubicacionIndice` | integer | sí | >= 0 | Índice de ubicación |
| `primasComponentes[]` | array | sí | min 1 | Array de primas por garantía |
| `primasComponentes[].cobertura` | string | sí | válida | Código de cobertura |
| `primasComponentes[].sumaAsegurada` | number | sí | > 0 | Suma del riesgo |
| `primasComponentes[].tasa` | number | sí | >= 0 | Tasa base del catálogo |
| `primasComponentes[].factorZona` | number | sí | >= 0 | Factor por zona catastrófica |
| `primasComponentes[].factorConstruccion` | number | sí | >= 0 | Factor por tipo constructivo |
| `primasComponentes[].factorGiro` | number | sí | >= 0 | Factor por giro/clave incendio |
| `primasComponentes[].primaCalculada` | number | sí | >= 0 | Prima final de garantía |
| `primaNeta_Ubicacion` | number | sí | >= 0 | Suma de primas de garantías |
| `primaComercial_Ubicacion` | number | sí | >= 0 | Prima neta × (1 + margen) |
| `fechaCalculo` | datetime | sí | auto-generado | Timestamp del cálculo |

### API Endpoints

#### POST /v1/quotes/{folio}/calculate

- **Descripción:** Ejecuta el cálculo de prima para una cotización
- **Auth requerida:** no
- **Request Body:** (vacío, información viene de BD)
  ```json
  {}
  ```
- **Response 200 — Éxito:**
  ```json
  {
    "numeroFolio": "F202604170001",
    "estadoCotizacion": "COTIZADA",
    "resultadoFinanciero": {
      "primaNeta": 5000,
      "primaComercial": 6750,
      "margenAplicado": 0.35,
      "primasPorUbicacion": [
        {
          "ubicacionIndice": 0,
          "nombreUbicacion": "Casa Principal",
          "primasComponentes": [ ... ],
          "primaNeta_Ubicacion": 5000,
          "primaComercial_Ubicacion": 6750
        }
      ],
      "totalUbicacionesCalculadas": 1,
      "totalUbicacionesOmitidas": 1,
      "fechaUltimoCalculo": "2026-04-17T11:00:00Z"
    },
    "version": 4,
    "alertas": [
      {
        "tipo": "INCOMPLETO",
        "ubicacionIndice": 1,
        "mensaje": "Ubicación 2 omitida del cálculo: incompleta"
      }
    ]
  }
  ```
- **Response 400 — Sin ubicaciones:**
  ```json
  {
    "detail": "No hay ubicaciones válidas para calcular"
  }
  ```
- **Response 500 — Error de parámetros:**
  ```json
  {
    "detail": "Error: Parámetros de cálculo no encontrados o incompletos"
  }
  ```
- **Response 404:**
  ```json
  {
    "detail": "Folio no encontrado"
  }
  ```

### Diseño de Cálculo (Algoritmo de 8 Fases)

#### Fase 1: Leer Cotización

```python
# Lee cotización completa por numeroFolio
cotizacion = await repo.find_by_folio(folio)
if not cotizacion:
    raise NotFound("Folio no encontrado")
```

#### Fase 2: Leer Parámetros

```python
# Obtiene parámetros activos de cálculo
parametros = await repo_parametros.find_active()
if not parametros:
    raise InternalError("Parámetros de cálculo no disponibles")

margen = parametros['margenComercial']  # ej. 0.35
factores_construccion = parametros['factoresConstruccion']
# ... etc.
```

#### Fase 3: Validar Ubicaciones

```python
# Filtra ubicaciones calculables (estadoValidacion == "COMPLETA")
ubicaciones_validas = [u for u in cotizacion['ubicaciones'] if u['estadoValidacion'] == 'COMPLETA']

if not ubicaciones_validas:
    raise BadRequest("No hay ubicaciones válidas para calcular")
```

#### Fase 4: Resolver Datos Técnicos

```python
# Para cada ubicación válida:
for ubicacion in ubicaciones_validas:
    giro = ubicacion['giro']
    clave_incendio = giro['claveIncendio']
    cp = ubicacion['codigoPostal']
    zona_cat = ubicacion['zonaCatastrofica']
    
    # Obtiene tarifas del catálogo según giro
    tarifas = await repo_tarifas.find_by_giro_incendio(clave_incendio)
    if not tarifas:
        # Omitir o usar tasa default
        log.warning(f"Tarifa no encontrada para giro {clave_incendio}")
```

#### Fase 5: Calcular Prima por Ubicación

```python
# Para cada garantía en ubicación:
for garantia in ubicacion['garantias']:
    codigo_garantia = garantia['codigoGarantia']
    suma = garantia['sumaAsegurada']
    
    # Obtener tasa del catálogo
    tasa = tarifas[codigo_garantia].tasa
    
    # Aplicar factores
    factor_zona = 1.5 if zona_cat else 1.0
    factor_construccion = factores_construccion[tipo_constructivo]
    factor_giro = 1.0  # o derivado de claveIncendio
    
    # Calcular prima
    prima = suma * tasa * factor_zona * factor_construccion * factor_giro
    
    # Aplicar recargo CAT si procede
    if 'CATFHM' in coberturas_activas:
        prima *= (1 + parametros['recargosCAT']['CATFHM'])
    
    primasComponentes.append({
        'cobertura': codigo_garantia,
        'sumaAsegurada': suma,
        'tasa': tasa,
        'factorZona': factor_zona,
        'factorConstruccion': factor_construccion,
        'primaCalculada': prima
    })

prima_neta_ubicacion = sum(p['primaCalculada'] for p in primasComponentes)
prima_comercial_ubicacion = prima_neta_ubicacion * (1 + margen)
```

#### Fase 6: Consolidar Prima Neta Total

```python
prima_neta_total = sum(u['primaNeta_Ubicacion'] for u in primasPorUbicacion)
```

#### Fase 7: Derivar Prima Comercial

```python
prima_comercial_total = prima_neta_total * (1 + margen)
```

#### Fase 8: Persistir

```python
# Update cotización con resultado (sin sobrescribir otras secciones)
update_data = {
    'primaNeta': prima_neta_total,
    'primaComercial': prima_comercial_total,
    'primasPorUbicacion': primasComponentes_list,
    'estadoCotizacion': 'COTIZADA',
    'version': cotizacion['version'] + 1,
    'fechaUltimaActualizacion': datetime.utcnow()
}

await repo.update_resultado_financiero(folio, update_data)
```

### Arquitectura y Dependencias

#### Capas de Backend

```
routes/calculo_router.py
  ↓
services/calculo_service.py
  ↓
repositories/calculo_repository.py + repositorio de tarifas/parámetros
  ↓
MongoDB (cotizaciones_danos, parametros_calculo, tarifas_incendio, tarifas_cat, etc.)
```

#### Servicios y Repositorio

**`models/calculo_model.py`** — Schemas Pydantic:
- `PrimaComponente` — detalle de prima por garantía
- `PrimaUbicacion` — prima de una ubicación
- `ResultadoFinanciero` — resultado consolidado
- `CalculoResponse` — respuesta del endpoint

**`repositories/calculo_repository.py`** — acceso a datos:
- `async def get_parametros_activos() -> dict`
- `async def get_tarifas_por_giro(clave_incendio: str) -> dict`
- `async def get_tarifas_cat() -> dict`
- `async def update_resultado_financiero(folio: str, resultado: dict) -> dict`

**`services/calculo_service.py`** — lógica de cálculo (8 fases):
- `async def ejecutar_calculo(folio: str) -> ResultadoFinanciero`
  - Fase 1: leer cotización
  - Fase 2: leer parámetros
  - Fase 3: validar ubicaciones
  - Fase 4-7: calcular
  - Fase 8: persistir
- `async def calcular_prima_ubicacion(ubicacion: dict, parametros: dict, tarifas: dict) -> PrimaUbicacion`
- `async def aplicar_factores(tasa: float, zona_cat: bool, tipo_construccivo: str, ...) -> float`
- `async def consolidar_resultados(primas_ubicaciones: list, margen: float) -> ResultadoFinanciero`

**`routes/calculo_router.py`** — HTTP:
- POST /v1/quotes/{folio}/calculate

#### Dependencias

- **Catálogos internos:** Parámetros, tarifas de incendio, tarifas CAT (todas en MongoDB)
- **Fixtures/stubs:** Para tarifas si no existen en BD inicial
- **Motor async, Pydantic v2, FastAPI**

### Notas de Implementación

1. **Parámetros de cálculo:**
   - Guardar en colección `parametros_calculo`
   - Versión "1.0" inicial (puede evolucionarse)
   - Incluir: margen comercial, factores por construcción, factores por zona CAT

2. **Tarifas:**
   - Guardar en colecciones temáticas: `tarifas_incendio`, `tarifas_cat`, etc.
   - Indexar por `claveGiro`, `claveIncendio`, `cobertura` para búsquedas rápidas
   - Incluir fecha de vigencia (permite versiones de tarifas)

3. **Fórmula simplificada:** La implementación usa multiplicación de factores. Si se requiere fórmula más compleja, documentar en comentarios.

4. **Redondeo:** Redondear primas a 2 decimales (centavos MXN).

5. **Ubicaciones incompletas:** Se omiten pero se registran en alertas (no fallan el cálculo).

6. **Idempotencia de cálculo:** Si se calcula 2 veces, sobrescribe resultados previos (no suma).

7. **Trazabilidad:** Se almacenan parámetros utilizados en metadatos para auditoría.

---

## 3. LISTA DE TAREAS

### Backend

#### Implementación

- [ ] Crear `models/calculo_model.py` con schemas: `PrimaComponente`, `PrimaUbicacion`, `ResultadoFinanciero`, `CalculoResponse`
- [ ] Crear `repositories/calculo_repository.py` con acceso a parámetros, tarifas y actualización de resultados
- [ ] Crear `services/calculo_service.py` con 8 fases del algoritmo
- [ ] Crear `routes/calculo_router.py` con endpoint POST /v1/quotes/{folio}/calculate
- [ ] Registrar router en punto de entrada
- [ ] Crear fixtures de parámetros de cálculo (margen comercial, factores)
- [ ] Crear fixtures de tarifas de incendio (por giro)
- [ ] Crear fixtures de tarifas CAT (CATFHM, CATTEV)
- [ ] Implementar cálculo de factores por zona catastrófica
- [ ] Implementar cálculo de factores por tipo constructivo
- [ ] Implementar aplicación de recargos CAT
- [ ] Implementar consolidación de resultados
- [ ] Implementar persistencia sin sobrescritura de otras secciones

#### Tests Backend

- [ ] `test_calculo_service_ejecutar_exitoso_ubicaciones_completas` — cálculo exitoso
- [ ] `test_calculo_service_ejecutar_ubicaciones_mixtas` — cálculo con incompletas (omitidas)
- [ ] `test_calculo_service_sin_ubicaciones_validas` — retorna 400
- [ ] `test_calculo_service_parametros_faltantes` — retorna 500
- [ ] `test_calculo_service_calcular_prima_ubicacion` — cálculo de una ubicación
- [ ] `test_calculo_service_aplicar_factores_zona_cat` — factor zona catastrófica
- [ ] `test_calculo_service_aplicar_factores_construccion` — factor tipo constructivo
- [ ] `test_calculo_service_aplicar_recargo_cat` — recargo CATFHM/CATTEV
- [ ] `test_calculo_service_consolidar_resultados` — consolidación neta y comercial
- [ ] `test_calculo_service_redondeo_primas` — primas redondeadas a 2 decimales
- [ ] `test_calculo_service_persistencia_no_sobrescribe_ubicaciones` — ubicaciones no se modifican
- [ ] `test_calculo_service_incrementa_version` — version se incrementa
- [ ] `test_calculo_repo_parametros_activos` — obtener parámetros
- [ ] `test_calculo_repo_tarifas_por_giro` — obtener tarifas por giro
- [ ] `test_calculo_router_post_200_ubicaciones_validas` — endpoint retorna 200
- [ ] `test_calculo_router_post_400_sin_ubicaciones` — endpoint retorna 400

### Frontend

- [ ] (Dependencia: spec-cotizador-frontend-main.spec.md)
- [ ] En página de cálculo, capturar trigger para calcular
- [ ] Mostrar resultado de prima neta y comercial
- [ ] Mostrar desglose por ubicación
- [ ] Mostrar alertas de ubicaciones omitidas

### QA

- [ ] Ejecutar skill `/gherkin-case-generator` con criterios CRITERIO-12.1 a 12.4
- [ ] Ejecutar skill `/risk-identifier` — riesgos de cálculo y precisión
- [ ] Validar cobertura de tests en todas las 8 fases
- [ ] Prueba manual: crear folio, capturar datos, definir ubicaciones, calcular, verificar primas
- [ ] Validar que ubicaciones incompletas se omiten pero no bloquean
- [ ] Validar que trazabilidad de parámetros se persiste

---

## Supuestos Confirmados ✅

1. **Fórmula de prima:** SIMPLIFICADA y DEMOSTRATIVA (no requiere validación actuarial).
   ```
   Prima = Suma × Tasa × FactorZona × FactorConstruccion × FactorGiro × (1 + RecargoCat)
   ```

2. **Margen comercial:** FIJO en 35% (0.35) en parametros_calculo. Prima_Comercial = Prima_Neta × 1.35

3. **Factor zona CAT:** FIJO en 1.5x si `zonaCatastrofica: true`, 1.0x si false.

4. **Parámetros:** Un solo set activo (`parametros_calculo.activo: true`). Sin versioning de parámetros en fase 1.

5. **Tarifas por giro:** Una tarifa por claveIncendio/claveGiro. Sin matriz multidimensional.

6. **Redondeo:** A 2 decimales (centavos MXN) con `round(x, 2)`. Precision float aceptable.

7. **Moneda:** Solo MXN. Sin conversión, sin multi-moneda.

8. **Ubicaciones incompletas:** Omitidas del cálculo pero documentadas en alertas. No bloquean.

9. **Integración posterior:** NO hay integración a otros sistemas. Cotizador es standalone.

---

