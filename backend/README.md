# Backend — Cotizador de Daños

## 1. Descripción del servicio
- Qué: API REST que gestiona cotizaciones de daños (folios), captura datos del asegurado y sus ubicaciones, valida catálogos locales y calcula primas técnicas y comerciales.
- Problema de negocio que resuelve: permite crear cotizaciones reproducibles, validar datos de ubicaciones, aplicar reglas tarifarias y producir una prima consolidada por cotización para tomar decisiones comerciales.

## 2. Arquitectura
- Estilo: Arquitectura por capas con inspiración hexagonal/clean — separación clara entre adaptadores (API), aplicación (servicios), dominio (modelos) e infraestructura (repositorios, DB).
- Capas y mapeo en el proyecto:
  - Adaptadores HTTP: `backend/main.py` y `backend/app/routes/*` — exponen la API y las dependencias.
  - Aplicación / Orquestación: `backend/app/services/*` — contiene la lógica de negocio (folios, ubicaciones, cálculo).
  - Infraestructura / Persistencia: `backend/app/repositories/*` — acceso a MongoDB (Motor) y catálogos.
  - Dominio / Validación: `backend/app/models/cotizacion_model.py` (Pydantic v2) — contratos entre capas.
  - Core: `backend/app/core/*` — configuración y conexión a la DB.
- Justificación de decisiones:
  - Async (FastAPI + Motor) para escalabilidad IO-bound y para poder atender múltiples cálculos/consultas concurrentes.
  - MongoDB (document DB) con ubicaciones embebidas para operaciones atómicas por cotización y consultas frecuentes por folio.
  - Separación servicios/repositorios facilita pruebas unitarias y reemplazo de infra (ej. mocks en tests).

## 3. Modelo de dominio
- `Cotización` (raíz): identificada por `numero_folio`. Contiene: datos del asegurado, datos de conducción (agente), opciones de cobertura, `ubicaciones` (lista embebida), resultados financieros (`prima_neta`, `prima_comercial`, `primas_por_ubicacion`) y `version` para concurrencia.
- `Ubicación`: pertenece a una cotización, tiene dirección, `codigo_postal`, `giro` (con `clave_incendio`), `tipo_constructivo`, `garantias` (cada una con `suma_asegurada`, `tasa`) y campos de auditoría/validación (`estado_validacion`, `alertas_bloqueantes`).
- Relación: one-to-many (Cotización → Ubicaciones) y decisión explícita de embebido: facilita lectura completa para cálculo y reduce roundtrips; adecuado porque el tamaño esperado por cotización es moderado y las operaciones se realizan por folio.

## 4. Flujo principal de negocio
1. Creación de folio: cliente solicita crear cotización; el servicio genera `numero_folio` con patrón `F<YYYYMMDD><5 dígitos>` y guarda metadata (incluye `idempotency_key` si se envía).
2. Captura de datos: se registran datos generales (asegurado, agente) y opciones de cobertura; cada escritura requiere enviar `version` para evitar sobrescrituras concurrentes.
3. Registro de ubicaciones: se define un `layout` (cantidad esperada) y se suben ubicaciones (array completo o parches individuales). Cada ubicación es validada contra catálogos (CP, giro, garantías) y se marca `COMPLETA` o `INCOMPLETA`.
4. Validaciones: validación de CP contra fixture local, presencia de `giro.claveIncendio` y al menos una garantía; las ubicaciones incompletas se almacenan pero se excluyen del cálculo.
5. Cálculo de prima: al invocar `/calculate` se ejecutan las fases de lectura de cotización y parámetros, se filtran ubicaciones válidas, se calcula prima por ubicación (por garantía) y se consolidan los totales.
6. Persistencia de resultados: los resultados financieros se escriben con versionado optimista (solo se actualizan campos financieros y `version`), evitando sobrescribir otras secciones capturadas por el usuario.

## 5. Reglas de negocio implementadas
- Idempotencia de folio: `create_folio` respeta `Idempotency-Key` y retorna el recurso existente si la clave ya fue usada.
- Versionado optimista: todas las operaciones de escritura esperan `version` y fallan con 409 si hay desalineamiento; la persistencia usa filtros que incluyen `version` para garantizar atomicidad lógica.
- Validación de ubicaciones: códigos postales y giros se validan contra catálogos locales; se reportan `alertas_bloqueantes` cuando faltan datos necesarios para tarificación.
- Manejo de ubicaciones incompletas: se permiten (no bloquean flujo), se almacenan con `estado_validacion = INCOMPLETA` y se listan en resúmenes; las ubicaciones incompletas son omitidas en el cálculo y generan alertas en el resultado.
- Persistencia parcial: las actualizaciones de secciones (datos generales, ubicaciones, resultado financiero) se realizan de forma granular y respetando `version` para minimizar colisiones y pérdida de datos de otras secciones.

## 6. Cálculo de prima
- Resumen de la lógica:
  - Se ejecuta un flujo en 8 fases (lectura, parámetros, validación, cálculo por ubicación, consolidación, margen, persistencia, reporte).
  - Para cada ubicación válida, la prima por garantía se calcula con la fórmula:

    Prima = SumaAsegurada × Tasa × FactorZona × FactorConstruccion × FactorGiro × (1 + RecargoCat)

  - La prima por ubicación es la suma de primas de sus garantías; la prima neta total es la suma de primas por ubicación; la prima comercial aplica un `margen_comercial` (por defecto 35%).
