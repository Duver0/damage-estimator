# Reto IA Center – Cotizador de Daños

**Status:** ACTIVO  
**Fecha máxima de entrega:** 2026-03-30 18:00  
**Metodología:** ASDD (Arquitectura, Spec, Desarrollo, Deployment)

---

## Objetivo

Construir una solución funcional para un **cotizador de daños** que permita capturar un folio, registrar información general, administrar ubicaciones de riesgo, calcular la prima neta/comercial y mostrar el resultado en una interfaz web.

---

## Contexto del Negocio

La solución representa un cotizador de seguros de daños compuesto por tres bloques:
- **cotizador-danos-web:** SPA para captura y consulta
- **plataforma-danos-back:** backend principal que administra la cotización
- **plataforma-core-ohs:** servicio de referencia con catálogos, tarifas, agentes, códigos postales y folios

**Flujo esperado:**
1. El usuario crea o recupera un folio.
2. Captura datos generales de la cotización.
3. Configura el layout y registra una o múltiples ubicaciones.
4. El backend consulta catálogos y tarifas técnicas.
5. El backend calcula la prima por ubicación y la prima total.
6. El frontend presenta alertas, estados y desglose financiero.

---

## Capacidades a Evaluar

- Diseño y construcción de backend
- Construcción de frontend
- Integración entre servicios
- Modelado de datos
- Manejo de reglas de negocio
- Calidad de código
- Pruebas unitarias y automatizadas
- Documentación técnica y operativa

---

## Alcance Funcional Obligatorio

### Backend - Endpoints Mínimos

```
POST   /v1/folios
GET    /v1/quotes/{folio}/general-info
PUT    /v1/quotes/{folio}/general-info
GET    /v1/quotes/{folio}/locations/layout
PUT    /v1/quotes/{folio}/locations/layout
GET    /v1/quotes/{folio}/locations
PUT    /v1/quotes/{folio}/locations
PATCH  /v1/quotes/{folio}/locations/{índice}
GET    /v1/quotes/{folio}/locations/summary
GET    /v1/quotes/{folio}/state
GET    /v1/quotes/{folio}/coverage-options
PUT    /v1/quotes/{folio}/coverage-options
POST   /v1/quotes/{folio}/calculate
```

### Frontend - Rutas Mínimas

- `/cotizador`
- `/quotes/{folio}/general-info`
- `/quotes/{folio}/locations`
- `/quotes/{folio}/technical-info`
- `/quotes/{folio}/terms-and-conditions`

### Funcionalidades Críticas

**Backend:**
- Crear folios con idempotencia
- Consultar y guardar datos generales
- Configurar layout de ubicaciones
- Registrar, consultar y editar ubicaciones
- Consultar estado de la cotización
- Gestionar opciones de cobertura
- Ejecutar cálculo de prima neta y comercial
- Persistir resultado financiero
- Manejar versionado optimista

**Frontend:**
- Crear o abrir folio
- Capturar datos generales
- Consultar suscriptores, agentes, giros y códigos postales
- Capturar y editar ubicaciones
- Visualizar progreso y estado
- Configurar cobertura
- Mostrar prima neta, comercial y desglose
- Mostrar alertas sin bloquear folio

---

## Reglas de Negocio

- Cotización identificada por `numeroFolio`
- Backend persiste como agregado principal
- Escrituras por actualización parcial
- Versión se incrementa al editar secciones funcionales
- `fechaUltimaActualizacion` se actualiza siempre
- Cálculo guarda `primaNeta`, `primaComercial`, `primasPorUbicacion` en una operación lógica
- Ubicación incompleta genera alerta pero no bloquea cálculo de otras
- Ubicación no se calcula sin: código postal válido, `giro.claveIncendio`, o garantías tarifables

---

## Dominio Mínimo

**Cotización:**
```
numeroFolio, estadoCotizacion, datosAsegurado, datosConduccion.codigoAgente,
clasificacionRiesgo, tipoNegocio, configuracionLayout, opcionesCobertura,
ubicaciones[], primaNeta, primaComercial, primasPorUbicacion[], version, metadatos
```

**Ubicación:**
```
índice, nombreUbicacion, direccion, codigoPostal, estado, municipio, colonia, ciudad,
tipoConstructivo, nivel, anioConstruccion, giro, giro.claveIncendio,
garantías[], zonaCatastrofica, alertasBloqueantes, estadoValidacion
```

