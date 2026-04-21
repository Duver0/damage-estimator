"""
Fixtures de pytest para tests de backend.
Usa mongomock-motor para simular MongoDB async sin necesitar instancia real.
"""
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock
from mongomock_motor import AsyncMongoMockClient


@pytest_asyncio.fixture
async def mock_db():
    """Base de datos MongoDB en memoria con mongomock-motor."""
    client = AsyncMongoMockClient()
    db = client["cotizador_danos_test"]
    yield db
    # Limpiar colecciones después de cada test
    for name in await db.list_collection_names():
        await db.drop_collection(name)


@pytest_asyncio.fixture
async def seed_calc_params(mock_db):
    """Carga parámetros de cálculo en la BD de test."""
    params = {
        "codigo_parametro": "PARAMS_TEST",
        "version": "1.0",
        "margen_comercial": 0.35,
        "recargo_primera": 0.15,
        "factores_construccion": {
            "LADRILLO_CONCRETO": 1.0,
            "ACERO": 0.8,
            "MADERA": 1.5,
            "HORMIGON_ARMADO": 0.7,
        },
        "factores_zona_cat": {
            "APLICABLE": 1.5,
            "NO_APLICABLE": 1.0,
        },
        "recargos_cat": {
            "CATFHM": 0.25,
            "CATTEV": 0.15,
        },
        "activo": True,
    }
    await mock_db["parametros_calculo"].insert_one(params)
    return params


@pytest_asyncio.fixture
async def seed_tarifas(mock_db):
    """Carga tarifas de incendio en la BD de test."""
    tarifas = [
        {
            "clave_giro": "6311",
            "clave_incendio": "1000",
            "garantia": "INCENDIO_EDIFICIOS",
            "tasa": 0.005,
            "factor_riesgo": 1.0,
            "vigente": True,
        },
        {
            "clave_giro": "6311",
            "clave_incendio": "1000",
            "garantia": "INCENDIO_CONTENIDOS",
            "tasa": 0.008,
            "factor_riesgo": 1.0,
            "vigente": True,
        },
    ]
    await mock_db["tarifas_incendio"].insert_many(tarifas)
    return tarifas


@pytest_asyncio.fixture
async def cotizacion_base(mock_db):
    """Inserta una cotización base válida para tests."""
    from datetime import datetime

    doc = {
        "numero_folio": "F2026041700001",
        "estado_cotizacion": "CREADA",
        "datos_asegurado": {
            "nombre": "Juan Test",
            "email": "juan@test.mx",
        },
        "datos_conduccion": {
            "codigo_agente": "AG001",
            "nombre_agente": "Agente Test",
        },
        "tipo_negocio": "COMERCIAL",
        "clasificacion_riesgo": "MEDIO",
        "configuracion_layout": {
            "cantidad_ubicaciones": 0,
            "puede_agregar_mas": True,
        },
        "opciones_cobertura": [
            {"cobertura": "INCENDIO_EDIFICIOS", "nombre": "Incendio Edificios", "activa": True, "obligatoria": True},
            {"cobertura": "CATFHM", "nombre": "CATFHM", "activa": False, "obligatoria": False},
        ],
        "ubicaciones": [],
        "prima_neta": None,
        "prima_comercial": None,
        "primas_por_ubicacion": [],
        "version": 1,
        "fecha_creacion": datetime.utcnow(),
        "fecha_ultima_actualizacion": datetime.utcnow(),
        "metadatos": {"idempotency_key": None},
    }
    await mock_db["cotizaciones_danos"].insert_one(doc)
    return doc


@pytest_asyncio.fixture
async def cotizacion_con_ubicacion(mock_db, cotizacion_base):
    """Cotización con una ubicación completa para tests de cálculo."""
    from datetime import datetime

    ubicacion = {
        "indice": 0,
        "nombre_ubicacion": "Oficina Principal",
        "direccion": "Calle Test 123",
        "codigo_postal": "110111",
        "estado": "CUNDINAMARCA",
        "municipio": "Bogotá D.C.",
        "ciudad": "Bogotá",
        "tipo_constructivo": "LADRILLO_CONCRETO",
        "nivel": 3,
        "anio_construccion": 2005,
        "giro": {
            "clave_giro": "6311",
            "clave_incendio": "1000",
            "descripcion": "Oficinas administrativas",
        },
        "garantias": [
            {
                "codigo_garantia": "INCENDIO_EDIFICIOS",
                "nombre": "Incendio - Edificio",
                "suma_asegurada": 1000000,
                "prima": 0,
                "tasa": 0.005,
            }
        ],
        "zona_catastrofica": False,
        "estado_validacion": "COMPLETA",
        "alertas_bloqueantes": [],
        "fecha_creacion": datetime.utcnow(),
        "fecha_actualizacion": datetime.utcnow(),
    }

    await mock_db["cotizaciones_danos"].update_one(
        {"numero_folio": cotizacion_base["numero_folio"]},
        {"$set": {"ubicaciones": [ubicacion]}}
    )
    return cotizacion_base
