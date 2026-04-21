---
id: SPEC-004
status: IMPLEMENTED
feature: cotizador-frontend-main
description: Flujo principal de cotización - rutas, páginas, componentes y estado de la aplicación
created: 2026-04-17
updated: 2026-04-20
author: spec-generator
version: "1.0"
related-specs: ["SPEC-001", "SPEC-002", "SPEC-003"]
---

# Spec: Frontend - Flujo Principal de Cotización

> **Estado:** `APPROVED` ✅ Listo para implementación.

---

## 1. REQUERIMIENTOS

### Descripción

Este módulo implementa la interfaz web del cotizador de daños. Comprende 5 rutas principales (crear folio, general-info, ubicaciones, technical-info, términos), gestión de estado de la aplicación, validación en tiempo real, manejo de alertas y visualización del progreso de cotización. El frontend consume la API backend y mantiene experiencia fluida para el usuario.

### Requerimiento de Negocio

El sistema debe ofrecer una interfaz intuitiva que guíe al usuario a través de los pasos del cotizador (crear folio, capturar datos, definir ubicaciones, configurar cobertura, ver resultado). El frontend valida entrada, muestra alertas sin bloquear, visualiza progreso y permite navegar entre secciones. Debe consumir datos de catálogos en tiempo real (agentes, códigos postales, giros) y presentar resultados de forma clara.

### Historias de Usuario

#### HU-13: Crear o abrir un folio

```
Como:        Usuario de cotización
Quiero:      Crear un folio nuevo o abrir uno existente
Para:        Iniciar o continuar con una cotización

Prioridad:   Alta
Estimación:  M
Dependencias: Ninguna
Capa:        Frontend
```

#### Criterios de Aceptación — HU-13

**Happy Path**
```gherkin
CRITERIO-13.1: Crear folio nuevo exitosamente
  Dado que:    estoy en /cotizador
  Cuando:      completo formulario de datos generales y hago clic en "Crear"
  Entonces:    se crea folio, obtengo numeroFolio y navegó a /quotes/{folio}/general-info
```

**Edge Case**
```gherkin
CRITERIO-13.2: Reabrir folio existente
  Dado que:    tengo un numeroFolio previo
  Cuando:      ingreso el folio en campo de búsqueda y hago clic en "Abrir"
  Entonces:    cargo datos del folio y navego a su página de general-info
```

#### HU-14: Capturar datos generales

```
Como:        Usuario de cotización
Quiero:      Ingresar información del asegurado y conducción
Para:        Registrar quién es el cliente y su agente

Prioridad:   Alta
Estimación:  M
Dependencias: HU-13
Capa:        Frontend
```

#### Criterios de Aceptación — HU-14

**Happy Path**
```gherkin
CRITERIO-14.1: Guardar datos generales exitosamente
  Dado que:    estoy en /quotes/{folio}/general-info
  Cuando:      completo nombre, tipo de ID, agente, tipo de negocio y hago clic en "Guardar"
  Entonces:    se persisten datos, veo confirmación y puedo navegar a ubicaciones
```

**Validation**
```gherkin
CRITERIO-14.2: Validación de campos requeridos
  Dado que:    estoy en /quotes/{folio}/general-info
  Cuando:      intento guardar con campos vacíos
  Entonces:    veo errores de validación y no se guarda
```

#### HU-15: Configurar ubicaciones

```
Como:        Usuario de cotización
Quiero:      Definir el layout y capturar datos de ubicaciones
Para:        Registrar dónde están los riesgos a asegurar

Prioridad:   Alta
Estimación:  L
Dependencias: HU-14
Capa:        Frontend
```

#### Criterios de Aceptación — HU-15

**Happy Path**
```gherkin
CRITERIO-15.1: Definir layout de ubicaciones
  Dado que:    estoy en /quotes/{folio}/locations
  Cuando:      defino "Cantidad de ubicaciones: 2" y hago clic en "Siguiente"
  Entonces:    se guarda layout y me permite capturar ubicaciones
```

```gherkin
CRITERIO-15.2: Capturar ubicación completa
  Dado que:    tengo layout de 2 ubicaciones
  Cuando:      ingreso datos de ubicación 1 (dirección, CP, giro, garantías) y hago "Guardar"
  Entonces:    se persiste ubicación, veo confirmación "Ubicación 1 completa", puedo capturar la siguiente
```

