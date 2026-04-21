# Test Plan: Cotizador de Daños — Versión orientada a negocio

## 1. Objective
Describir qué se valida del producto desde la perspectiva del negocio: qué comportamientos del cotizador deben protegerse, qué riesgos se mitigan y qué evidencia se requiere para aceptar cambios.

## 2. Description
El sistema permite a un usuario (agente o comercial) crear y gestionar cotizaciones de seguros de daños: crear un folio, capturar datos del asegurado, definir ubicaciones de riesgo, seleccionar coberturas, ejecutar el cálculo de primas y obtener un resultado financiero con desglose por ubicación y alertas.

El valor de negocio: generar cotizaciones reproducibles y trazables que soporten decisiones comerciales (ofrecer primas correctas, evitar cotizaciones duplicadas y exponer alertas que eviten errores de cálculo).

## 3. Scope
### 3.1 In Scope (procesos de negocio cubiertos)
- Crear una nueva cotización (folio) y evitar duplicados por reenvío accidental: protege contra cotizaciones repetidas y pérdida de trazabilidad.
- Captura y actualización de Datos Generales del asegurado y del agente: protege la calidad de la información usada en cálculos y comunicación con el cliente.
- Configurar layout y registrar ubicaciones de riesgo (dirección, código postal, giro, garantías): permite desglosar riesgos por ubicación y calcular primas separadas.
- Validación de información crítica (ej.: código postal y giro): evita cálculos con datos invalidos y genera alertas funcionales para el usuario.
- Gestión de opciones de cobertura (activar/desactivar coberturas relevantes): permite simular distintas combinaciones comerciales.
- Ejecución del cálculo de prima por cotización y persistencia del resultado financiero (prima neta, prima comercial, primas por ubicación): asegura que el negocio tenga un resultado económico consistente.
- Consulta del estado de la cotización y presentación de alertas y desgloses al usuario.

### 3.2 Out of Scope (procesos no cubiertos por este plan)
- Autenticación y control de accesos avanzados (no implementados en la fase actual).
- Pruebas de rendimiento a escala (cargas, estrés) y pruebas de seguridad automatizadas.
- Integraciones con servicios externos en producción (el entorno de pruebas usa datos controlados por fixtures/semillas).

## 4. User Stories & Acceptance Criteria
| User Story | Acceptance Criteria | Valor de negocio protegido |
|---|---|---|
| HU-01 — Crear folio | El usuario obtiene un número de folio único; reenvíos con la misma clave devuelven el mismo folio. | Evita cotizaciones duplicadas y mantiene trazabilidad comercial. |
| HU-02 — Consultar/Actualizar datos generales | El usuario puede ver y actualizar datos; las actualizaciones parciales preservan campos no cambiados; conflicto de versión muestra mensaje instructivo. | Protege la integridad de la información y evita sobrescrituras concurrentes. |
| HU-07 — Definir layout | El usuario puede establecer cuántas ubicaciones tendrá la cotización y el sistema valida valores inválidos. | Facilita procesos comerciales y control de alcance de la cotización. |
| HU-08/09/10 — Registrar y editar ubicaciones | El usuario registra ubicaciones; el sistema valida CP y pinta alertas si faltan datos; puede editar campos individuales sin perder otros. | Asegura la calidad de los datos usados en el cálculo y evita errores operativos. |
| HU-11 — Resumen de ubicaciones | El usuario ve porcentaje de completitud y alertas por ubicaciones incompletas. | Permite priorizar acciones comerciales antes de calcular. |
| HU-12 — Calculo técnico | Ejecutar cálculo produce prima neta y comercial, desglose por ubicación y lista de ubicaciones omitidas con alertas claras. | Garantiza precios consistentes y visibilidad financiera para la venta. |

Cada criterio anterior está cubierto por pruebas automatizadas y flujos de aceptación que validan el comportamiento funcional descrito.

## 5. Test Scenarios
### 5.1 Positivos (comportamiento esperado)
- Crear una cotización con datos mínimos válidos → generar folio y estado inicial.
- Actualizar datos generales con la versión correcta → cambios aplicados y versión incrementada.
- Definir layout y registrar una ubicación completa (CP válido, giro con clave, garantía tarifable) → ubicación marcada como completa y lista para cálculo.
- Ejecutar cálculo con ubicaciones válidas → obtener prima neta, prima comercial y desglose por ubicación; prima comercial > prima neta (margen aplicado).
- Flujo de aceptación completo: crear folio → capturar datos → agregar ubicaciones (1 completa, 1 incompleta) → calcular → ver resultado y alertas.

### 5.2 Negativos (errores y validaciones)
- Crear cotización con agente inválido → operación rechazada con explicación al usuario.
- Intentar actualizar con versión desactualizada → operación rechazada y usuario informado para refrescar datos.
- Registrar ubicación con código postal no válido → la operación es rechazada y se muestra mensaje que indica el CP inválido.
- Ejecutar cálculo sin ubicaciones válidas → operación rechazada con mensaje que indica ausencia de ubicaciones calculables.

## 6. Test Strategy (cómo se valida el comportamiento)
### 6.1 Enfoque de validación
- Regla de oro: verificar que cada prueba mapea a un comportamiento observable por el usuario (ej.: mensaje, cambio de estado, número de folio, cálculo mostrado).
- Capas de validación:
	- Pruebas que verifican reglas de negocio de forma aislada (ej.: fórmula de cálculo, aplicación de factores, redondeo) para asegurar resultados numéricos correctos.
	- Pruebas que verifican la persistencia y consistencia de datos en operaciones de escritura (evitar pérdida o sobrescritura de información importante).
	- Pruebas de flujo de negocio de extremo a extremo que simulan la experiencia de un usuario (crear folio → capturar datos → registrar ubicaciones → calcular → ver resultado) para garantizar que los pasos combinados funcionan y que las alertas aparecen cuando corresponde.

