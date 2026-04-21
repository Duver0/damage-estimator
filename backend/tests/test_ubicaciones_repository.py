"""
Tests de integración para UbicacionesRepository.
"""
import pytest
from datetime import datetime

from app.repositories.ubicaciones_repository import UbicacionesRepository


def _base_doc(folio="F2026041700001", version=1):
    return {
        "numero_folio": folio,
        "version": version,
        "configuracion_layout": {"cantidad_ubicaciones": 0, "puede_agregar_mas": True},
        "ubicaciones": [],
        "fecha_creacion": datetime.utcnow(),
        "fecha_ultima_actualizacion": datetime.utcnow(),
    }


class TestUbicacionesRepository:
    @pytest.mark.asyncio
    async def test_set_layout_version_correcta(self, mock_db):
        # GIVEN
        repo = UbicacionesRepository(mock_db)
        await mock_db["cotizaciones_danos"].insert_one(_base_doc())

        # WHEN
        result = await repo.set_layout("F2026041700001", 3, current_version=1)

        # THEN
        assert result is not None
        assert result["version"] == 2
        assert result["configuracion_layout"]["cantidad_ubicaciones"] == 3

    @pytest.mark.asyncio
    async def test_set_layout_version_incorrecta_retorna_none(self, mock_db):
        # GIVEN
        repo = UbicacionesRepository(mock_db)
        await mock_db["cotizaciones_danos"].insert_one(_base_doc(version=5))

        # WHEN
        result = await repo.set_layout("F2026041700001", 3, current_version=1)

        # THEN
        assert result is None

    @pytest.mark.asyncio
    async def test_get_layout_retorna_config(self, mock_db):
        # GIVEN
        repo = UbicacionesRepository(mock_db)
        await mock_db["cotizaciones_danos"].insert_one(_base_doc())

        # WHEN
        result = await repo.get_layout("F2026041700001")

        # THEN
        assert result is not None
        assert "configuracion_layout" in result

    @pytest.mark.asyncio
    async def test_set_ubicaciones_reemplaza_array(self, mock_db):
        # GIVEN
        repo = UbicacionesRepository(mock_db)
        await mock_db["cotizaciones_danos"].insert_one(_base_doc())
        ubicacion = {
            "indice": 0,
            "nombre_ubicacion": "Oficina",
            "codigo_postal": "110111",
            "giro": {"clave_giro": "6311", "clave_incendio": "1000"},
            "garantias": [],
        }

        # WHEN
        result = await repo.set_ubicaciones("F2026041700001", [ubicacion], current_version=1)

        # THEN
        assert result is not None
        assert len(result["ubicaciones"]) == 1
        assert result["version"] == 2

    @pytest.mark.asyncio
    async def test_get_ubicaciones_folio_inexistente(self, mock_db):
        # GIVEN
        repo = UbicacionesRepository(mock_db)

        # WHEN
        result = await repo.get_ubicaciones("FNOEXISTE")

        # THEN
        assert result is None

    @pytest.mark.asyncio
    async def test_find_cp_existe(self, mock_db):
        # GIVEN
        repo = UbicacionesRepository(mock_db)
        await mock_db["catalogo_cp_zonas"].insert_one({
            "codigo_postal": "110111",
            "estado": "CUNDINAMARCA",
            "municipio": "Bogotá D.C.",
            "colonia": "La Candelaria",
            "ciudad": "Bogotá",
            "es_zona_cat": False,
        })

        # WHEN
        result = await repo.find_cp("110111")

        # THEN
        assert result is not None
        assert result["estado"] == "CUNDINAMARCA"

    @pytest.mark.asyncio
    async def test_find_cp_no_existe_retorna_none(self, mock_db):
        # GIVEN
        repo = UbicacionesRepository(mock_db)

        # WHEN
        result = await repo.find_cp("99999")

        # THEN
        assert result is None

    @pytest.mark.asyncio
    async def test_update_ubicacion_campo_especifico(self, mock_db):
        # GIVEN
        repo = UbicacionesRepository(mock_db)
        doc = _base_doc()
        doc["ubicaciones"] = [{"indice": 0, "nombre_ubicacion": "Original", "garantias": []}]
        await mock_db["cotizaciones_danos"].insert_one(doc)

        # WHEN
        result = await repo.update_ubicacion(
            "F2026041700001", 0, {"nombre_ubicacion": "Actualizada"}, current_version=1
        )

        # THEN
        assert result is not None
        assert result["version"] == 2