**Validation & Alerts**
```gherkin
CRITERIO-15.3: Alerta de ubicación incompleta
  Dado que:    capturé ubicación sin código postal
  Cuando:      intento avanzar sin llenar CP
  Entonces:    veo alerta "Código postal requerido" pero puedo continuar si esa no es la última ubicación
```

#### HU-16: Configurar cobertura

```
Como:        Usuario de cotización
Quiero:      Seleccionar qué coberturas aplicar
Para:        Personalizar la cobertura del riesgo

Prioridad:   Media
Estimación:  S
Dependencias: HU-15
Capa:        Frontend
```

#### Criterios de Aceptación — HU-16

**Happy Path**
```gherkin
CRITERIO-16.1: Activar/desactivar coberturas
  Dado que:    estoy en /quotes/{folio}/technical-info (coberturas)
  Cuando:      activo "CATFHM" y desactivo "CATTEV", luego hago "Guardar"
  Entonces:    se persisten selecciones y veo confirmación
```

#### HU-17: Ver resultado de cálculo

```
Como:        Usuario de cotización
Quiero:      Ver la prima calculada (neta y comercial)
Para:        Conocer el costo de la cobertura

Prioridad:   Alta
Estimación:  M
Dependencias: HU-15, HU-16
Capa:        Frontend
```

#### Criterios de Aceptación — HU-17

**Happy Path**
```gherkin
CRITERIO-17.1: Calcular y mostrar primas
  Dado que:    completé datos generales y ubicaciones
  Cuando:      hago clic en "Calcular Prima"
  Entonces:    se ejecuta cálculo, veo prima neta, prima comercial y desglose por ubicación
```

**Partial Success**
```gherkin
CRITERIO-17.2: Mostrar resultado parcial con alertas
  Dado que:    tengo 2 ubicaciones (1 completa, 1 incompleta)
  Cuando:      hago clic en "Calcular Prima"
  Entonces:    veo prima de ubicación 1, alerta "Ubicación 2 no se calculó: incompleta", pero el flujo no se bloquea
```

#### HU-18: Ver estado y progreso

```
Como:        Usuario de cotización
Quiero:      Ver qué secciones están completas y cuáles faltan
Para:        Saber qué me falta completar

Prioridad:   Media
Estimación:  S
Dependencias: Todas las anteriores
Capa:        Frontend
```

#### Criterios de Aceptación — HU-18

**Happy Path**
```gherkin
CRITERIO-18.1: Mostrar progreso del cotizador
  Dado que:    estoy en cualquier página del cotizador
  Cuando:      miro la barra de progreso o panel lateral
  Entonces:    veo qué secciones están completadas, pendientes y en progreso
```

### Reglas de Negocio

1. **Flujo de rutas:**
   - `/cotizador` — Landing page para crear/abrir folio
   - `/quotes/{folio}/general-info` — Captura de datos generales
   - `/quotes/{folio}/locations` — Configuración de layout y ubicaciones
   - `/quotes/{folio}/technical-info` — Configuración de coberturas
   - `/quotes/{folio}/terms-and-conditions` — Términos y resultado final (opcional en fase 1)

2. **Validación en tiempo real:**
   - Campos requeridos se validan al salir del campo (onBlur)
   - Código postal se valida contra catálogo async
   - Agente se valida contra catálogo async
   - Errores se muestran en rojo debajo del campo

3. **Alertas no bloqueantes:**
   - Ubicaciones incompletas muestran alerta pero permiten navegar
   - Cálculo con ubicaciones incompletas muestra desglose parcial + alertas
   - Usuario puede continuar o resolver alertas

4. **Estado de la aplicación:**
   - Mantener folio actual en estado (Context API o similar)
   - Sincronizar con API backend
   - Permitir refresco de página sin perder folio

5. **Catálogos dinámicos:**
   - Agentes: autocomplete desde endpoint
   - Códigos postales: búsqueda y validación async
   - Giros: selector desde catálogo
   - Garantías: checkbox múltiple

6. **Respuesta de error del backend:**
   - 400 → mostrar detalle en modal de error
   - 409 → mostrar "Datos desactualziados, recargando..."
   - 500 → mostrar "Error del servidor, intentando de nuevo..."