### 6.2 Estrategia de datos de prueba
- Se usan conjuntos de datos controlados (catálogos y parámetros) que reproducen condiciones reales: agentes, giros, códigos postales, tarifas y parámetros de cálculo.
- El entorno de pruebas debe tener dichos datos cargados para reproducir los escenarios de aceptación (ej.: CP conocido que no es zona CAT, giros con clave de incendio, garantias tarifables).

## 7. Test Coverage (qué está cubierto y qué no)
- Cobertura alta (protege valor comercial central): cálculo de primas (fórmulas y consolidación), versionado optimista en escrituras, guardado de resultados financieros, validaciones de ubicaciones (CP, giro, garantías), respuestas de estado de cotización y alertas.
- Cobertura moderada: operaciones de layout y edición parcial de ubicaciones (existen pruebas funcionales que validan comportamiento principal y mensajes de error).
- Cobertura baja o ausente (gaps relevantes): pruebas de rendimiento bajo carga, pruebas de seguridad/penetración, y validación exhaustiva de todos los endpoints de catálogo desde la experiencia de usuario.

Impacto para el usuario:
- Lo que está cubierto protege que los precios mostrados y guardados sean consistentes y trazables.
- Lo que no está cubierto expone riesgo de regresiones en situaciones de alta carga, o problemas no detectados en integraciones externas y seguridad.

## 8. Risks (impacto de negocio y mitigaciones)
| Riesgo | Probabilidad (1-5) | Impacto (1-5) | Qué fallaría para el usuario | Mitigación propuesta |
|---:|---:|---:|---|---|
| Cálculo incorrecto de prima | 2 | 5 | Usuario recibe precio erróneo → pérdida financiera o reputación | Mantener pruebas numéricas, añadir validaciones adicionales y revisión de fórmulas antes de cambios en cálculo. |
| Actualizaciones perdidas por conflicto de versión | 3 | 4 | Cambios de usuario no aplicados, confusión operativa | Mensajes claros al usuario; procesos de reintento; aumentar cobertura de casos de concurrencia. |
| Datos maestros (CP/giros/garantías) desalineados | 3 | 4 | Cálculos omitidos o erróneos; cotizaciones bloqueadas | Asegurar dataset de pruebas sincronizado; controles de calidad de fixtures. |
| UI/flujo roto por cambios en la interfaz | 4 | 3 | Usuarios no pueden completar cotizaciones → pérdida de ventas | Ejecutar pruebas de aceptación críticas (smoke) en cada despliegue; mantener selectores estables y monitoreo. |
| Falta de pruebas de performance | 5 | 3 | Degradación en producción bajo carga → mala experiencia cliente | Planear pruebas de carga y establecer SLAs antes de despliegue en producción. |

## 9. Test Environment (descripción funcional)
- Ambiente funcionalmente equivalente a producción: API disponible, interfaz de usuario accesible y datos de prueba cargados (catálogos, tarifas, parámetros de cálculo).
- Para validar flujos de negocio es necesario disponer de:
	- Datos de catálogo reproducibles (agentes, giros, códigos postales, garantías, tarifas).
	- Un entorno donde se puedan ejecutar los escenarios de captura y cálculo sin afectar datos reales.
	- Acceso a un navegador para validar los flujos de aceptación manual o automatizados de UI.

## 10. Entry / Exit Criteria
- Entry (para iniciar validaciones de aceptación):
	- Conjunto de datos de prueba cargado y estable.
	- Todas las pruebas de reglas de negocio unitarias y de servicio pasan en local/integración.
	- Build del frontend desplegado en entorno de pruebas.
- Exit (para considerar listo un cambio):
	- Todas las pruebas automáticas que cubren reglas de negocio y flujos críticos pasan.
	- Escenario de aceptación principal (crear → capturar → ubicar → calcular) pasa sin defectos críticos.
	- No existen defectos bloqueantes abiertos que impidan operación básica de cotización.

## 11. Schedule & Agreements
- Antes de fusionar cambios que afecten cálculo o persistencia: ejecutar pruebas unitarias y las pruebas de aceptación críticas.
- Al detectar fallos en aceptación, abrir un ticket con prioridad adecuada y bloquear el despliegue hasta resolver casos críticos (cotización/cálculo/versionado).

## 12. Team
- Product / PO: valida criterios de negocio y acepta escenarios de aceptación.
- QA funcional: ejecuta escenarios de aceptación y reporta defectos de negocio.
- Equipo de desarrollo: mantiene reglas de negocio, corrige defectos y actualiza pruebas cuando se cambien requisitos.

## Notas finales y próximos pasos
- Estado actual: la mayor parte de la lógica de negocio crítica (cálculo, versionado, validaciones de ubicaciones) cuenta con pruebas automatizadas que verifican resultados observables por el usuario.
- Prioridad inmediata: automatizar smoke de aceptación para el flujo principal antes de cada despliegue; crear pruebas de rendimiento y añadir cobertura para endpoints de catálogo que hoy quedan con validación limitada.

Si el equipo desea, puedo adaptar este documento para incluir checklist de aceptación por release o convertir escenarios de negocio en casos de prueba detallados para QA funcional.
