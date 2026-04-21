"""
Tests de integración router para endpoints de folios.
Usa TestClient de FastAPI y override de get_database.
"""
import pytest
import asyncio
from datetime import datetime
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

from main import app
from app.core.database import get_database


@pytest.fixture
def mock_db_sync():
    """BD en memoria para tests síncronos de router."""
    client = AsyncMongoMockClient()
    return client["cotizador_danos_test"]


@pytest.fixture
def client(mock_db_sync):
    """TestClient con BD en memoria. Mockea startup/shutdown para no requerir MongoDB real."""
    async def override_get_database():
        return mock_db_sync

    app.dependency_overrides[get_database] = override_get_database
    with patch("main.connect_to_mongo", new=AsyncMock()), \
         patch("main.close_mongo_connection", new=AsyncMock()):
        with TestClient(app) as c:
            yield c
    app.dependency_overrides.clear()


class TestPostFolios:
    def test_crear_folio_exitoso(self, client):
        # GIVEN
        payload = {
            "datos_asegurado": {"nombre": "Test Corp", "email": "test@corp.mx"},
            "datos_conduccion": {"codigo_agente": "AG001", "nombre_agente": "Agente 1"},
            "tipo_negocio": "COMERCIAL",
            "clasificacion_riesgo": "BAJO",
        }

        # WHEN
        res = client.post("/v1/folios", json=payload)

        # THEN
        assert res.status_code == 201
        data = res.json()
        assert "numero_folio" in data
        assert data["numero_folio"].startswith("F")
        assert data["version"] == 1

    def test_crear_folio_idempotente(self, client):
        # GIVEN: mismo idempotency-key dos veces
        payload = {
            "datos_asegurado": {"nombre": "Test Corp", "email": "test@corp.mx"},
            "datos_conduccion": {"codigo_agente": "AG001", "nombre_agente": "Agente 1"},
            "tipo_negocio": "COMERCIAL",
            "clasificacion_riesgo": "BAJO",
        }
        headers = {"Idempotency-Key": "test-key-unique-001"}

        # WHEN
        res1 = client.post("/v1/folios", json=payload, headers=headers)
        res2 = client.post("/v1/folios", json=payload, headers=headers)

        # THEN: ambas retornan el mismo folio
        assert res1.status_code == 201
        assert res2.status_code == 201
        assert res1.json()["numero_folio"] == res2.json()["numero_folio"]


class TestGetState:
    def test_get_state_folio_no_existe(self, client):
        # WHEN
        res = client.get("/v1/quotes/FNOEXISTE/state")

        # THEN
        assert res.status_code == 404

    def test_get_state_folio_existente(self, client, mock_db_sync):
        # GIVEN: insertar folio directamente
        asyncio.get_event_loop().run_until_complete(
            mock_db_sync["cotizaciones_danos"].insert_one({
                "numero_folio": "F2026041700001",
                "estado_cotizacion": "CREADA",
                "tipo_negocio": "COMERCIAL",
                "clasificacion_riesgo": "BAJO",
                "datos_asegurado": {"nombre": "Test"},
                "datos_conduccion": {},
                "configuracion_layout": {"cantidad_ubicaciones": 0, "puede_agregar_mas": True},
                "opciones_cobertura": [],
                "ubicaciones": [],
                "prima_neta": None,
                "prima_comercial": None,
                "primas_por_ubicacion": [],
                "version": 1,
                "fecha_creacion": datetime.utcnow(),
                "fecha_ultima_actualizacion": datetime.utcnow(),
                "metadatos": {"idempotency_key": None},
            })
        )

        # WHEN
        res = client.get("/v1/quotes/F2026041700001/state")

        # THEN
        assert res.status_code == 200
        data = res.json()
        assert data["numero_folio"] == "F2026041700001"
        assert "estado_cotizacion" in data