7. **Loading states:**
   - Mostrar spinner/loader mientras se carga desde API
   - Botones deshabilitados mientras se envía request
   - Tiempo máximo de espera 30 segundos antes de timeout

---

## 2. DISEÑO

### Componentes Frontend

#### Páginas principales

| Página | Archivo | Ruta | Descripción |
|--------|---------|------|-------------|
| `CotizadorPage` | `pages/CotizadorPage.jsx` | `/cotizador` | Landing - crear/abrir folio |
| `GeneralInfoPage` | `pages/GeneralInfoPage.jsx` | `/quotes/{folio}/general-info` | Datos asegurado y conducción |
| `LocationsPage` | `pages/LocationsPage.jsx` | `/quotes/{folio}/locations` | Layout y ubicaciones |
| `TechnicalInfoPage` | `pages/TechnicalInfoPage.jsx` | `/quotes/{folio}/technical-info` | Coberturas y cálculo |
| `TermsAndConditionsPage` | `pages/TermsAndConditionsPage.jsx` | `/quotes/{folio}/terms-and-conditions` | Términos y confirmación (opcional) |

#### Componentes reutilizables

| Componente | Archivo | Props | Descripción |
|------------|---------|-------|-------------|
| `HeaderNav` | `components/HeaderNav.jsx` | `folio, estasCompleto` | Navegación y progreso |
| `ProgressBar` | `components/ProgressBar.jsx` | `currentStep, totalSteps` | Barra de progreso |
| `InputField` | `components/InputField.jsx` | `label, value, onChange, error, placeholder` | Campo de entrada con validación |
| `SelectField` | `components/SelectField.jsx` | `label, options, value, onChange, loading` | Selector con búsqueda |
| `CheckboxField` | `components/CheckboxField.jsx` | `label, checked, onChange` | Checkbox simple |
| `AlertBox` | `components/AlertBox.jsx` | `type, message, onClose` | Alerta deslizable |
| `ConfirmModal` | `components/ConfirmModal.jsx` | `isOpen, title, message, onConfirm, onCancel` | Modal de confirmación |
| `LoadingSpinner` | `components/LoadingSpinner.jsx` | `visible, message` | Spinner de carga |
| `LocationCard` | `components/LocationCard.jsx` | `location, index, onEdit, onDelete, isComplete` | Tarjeta de ubicación |
| `CoverageCheckbox` | `components/CoverageCheckbox.jsx` | `coverage, checked, onChange` | Checkbox de cobertura |
| `PriceBreakdown` | `components/PriceBreakdown.jsx` | `primaNeta, primaComercial, desglose` | Desglose de precio |

### Hooks y State Management

#### Hooks principales

| Hook | Archivo | Retorna | Descripción |
|------|---------|---------|-------------|
| `useCotizacion` | `hooks/useCotizacion.js` | `{ folio, datos, loading, error, crear, actualizar, getState }` | Estado general de cotización |
| `useGeneralInfo` | `hooks/useGeneralInfo.js` | `{ datosAsegurado, datosConduccion, loading, guardar, error }` | Estado de general-info |
| `useUbicaciones` | `hooks/useUbicaciones.js` | `{ ubicaciones, layout, loading, setLayout, agregarUbicacion, editarUbicacion, getResumen }` | Estado de ubicaciones |
| `useCoberturas` | `hooks/useCoberturas.js` | `{ coberturas, loading, actualizar }` | Estado de coberturas |
| `useCalculo` | `hooks/useCalculo.js` | `{ primaNeta, primaComercial, desglose, loading, error, calcular }` | Estado y cálculo de prima |
| `useAgentes` | `hooks/useAgentes.js` | `{ agentes, loading, buscar }` | Búsqueda de agentes |
| `useCatalogos` | `hooks/useCatalogos.js` | `{ giros, garantias, tiposConstructivos, loading }` | Catálogos estáticos |

#### Context API

**`contexts/CotizacionContext.jsx`**
- Proveedor global para folio actual
- Métodos: `setFolio`, `getFolio`, `limpiar`
- Consumido por todas las páginas

### Services (API Calls)

#### Servicios principales