- Datos de soporte:
  - Tarifas por giro y tarifas CAT se consultan desde colecciones de catálogo (`tarifas_incendio`, `tarifas_cat`).
  - Parámetros (factores por construcción, factores de zona, recargos CAT, margen) provienen de `parametros_calculo`.
- Supuestos y fallbacks:
  - Si no existe tarifa en catálogo, se usa una tasa por defecto (implementación usa 0.005 como fallback).
  - Factor de zona para zonas catastróficas tiene valor por defecto (ej. 1.5) si el parámetro no está explícito.
  - Recargos CAT se aplican sólo si la cobertura CAT correspondiente está activa en la cotización.

## 7. Integraciones
- Catálogos y parámetros: no hay servicios externos en fase 1 — se usan fixtures en `backend/fixtures/*.json` (agentes, códigos postales, giros, tarifas, parámetros). Esto simplifica pruebas y despliegue local.
- Persistencia: MongoDB (acceso por Motor). En tests se utiliza `mongomock-motor` para simular la base de datos.
- Contratos: las colecciones clave son `cotizaciones_danos`, `parametros_calculo`, `tarifas_incendio`, `tarifas_cat`, y catálogos de CP/giros/garantías; los servicios respetan read/write parcial del documento raíz y el esquema definido en `cotizacion_model.py`.

## 8. API (endpoints principales)
- `POST /v1/folios` — Crear folio (acepta `Idempotency-Key` en header para idempotencia).
- `GET /v1/quotes/{folio}/general-info` — Obtener datos generales.
- `PUT /v1/quotes/{folio}/general-info` — Actualizar datos generales (se exige `version`).
- `PUT /v1/quotes/{folio}/locations/layout` — Definir layout (cantidad de ubicaciones esperadas).
- `PUT /v1/quotes/{folio}/locations` — Registrar/reemplazar array de ubicaciones (validación por CP y giro).
- `PATCH /v1/quotes/{folio}/locations/{indice}` — Editar ubicación individual (parcial).
- `GET /v1/quotes/{folio}/locations` — Listar ubicaciones.
- `GET /v1/quotes/{folio}/locations/summary` — Resumen de completitud y alertas.
- `PUT /v1/quotes/{folio}/coverage-options` — Actualizar coberturas activas.
- `POST /v1/quotes/{folio}/calculate` — Ejecutar cálculo de prima y persistir resultado financiero.

## 9. Estrategia de pruebas
- Cobertura del proyecto:
  - Tests unitarios para servicios y repositorios (`backend/tests/test_*_service.py`, `test_*_repository.py`).
  - Tests de integración para flujos críticos (ej. `test_calculo_integration.py`).
  - Tests de esquema/indexes (`test_db_schema_and_indexes.py`) y routers (`test_folios_router.py`).
- Herramientas: `pytest`, `pytest-asyncio`, `pytest-cov`, `mongomock-motor` para simular MongoDB.
- Cómo se valida la lógica crítica: idempotencia, versionado optimista (conflictos 409), validaciones de ubicaciones y el algoritmo de tarificación (aserciones sobre primas por ubicación y totales).

## 10. Instalación y ejecución
- Requisitos: Python 3.11+ (entorno virtual recomendado), MongoDB para ejecución real, Docker/Docker Compose opcional para despliegue local.
- Variables de entorno (archivo `.env` o env vars):
  - `MONGODB_URL` (por defecto `mongodb://localhost:27017`)
  - `MONGODB_DB_NAME` (por defecto `cotizador_danos`)
  - `APP_DEBUG` (opcional)
- Pasos rápidos (desarrollo local):
 1. Desde la raíz del repo: `cd backend`.
 2. Crear y activar un virtualenv, luego instalar dependencias:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. (Opcional) copiar `backend/.env.example` → `.env` y ajustar `MONGODB_URL` si es necesario.
4. Levantar la API:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

5. Ejecutar tests:

```bash
pytest -q
# o con cobertura
pytest --cov=backend -q
```

## 11. Supuestos y limitaciones
- No hay autenticación ni autorización (especificación del reto lo permitía en fase 1).
- Moneda única: MXN. No hay manejo multi-moneda.
- Catálogos son fixtures locales (facilita pruebas, pero en producción deberían reemplazarse por servicios de catálogo con contratos claros y versionado).
- Secuencia de folios se calcula como conteo de documentos por prefijo — esto puede causar race conditions en escenarios de alta concurrencia; en producción usar una colección de secuencias o un mecanismo atómico (e.g., counters o transacciones) sería preferible.
- No se usan transacciones distribuidas: las actualizaciones críticas usan versionado optimista; esto implica que bajo alta concurrencia puede requerirse lógica de reintento en cliente.

## 12. Cómo probar el flujo completo (mínimo reproducible)
1. Crear una cotización (`POST /v1/folios`) proporcionando datos del asegurado y `codigo_agente` válido en fixtures.
2. Definir layout si se desea (PUT layout) y luego subir ubicaciones completas (CP válido, `giro.claveIncendio`, al menos una garantía).
3. Revisar `GET /v1/quotes/{folio}/locations/summary` para verificar completitud.
4. Activar coberturas necesarias (ej. activar CAT si desea simular recargos).
5. Ejecutar `POST /v1/quotes/{folio}/calculate` y validar que `resultado_financiero.prima_neta` y `primas_por_ubicacion` reflejan las reglas descritas.

---

Archivos relevantes: [main.py](main.py), [app/models/cotizacion_model.py](app/models/cotizacion_model.py#L1), [app/services/calculo_service.py](app/services/calculo_service.py#L1), [fixtures](fixtures)
