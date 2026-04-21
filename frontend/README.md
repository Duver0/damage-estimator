# Frontend — Cotizador de Daños

## 1. Descripción de la aplicación
- Qué hace: SPA que guía al usuario por el flujo de cotización — crear/recuperar folio, completar datos generales, definir ubicaciones y coberturas, ejecutar la tarificación y mostrar el resultado.
- Problema de negocio: permite a agentes/operadores capturar información de riesgo y obtener una prima consolidada y trazable para decisiones comerciales.
- Usuarios: agentes comerciales, operadores de cotización y QA.

## 2. Flujo funcional del usuario
El frontend está diseñado para que un usuario avance de forma lineal y recuperable:

1. Crear o recuperar folio: el usuario crea una cotización (o abre una existente). Al crear, la app recibe `numero_folio` del backend y lo persiste en contexto/localStorage para navegación continua.
2. Capturar datos generales: completar datos del asegurado y agente; la UI valida campos obligatorios y envía actualizaciones al backend con `version` para concurrencia.
3. Configurar layout: definir cuántas ubicaciones se esperan (layout) y reservar el espacio para registro posterior.
4. Registrar y editar ubicaciones: el usuario añade ubicaciones en lote o edita una por una; cada ubicación incluye CP, giro, tipo constructivo y garantías.
5. Configurar coberturas: el usuario activa/desactiva coberturas relevantes (p.ej. CAT) antes del cálculo.
6. Ejecutar cálculo: con ubicaciones válidas, el usuario ejecuta la tarificación; la UI muestra progreso y el resultado consolidado.
7. Visualizar resultados: desglose por ubicación, componentes de cobertura, totales netos y comerciales, y alertas por ubicaciones omitidas.

El flujo soporta recuperación (abrir folio persistido) y reintentos cuando hay conflictos de versión.

## 3. Arquitectura del frontend
- Organización general:
  - `src/pages/` — pantallas que representan pasos del flujo (Dashboard, Cotizador, GeneralInfo, Locations, QuoteView).
  - `src/components/` — UI atómica y de presentación reutilizable (alertas, formularios, spinners).
  - `src/services/` — adaptadores HTTP que consumen la API (`/v1/*`) y centralizan headers y base URL.
  - `src/hooks/` — lógica de orquestación por dominio (useCotizacion, useUbicaciones, useCoberturas, useCalculo).
  - `src/contexts/` — estado global ligero (`CotizacionContext`) que persiste el `folio` en `localStorage`.
- Separación de responsabilidades: los `services` realizan llamadas HTTP, los `hooks` implementan la experiencia (retry, manejo de versiones, transformación mínima) y las `pages` componen la UI.
- Justificación: esta estructura facilita pruebas unitarias de la lógica (hooks/services) sin montar la UI, permite reusar las operaciones de negocio desde múltiples vistas y mantiene la responsabilidad de renderización en componentes sencillos.