| Servicio | Archivo | Métodos | Descripción |
|----------|---------|---------|-------------|
| `cotizacionService` | `services/cotizacionService.js` | `crear(datos)`, `obtener(folio)`, `actualizar(folio, datos)`, `getState(folio)` | CRUD de cotizaciones |
| `generalInfoService` | `services/generalInfoService.js` | `obtener(folio)`, `actualizar(folio, datos)` | General-info |
| `ubicacionesService` | `services/ubicacionesService.js` | `setLayout(folio, cantidad)`, `agregarUbicaciones(folio, ubicaciones)`, `editarUbicacion(folio, indice, datos)`, `obtenerResumen(folio)` | Ubicaciones |
| `coberturasService` | `services/coberturasService.js` | `obtener(folio)`, `actualizar(folio, opciones)` | Coberturas |
| `calculoService` | `services/calculoService.js` | `ejecutar(folio)` | Cálculo de prima |
| `catalogosService` | `services/catalogosService.js` | `obtenerAgentes()`, `obtenerGiros()`, `obtenerGarantias()`, `validarCodigoPostal(cp)` | Catálogos |

#### Patrón de servicio

```javascript
// services/cotizacionService.js
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL;

export async function crearCotizacion(datos, token) {
  const res = await axios.post(`${API_BASE}/v1/folios`, datos, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function obtenerGeneralInfo(folio, token) {
  const res = await axios.get(`${API_BASE}/v1/quotes/${folio}/general-info`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
```

### Layout de Páginas

#### CotizadorPage (`/cotizador`)

```
┌─────────────────────────────────────────┐
│  Logo | Cotizador de Daños              │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ Crear Folio Nuevo ──────────────┐  │
│  │ Nombre: [ _____________ ]        │  │
│  │ Email:  [ _____________ ]        │  │
│  │         [ Crear ]                │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ─ O ─ ABRE UNO EXISTENTE ─            │
│                                         │
│  ┌─ Folio: [ _____________ ]  [ Abrir ]│
│  └─────────────────────────────────────┘
│                                         │
└─────────────────────────────────────────┘
```

#### GeneralInfoPage (`/quotes/{folio}/general-info`)

```
┌──────────────────────────────────────────────┐
│ ◄ Atrás | FOLIO F202604170001 | Ayuda       │
├────────────────────── ─────────────────────┤
│                                             │
│ ✓ Crear Folio | ■ Datos Generales | ...    │ ← Progreso
│                                             │
│ DATOS DEL ASEGURADO                         │
│ Nombre: [ Juan Pérez _________ ]            │
│ Email:  [ juan@example.com ___ ]            │
│ RFC:    [ JPL820415HGT... ____ ]            │
│                                             │
│ DATOS DE CONDUCCIÓN                         │
│ Agente: [ ▼ Agente Premium... ]  [Buscar]  │
│ Tipo Negocio: [ ▼ COMERCIAL ]               │
│                                             │
│ [Atrás] [ Siguiente → ]                     │
│                                             │
└──────────────────────────────────────────────┘
```

#### LocationsPage (`/quotes/{folio}/locations`)

```
┌────────────────────────────────────────────┐
│ ◄ Atrás | Ubicaciones | Ayuda              │
├─────────────────────────────────────────────┤
│                                             │
│ ✓ ... | ✓ General-Info | ■ Ubicaciones     │
│                                             │
│ CONFIGURAR LAYOUT                           │
│ Cantidad de ubicaciones: [ 2 ]              │
│                                             │
│ UBICACIONES CAPTURADAS                      │
│                                             │
│ ┌─ Ubicación 1 (COMPLETA) ───────────────┐ │
│ │ Casa Principal                          │ │
│ │ Dirección: Calle Principal 123         │ │
│ │ CP: 28001 | Estado: MADRID              │ │
│ │ Giro: Oficinas administrativas         │ │
│ │ [ Editar ] [ Eliminar ]                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─ Ubicación 2 (INCOMPLETA ⚠️) ──────────┐ │
│ │ Bodega | Dirección: ... | CP: ❌       │ │
│ │ [ Editar ] [ Eliminar ]                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [+ Agregar ubicación]                       │
│                                             │
│ [Atrás] [ Siguiente → ]                     │
│                                             │
└────────────────────────────────────────────┘
```

#### TechnicalInfoPage (`/quotes/{folio}/technical-info`)