---

## Integración con Servicios de Referencia

El backend consume o simula:

```
GET    /v1/subscribers
GET    /v1/agents
GET    /v1/business-lines
GET    /v1/zip-codes/{zipCode}
POST   /v1/zip-codes/validate
GET    /v1/folios
GET    /v1/catalogs/risk-classification
GET    /v1/catalogs/guarantees
GET|PUT /v1/tariffs
```

Se acepta stub, mock server o fixtures versionados con contrato documentado.

---

## Cálculo Técnico

El cálculo de prima debe:
1. Leer cotización completa por folio
2. Leer parámetros globales de cálculo
3. Resolver datos técnicos por ubicación
4. Determinar si ubicación es calculable o incompleta
5. Calcular prima por ubicación
6. Consolidar prima neta total
7. Derivar prima comercial total
8. Persistir resultado financiero

**Componentes técnicos:**
- Incendio edificios
- Incendio contenidos
- Extensión de cobertura
- CATTEV, CATFHM
- Remoción de escombros
- Gastos extraordinarios
- Pérdida de rentas
- BI, Equipo electrónico
- Robo, Dinero y valores
- Vidrios, Anuncios luminosos

**Nota:** Lógica consistente, trazable y documentada. No requiere fórmula actuarial exacta.

---

## Colecciones de Datos

- `cotizaciones_danos`
- `parametros_calculo`
- `tarifas_incendio`
- `tarifas_cat`
- `tarifa_fhm`
- `factores_equipo_electronico`
- `catalogo_cp_zonas`
- `dim_zona_tev`
- `dim_zona_fhm`

---

## Requerimientos de Pruebas

**Unitarias:** Cobertura mínima 80%
- Casos de uso del backend
- Validaciones de negocio
- Cálculo de prima
- Repositorios/adaptadores críticos
- Componentes/hooks clave del frontend
- Transformaciones y mapeos

**Automatizadas:** Mínimo 3 flujos críticos justificados
- Endpoints principales del backend
- Creación y actualización de folio
- Captura y edición de ubicaciones
- Ejecución del cálculo
- Manejo de ubicaciones incompletas
- Flujo principal del frontend

Se acepta: integración backend, contract tests, end-to-end, o combinación.

---

## Documentación Requerida

- Descripción de arquitectura
- Decisiones técnicas relevantes
- Instrucciones de instalación y ejecución
- Variables de entorno
- Contratos API
- Modelo de datos principal
- Explicación de lógica de cálculo
- Estrategia de pruebas
- Supuestos y limitaciones

---

## Entregables Obligatorios

✅ Todos los Specs ASDD generados  
✅ Video YouTube (máximo 10 min, modo oculto)  
✅ Repositorio GitLab Sofka  
✅ Pruebas unitarias  
✅ Pruebas automatizadas  
✅ README.md principal  
✅ Colección API (Postman/Bruno o equivalente)  
✅ Scripts de arranque local  
✅ Fixtures, mocks o semillas de datos  

**Opcionales:**
- docker-compose.yml
- Pipeline CI
- Cobertura de pruebas

---

## Escenario de Aceptación

1. Crear folio nuevo
2. Capturar datos generales
3. Definir layout de ubicaciones
4. Registrar 2+ ubicaciones (1 completa, 1 incompleta)
5. Configurar opciones de cobertura
6. Ejecutar cálculo
7. Ver prima calculada (ubicación válida)
8. Ver alerta (ubicación incompleta)
9. Consultar estado final del folio

---

## Criterios de Evaluación

- Claridad del modelado del dominio
- Separación entre capas y responsabilidades
- Calidad del código
- Consistencia de APIs y manejo de errores
- Experiencia de usuario en frontend
- Cobertura y calidad de pruebas
- Argumentación de flujos automatizados
- Trazabilidad del cálculo
- Calidad de la documentación
- Facilidad de ejecución local

---

## Restricciones y Supuestos

- Se aceptan stubs o mocks para integraciones externas
- Pueden simplificar autenticación si no es objetivo
- Priorizar claridad y trazabilidad sobre complejidad
- Fórmulas simplificadas deben estar documentadas
- Datos no entregados resolvirse con supuestos explícitos

---

**Entregable OBLIGATORIO:** Uso de metodología ASDD