## 4. Manejo de estado y sincronización
- Estado del folio: centralizado en `CotizacionContext` y persistido en `localStorage` para sobrevivir recargas. Archivo relevante: [frontend/src/contexts/CotizacionContext.jsx](frontend/src/contexts/CotizacionContext.jsx#L1).
- Estado por dominio: cada dominio (general, ubicaciones, coberturas, cálculo) usa un `hook` que mantiene `loading`, `error`, `data` y `version` localmente (`src/hooks/*`). Esto permite componentes simples y una fuente única de verdad para cada pantalla.
- Sincronización con backend:
  - Todas las operaciones de escritura envían `version` (proporcionada por el backend) y sustituyen el estado local con la respuesta del servidor.
  - En caso de `409` (conflicto por versionado), el hook propaga un error que la UI muestra y obliga a recargar el estado (getState) antes de reintentar.
- Estados intermedios: `loading`, `error`, `success` son expuestos por los hooks y materializados con componentes `LoadingSpinner` y `AlertBox` para feedback inmediato.

## 5. Validaciones y reglas en UI
- Validaciones realizadas por el frontend:
  - Presencia de campos obligatorios en formularios (nombre, CP, datos de agente básicos).
  - Formatos básicos (p.ej. longitud mínima, numericidad de algunos campos) para evitar roundtrips innecesarios.
- Validaciones delegadas al backend:
  - Validación del `codigo_postal` contra catálogo maestro y validación de `giro.claveIncendio` para tarificación.
  - Reglas de negocio críticas (por ejemplo, recalculo de factores, tarifas, y versión optimista) se realizan en backend.
- Manejo de datos incompletos:
  - El frontend permite guardar ubicaciones incompletas y muestra alertas no bloqueantes indicando qué falta.
  - Las ubicaciones incompletas se marcan visualmente y se excluyen del cálculo hasta que estén completas.

Ejemplo clave: una ubicación sin `giro.claveIncendio` se guarda pero la UI la marca como `INCOMPLETA` y muestra una alerta informativa; el usuario puede continuar capturando otras ubicaciones.

## 6. Manejo de errores y feedback al usuario
- Presentación de errores:
  - Mensajes precisos provenientes del backend son mostrados cuando están disponibles (`err.response.data.detail`).
  - Errores de red muestran mensaje genérico y opción de reintentar.
- Fallos de backend:
  - Conflictos de versión (`409`) disparan una notificación que indica recargar datos antes de reintentar.
  - Errores de validación (`400`) son mostrados junto a los formularios correspondientes.
- Retroalimentación de procesos:
  - Operaciones asíncronas (guardar, cargar, calcular) muestran `LoadingSpinner` y deshabilitan acciones críticas para evitar duplicados.

## 7. Integración con backend
- Consumo de la API: todos los `services` usan `axios` con `VITE_API_URL` configurado en el entorno. Archivos relevantes: [frontend/src/services/cotizacionService.js](frontend/src/services/cotizacionService.js#L1), [frontend/src/services/calculoService.js](frontend/src/services/calculoService.js#L1).
- Flujos que dependen del backend: creación de folio, lectura de estado, layout/ubicaciones, actualización de coberturas y ejecución de cálculo.
- Estrategia de manejo de respuestas:
  - El frontend asume que el backend es la fuente de verdad: después de cualquier escritura, el estado se sobreescribe con la respuesta del servidor (incluyendo `version`).
  - Errores de contrato (missing fields, invalid CP) se muestran y no permiten avanzar al cálculo.

## 8. Estrategia de pruebas
- Tipos de pruebas:
  - Unitarias: `vitest` + Testing Library para hooks y servicios (`src/__tests__/*`).
  - Integración visual/E2E: QA suite (carpeta `qa/`) contiene pruebas que recorren el flujo completo en un navegador controlado.
- Flujos críticos cubiertos: creación de folio (idempotencia), manejo de versiones en escrituras, registro/edición de ubicaciones y ejecución del cálculo.

## 9. Instalación y ejecución
- Requisitos: Node.js (>=18 recomendado), npm o yarn, backend disponible (local o remoto).
- Variables de entorno:
  - `VITE_API_URL` — URL base del backend (ej. `http://localhost:8000`).
- Pasos rápidos:

```bash
cd frontend
npm install
export VITE_API_URL=http://localhost:8000
npm run dev
```

Construir para producción:

```bash
npm run build
```

Pruebas unitarias:

```bash
npm run test
npm run test:coverage
```

## 10. Supuestos y limitaciones
- Supuestos:
  - No hay autenticación en esta fase; la app se usa en un entorno de confianza (agentes internos/QA).
  - El backend valida catálogos; el frontend hace validaciones ligeras para UX.
- Limitaciones:
  - Persistencia parcial: solo el `folio` se mantiene en localStorage; formularios intermedios no están completamente cacheados para trabajo offline.
  - UX en conflictos de versión es deliberadamente conservadora: se requiere recarga manual o reintentarlo tras sincronizar.

## 11. Cómo probar el flujo completo (desde UI)
1. Levantar backend localmente y asegurarse que `VITE_API_URL` apunta a él.
2. Levantar frontend (`npm run dev`) y abrir la SPA en el navegador.
3. Crear una cotización desde la pantalla principal; confirmar que se recibe `numero_folio` y que queda persistido.
4. Ir a Datos Generales; completar y guardar (verificar que la respuesta actualiza `version`).
5. Definir `layout` y agregar una ubicación completa (CP válido, `giro` con `claveIncendio`, al menos una garantía).
6. Revisar `Resumen de ubicaciones` y corregir alertas si hay ubicaciones incompletas.
7. Activar coberturas necesarias (si se necesita recargo CAT, activar CAT correspondiente).
8. Ejecutar `Calcular` y verificar que la vista de cotización muestra desglose por ubicación y totales (prima neta y comercial).

---

Archivos clave: [src/contexts/CotizacionContext.jsx](frontend/src/contexts/CotizacionContext.jsx#L1), [src/hooks/useCotizacion.js](frontend/src/hooks/useCotizacion.js#L1), [src/hooks/useUbicaciones.js](frontend/src/hooks/useUbicaciones.js#L1), [src/services/cotizacionService.js](frontend/src/services/cotizacionService.js#L1)