```
┌────────────────────────────────────────────┐
│ ◄ Atrás | Técnico y Cobertura | Ayuda      │
├────────────────────────────────────────────┤
│                                             │
│ ✓ ... | ■ Técnico | ...                    │
│                                             │
│ SELECCIONAR COBERTURAS                      │
│ ☑️  Incendio Edificios                      │
│ ☑️  Incendio Contenidos                     │
│ ☐   CATFHM (CAT Fenómeno Hidro...)         │
│ ☐   CATTEV (CAT Terrestre)                 │
│ ☐   Robo                                    │
│                                             │
│ [ Calcular Prima ]                          │
│                                             │
│ ─────────────────────────────────────────   │
│                                             │
│ RESULTADO DEL CÁLCULO                       │
│ Prima Neta:       $5,000.00                 │
│ Margen (35%):     $1,750.00                 │
│ Prima Comercial:  $6,750.00                 │
│                                             │
│ DESGLOSE POR UBICACIÓN                      │
│ Casa Principal:  $5,000 neta | $6,750 com. │
│                                             │
│ [Atrás] [ Términos y Confirmación → ]       │
│                                             │
└────────────────────────────────────────────┘
```

### Manejo de Errores y Validación

#### Validaciones en cliente

- **Campos requeridos:** Rojo + "Campo requerido"
- **Formato de email:** Validación regex + "Email inválido"
- **Código postal:** Async + "CP no válido en catálogo"
- **Agente:** Async + "Agente no encontrado"
- **Suma de ubicaciones:** vs layout definido

#### Manejo de errores de API

```javascript
if (response.status === 400) {
  mostrarAlerta('error', response.data.detail);
} else if (response.status === 409) {
  mostrarAlerta('warning', 'Datos desactualziados. Recargando...');
  recargarDatos();
} else if (response.status === 500) {
  mostrarAlerta('error', 'Error del servidor. Reintentando...');
  reintentar();
}
```

### Configuración de Routing

