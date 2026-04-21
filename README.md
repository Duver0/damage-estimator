# Cotizador de Daños — Reto IA Center

Sistema de cotización de seguros de daños. Permite crear folios, capturar ubicaciones de riesgo, calcular prima neta/comercial y visualizar resultados.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite + CSS Modules + React Router v6 |
| Backend | Python 3.12 + FastAPI + Pydantic v2 + Uvicorn |
| Database | MongoDB + Motor (async) |
| Tests | Pytest + pytest-asyncio (backend) / Vitest (frontend) |
| Catálogos | JSON Fixtures (sin servicio externo) |

---

## Estructura

```
damage-estimator/
├── backend/
│   ├── app/
│   │   ├── routes/        # FastAPI routers
│   │   ├── services/      # Lógica de negocio
│   │   ├── repositories/  # Queries MongoDB
│   │   ├── models/        # Schemas Pydantic v2
│   │   └── core/          # Config, DB, deps
│   ├── fixtures/          # Catálogos JSON (agentes, giros, CPs, tarifas)
│   ├── tests/             # Pytest unit tests
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── pages/         # Rutas SPA
│   │   ├── components/    # UI reutilizable
│   │   ├── hooks/         # Estado + services
│   │   ├── services/      # HTTP Axios
│   │   └── App.jsx
│   └── vite.config.js
├── .github/specs/         # Especificaciones ASDD (5 specs APPROVED)
└── CLAUDE.md              # Diccionario de dominio
```

---

## Requisitos

- Python 3.12+
- Node 20+
- MongoDB 7+ (local o Docker)

---

## Instalación y Ejecución

### Opción A — Docker Compose (recomendado)

```bash
# Levantar MongoDB + backend + frontend + seed inicial
docker compose up --build -d

# El seed corre automáticamente una vez al iniciar
# Frontend: http://localhost:80
# Backend docs: http://localhost:8000/docs
```

Para re-ejecutar seed manualmente:
```bash
docker compose run --rm seed
```

---

### Opción B — Local

**MongoDB**
```bash
docker run -d -p 27017:27017 --name cotizador-db mongo:7
```

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # ajustar si es necesario
uvicorn main:app --reload --port 8000
```

**Cargar catálogos (seed)**
```bash
cd backend
python fixtures/seed.py
# Salida esperada: "Seed completado exitosamente."
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env           # VITE_API_URL= (vacío usa proxy Vite)
npm run dev                    # http://localhost:5173
```

---

## Variables de Entorno

Copiar los ejemplos antes de ejecutar:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Backend (`backend/.env`)
```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=cotizador_danos
DEBUG=false
```

### Frontend (`frontend/.env`)
```env
# Vacío = usa proxy de Vite (/v1 → localhost:8000) en modo dev
VITE_API_URL=
```

---

## Endpoints

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

Docs interactivos: `http://localhost:8000/docs`

---

## Tests

```bash
# Backend
cd backend
pytest tests/ -v --cov=app --cov-report=term-missing

# Frontend
cd frontend
npm run test
```

Cobertura mínima: **80%**

---

## Fórmula de Cálculo (Simplificada)

```
Prima_Neta = SumaAsegurada × Tasa × FactorZona × FactorConstruccion × FactorGiro × (1 + RecargoCat)
Prima_Comercial = Prima_Neta × 1.35
```

Parámetros en `backend/fixtures/calc_params.json`.

---

## Flujo de Cotización

1. `POST /v1/folios` → genera folio
2. `PUT general-info` → datos del asegurado y agente
3. `PUT locations/layout` → define cuántas ubicaciones
4. `PUT locations` + `PATCH locations/{i}` → registra ubicaciones
5. `PUT coverage-options` → selecciona coberturas
6. `POST calculate` → calcula prima neta y comercial
7. `GET state` → consulta estado final

---

## Supuestos y Limitaciones

- Sin autenticación en fase 1 (endpoints públicos)
- Catálogos via fixtures JSON (sin servicio externo real)
- Fórmula de prima simplificada y demostrativa
- Ubicaciones incompletas generan alerta pero no bloquean cálculo
- Moneda única: MXN
- Un solo asegurador implícito

---

## Especificaciones ASDD

Ver `.github/specs/` — 5 specs APPROVED:
- `cotizador-backend-folios.spec.md`
- `cotizador-backend-ubicaciones.spec.md`
- `cotizador-backend-calculo.spec.md`
- `cotizador-frontend-main.spec.md`
- `cotizador-database.spec.md`
