# CLAUDE.md — Cotizador de Daños

## Diccionario de Dominio

| Término | Definición |
|---------|-----------|
| **Folio** | Identificador único de cotización. Formato: `F<YYYYMMDD>-<5 dígitos>`. Ej: `F20260417-00001` |
| **Cotización** | Agregado principal. Contiene datos del asegurado, ubicaciones y resultado del cálculo |
| **Ubicación** | Inmueble a asegurar. Tiene dirección, giro, garantías y puede estar incompleta (borrador) |
| **Prima Neta** | Costo técnico del seguro antes de cargos comerciales |
| **Prima Comercial** | Prima Neta × (1 + margen comercial). Margen: 35% |
| **Giro** | Actividad comercial del inmueble (ej. oficina, bodega, comercio). Tiene `claveIncendio` |
| **Garantía** | Cobertura contratada (Incendio, CATTEV, CATFHM, Robo, etc.) |
| **Zona Catastrófica** | Zona geográfica con riesgo elevado CAT. Factor 1.5x sobre prima base |
| **Layout** | Configuración de cuántas ubicaciones tendrá la cotización y sus nombres |
| **Datos Generales** | Información del asegurado, agente, clasificación de riesgo y tipo de negocio |
| **Estado de Cotización** | BORRADOR → EN_CALCULO → CALCULADA → CANCELADA |
| **Versionado Optimista** | Campo `version` (int) que incrementa en cada escritura. Conflicto = 409 |
| **Ubicación Incompleta** | Ubicación sin CP válido, sin `giro.claveIncendio` o sin garantías. No bloquea flujo |
| **Fixtures** | Datos de catálogos cargados localmente (agentes, giros, tarifas, CPs). Reemplazan servicio externo |

## Arquitectura del Sistema

```
Frontend (React 19 + Vite)
        ↓ HTTP / Axios
Backend (FastAPI + Python 3.12)
        ↓ Motor (async)
Database (MongoDB)
        ↑
Fixtures (JSON) → catálogos y tarifas
```

## Estructura de Directorios

```
damage-estimator/
├── backend/
│   ├── app/
│   │   ├── routes/          # HTTP handlers (FastAPI routers)
│   │   ├── services/        # Reglas de negocio
│   │   ├── repositories/    # Queries MongoDB (Motor)
│   │   ├── models/          # Schemas Pydantic v2
│   │   └── core/            # Config, DB connection, deps
│   ├── fixtures/            # Datos de catálogos (JSON)
│   ├── tests/               # Pytest unit tests
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── pages/           # Rutas React
│   │   ├── components/      # UI reutilizable
│   │   ├── hooks/           # Estado + llamadas a services
│   │   ├── services/        # HTTP via Axios
│   │   └── App.jsx          # Rutas registradas
│   └── vite.config.js
├── .github/specs/           # Especificaciones ASDD (APPROVED)
├── .claude/                 # Agentes, reglas, hooks
├── CLAUDE.md                # Este archivo
└── README.md
```

## Stack Tecnológico

### Backend
- Python 3.12
- FastAPI (async REST)
- Motor (`motor.motor_asyncio`) — MongoDB async
- Pydantic v2 — validación y schemas
- Uvicorn — servidor ASGI
- Pytest + pytest-asyncio — tests

### Frontend
- React 19 + Vite
- CSS Modules (un `.module.css` por componente)
- React Router v6
- Axios — HTTP client

### Database
- MongoDB (local en desarrollo)
- Motor para acceso async
- 8 colecciones principales

## Reglas de Negocio Clave

1. **Sin autenticación** en fase 1. Endpoints públicos.
2. **Catálogos via fixtures** en `/backend/fixtures/`. No hay servicio externo.
3. **Fórmula de prima simplificada:**
   ```
   Prima = SumaAsegurada × Tasa × FactorZona × FactorConstruccion × FactorGiro × (1 + RecargoCat)
   Prima_Comercial = Prima_Neta × 1.35
   ```
4. **Ubicación calculable si tiene:** CP válido + `giro.claveIncendio` + garantías.
5. **Ubicación incompleta:** genera alerta, NO bloquea. Se omite del cálculo.
6. **Versionado optimista:** toda escritura de sección increments `version`. Conflicto = 409.
7. **Moneda:** solo MXN. Sin multi-moneda.

## Endpoints Principales

```
POST   /v1/folios
GET    /v1/quotes/{folio}/general-info
PUT    /v1/quotes/{folio}/general-info
GET    /v1/quotes/{folio}/locations/layout
PUT    /v1/quotes/{folio}/locations/layout
GET    /v1/quotes/{folio}/locations
PUT    /v1/quotes/{folio}/locations
PATCH  /v1/quotes/{folio}/locations/{indice}
GET    /v1/quotes/{folio}/locations/summary
GET    /v1/quotes/{folio}/state
GET    /v1/quotes/{folio}/coverage-options
PUT    /v1/quotes/{folio}/coverage-options
POST   /v1/quotes/{folio}/calculate
```

## Catálogos (Fixtures)

Archivos JSON en `/backend/fixtures/`:
- `agents.json` — agentes de seguros
- `subscribers.json` — asegurados
- `business_lines.json` — giros con `claveIncendio`
- `zip_codes.json` — CPs con zona, municipio, estado, colonia
- `guarantees.json` — garantías disponibles
- `tariffs.json` — tarifas de incendio por giro
- `calc_params.json` — parámetros de cálculo (margen, factores)

## DoR (Definition of Ready)

- [ ] Spec en `.github/specs/` con status APPROVED
- [ ] Diccionario de dominio actualizado (este archivo)
- [ ] Stack definido en reglas de agente

## DoD (Definition of Done)

- [ ] Código implementado según spec
- [ ] Tests unitarios con cobertura ≥ 80%
- [ ] Endpoints verificados manualmente
- [ ] Sin `TODO` sin resolver
- [ ] README actualizado con instrucciones de ejecución