```javascript
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/cotizador" element={<CotizadorPage />} />
        <Route path="/quotes/:folio/general-info" element={<GeneralInfoPage />} />
        <Route path="/quotes/:folio/locations" element={<LocationsPage />} />
        <Route path="/quotes/:folio/technical-info" element={<TechnicalInfoPage />} />
        <Route path="/quotes/:folio/terms-and-conditions" element={<TermsAndConditionsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### CSS Modules

- **HeaderNav.module.css** — estilos del header
- **CotizadorPage.module.css** — estilos página cotizador
- **GeneralInfoPage.module.css** — formulario datos generales
- **LocationsPage.module.css** — vista de ubicaciones
- **TechnicalInfoPage.module.css** — vista técnica
- **InputField.module.css** — estilos campos reutilizables
- **AlertBox.module.css** — alertas
- **etc.**

---

## 3. LISTA DE TAREAS

### Frontend

#### Implementación - Páginas

- [ ] Crear `pages/CotizadorPage.jsx` + `.module.css` — landing crear/abrir folio
- [ ] Crear `pages/GeneralInfoPage.jsx` + `.module.css` — captura datos generales
- [ ] Crear `pages/LocationsPage.jsx` + `.module.css` — layout y ubicaciones
- [ ] Crear `pages/TechnicalInfoPage.jsx` + `.module.css` — coberturas y cálculo
- [ ] Crear `pages/TermsAndConditionsPage.jsx` + `.module.css` — términos (opcional)
- [ ] Crear `pages/NotFoundPage.jsx` — página 404

#### Implementación - Componentes

- [ ] Crear `components/HeaderNav.jsx` + `.module.css` — header con navegación y progreso
- [ ] Crear `components/ProgressBar.jsx` + `.module.css` — barra de progreso
- [ ] Crear `components/InputField.jsx` + `.module.css` — campo de entrada con validación
- [ ] Crear `components/SelectField.jsx` + `.module.css` — selector con búsqueda
- [ ] Crear `components/CheckboxField.jsx` + `.module.css` — checkbox
- [ ] Crear `components/AlertBox.jsx` + `.module.css` — alertas deslizables
- [ ] Crear `components/ConfirmModal.jsx` + `.module.css` — modal de confirmación
- [ ] Crear `components/LoadingSpinner.jsx` + `.module.css` — spinner de carga
- [ ] Crear `components/LocationCard.jsx` + `.module.css` — tarjeta de ubicación
- [ ] Crear `components/CoverageCheckbox.jsx` + `.module.css` — checkbox cobertura
- [ ] Crear `components/PriceBreakdown.jsx` + `.module.css` — desglose de precio

#### Implementación - Hooks

- [ ] Crear `hooks/useCotizacion.js` — estado general
- [ ] Crear `hooks/useGeneralInfo.js` — estado general-info
- [ ] Crear `hooks/useUbicaciones.js` — estado ubicaciones
- [ ] Crear `hooks/useCoberturas.js` — estado coberturas
- [ ] Crear `hooks/useCalculo.js` — estado y cálculo
- [ ] Crear `hooks/useAgentes.js` — búsqueda agentes
- [ ] Crear `hooks/useCatalogos.js` — catálogos estáticos

#### Implementación - Services

- [ ] Crear `services/cotizacionService.js` — CRUD cotizaciones
- [ ] Crear `services/generalInfoService.js` — general-info
- [ ] Crear `services/ubicacionesService.js` — ubicaciones
- [ ] Crear `services/coberturasService.js` — coberturas
- [ ] Crear `services/calculoService.js` — cálculo
- [ ] Crear `services/catalogosService.js` — catálogos

#### Implementación - Context y Config

- [ ] Crear `contexts/CotizacionContext.jsx` — context global
- [ ] Crear `App.jsx` — routing y layout principal
- [ ] Crear `.env` — variables de entorno (VITE_API_URL)

#### Tests Frontend

- [ ] `CotizadorPage renders create form` — página cargada
- [ ] `CotizadorPage submits new cotizacion` — crear folio
- [ ] `GeneralInfoPage loads data` — cargar datos
- [ ] `GeneralInfoPage validates required fields` — validación
- [ ] `GeneralInfoPage calls update on save` — guardar
- [ ] `LocationsPage renders layout selector` — layout
- [ ] `LocationsPage adds location` — agregar ubicación
- [ ] `LocationsPage shows incomplete warning` — alerta incompleta
- [ ] `LocationsPage edits location` — editar ubicación
- [ ] `TechnicalInfoPage renders coverages` — coberturas
- [ ] `TechnicalInfoPage calls calculate` — calcular
- [ ] `TechnicalInfoPage displays price breakdown` — mostrar precio
- [ ] `ProgressBar shows current step` — progreso
- [ ] `InputField validates on blur` — validación campo
- [ ] `SelectField searches and filters` — búsqueda
- [ ] `useCotizacion loads and saves` — hook cotización
- [ ] `useGeneralInfo updates data` — hook general-info
- [ ] `useUbicaciones manages locations` — hook ubicaciones
- [ ] `useCalculo executes calculation` — hook cálculo

### QA

- [ ] Ejecutar skill `/gherkin-case-generator` con criterios CRITERIO-13.1 a 18.1
- [ ] Ejecutar skill `/risk-identifier` — riesgos de UX, validación, manejo de errores
- [ ] Validar cobertura de tests en componentes y hooks
- [ ] Prueba manual end-to-end: crear folio → general-info → ubicaciones → coberturas → calcular
- [ ] Validar alertas no bloqueantes en ubicaciones incompletas
- [ ] Validar validaciones en tiempo real (CP, agente)
- [ ] Validar manejo de timeouts y errores de red

---

## Supuestos

1. **Autenticación:** No implementada en fase 1. Se asume usuario autenticado.

2. **Token Firebase:** Se envía en header Authorization: Bearer token

## Supuestos Confirmados ✅

1. **Autenticación:** NO obligatoria. Endpoints backend públicos en fase 1. Frontend sin validación de token.

2. **Ubicaciones incompletas:** SÍ permitidas. Muestran alerta pero usuario puede continuar (no bloqueante).

3. **Catálogos:** Cargados desde API backend vía fixtures/stubs. Aceptar cache local con TTL si es necesario.

4. **Búsqueda de agentes:** Async debounced (300ms mínimo) contra API backend (fixture).

5. **Validación de CP:** Async contra endpoint backend de validación. Permitir "sin validación previa" para continuar.

6. **Persistencia local:** localStorage para guardar folio actual. Permitir refresco de página sin perder folio.

7. **Responsividad:** NO obligatoria. Desktop-first aceptable en fase 1.

8. **Internacionalización:** NO requerida. Textos en español hardcodeados aceptables.

9. **Accesibilidad (a11y):** NO requerida en fase 1. Puede agregarse en fase 2.

10. **Analytics/Tracking:** NO requerido en fase 1.

---

