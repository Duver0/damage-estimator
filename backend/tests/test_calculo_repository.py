"""
Tests de integración para CalculoRepository.
"""
import pytest
from datetime import datetime

from app.repositories.calculo_repository import CalculoRepository


def _cotizacion(folio="F2026041700001", version=1):
    return {
        "numero_folio": folio,
        "estado_cotizacion": "CREADA",
        "ubicaciones": [],
        "prima_neta": None,
        "prima_comercial": None,
        "primas_por_ubicacion": [],
        "version": version,
        "fecha_creacion": datetime.utcnow(),
        "fecha_ultima_actualizacion": datetime.utcnow(),
    }


class TestCalculoRepository:
    @pytest.mark.asyncio
    async def test_get_cotizacion_existente(self, mock_db):
        # GIVEN
        repo = CalculoRepository(mock_db)
        await mock_db["cotizaciones_danos"].insert_one(_cotizacion())

        # WHEN
        result = await repo.get_cotizacion("F2026041700001")

        # THEN
        assert result is not None
        assert result["numero_folio"] == "F2026041700001"

    @pytest.mark.asyncio
    async def test_get_cotizacion_inexistente_retorna_none(self, mock_db):
        # GIVEN
        repo = CalculoRepository(mock_db)

        # WHEN
        result = await repo.get_cotizacion("FNOEXISTE")

        # THEN
        assert result is None

    @pytest.mark.asyncio
    async def test_get_parametros_activos(self, mock_db, seed_calc_params):
        # GIVEN
        repo = CalculoRepository(mock_db)

        # WHEN
        result = await repo.get_parametros_activos()

        # THEN
        assert result is not None
        assert result["margen_comercial"] == 0.35

    @pytest.mark.asyncio
    async def test_get_parametros_activos_sin_datos_retorna_none(self, mock_db):
        # GIVEN
        repo = CalculoRepository(mock_db)

        # WHEN
        result = await repo.get_parametros_activos()

        # THEN
        assert result is None

    @pytest.mark.asyncio
    async def test_get_tarifas_por_giro(self, mock_db, seed_tarifas):
        # GIVEN
        repo = CalculoRepository(mock_db)

        # WHEN
        result = await repo.get_tarifas_por_giro("1000")

        # THEN
        assert len(result) == 2
        claves = {t["garantia"] for t in result}
        assert "INCENDIO_EDIFICIOS" in claves

    @pytest.mark.asyncio
    async def test_get_tarifas_por_giro_sin_resultados(self, mock_db):
        # GIVEN
        repo = CalculoRepository(mock_db)

        # WHEN
        result = await repo.get_tarifas_por_giro("9999")

        # THEN
        assert result == []

    @pytest.mark.asyncio
    async def test_update_resultado_financiero_version_correcta(self, mock_db):
        # GIVEN
        repo = CalculoRepository(mock_db)
        await mock_db["cotizaciones_danos"].insert_one(_cotizacion())
        resultado = {
            "prima_neta": 5000.0,
            "prima_comercial": 6750.0,
            "primas_por_ubicacion": [{"indice": 0, "prima": 5000.0}],
        }

        # WHEN
        result = await repo.update_resultado_financiero("F2026041700001", resultado, current_version=1)

        # THEN
        assert result is not None
        assert result["prima_neta"] == 5000.0
        assert result["prima_comercial"] == 6750.0
        assert result["estado_cotizacion"] == "COTIZADA"
        assert result["version"] == 2

    @pytest.mark.asyncio
    async def test_update_resultado_financiero_version_incorrecta_retorna_none(self, mock_db):
        # GIVEN
        repo = CalculoRepository(mock_db)
        await mock_db["cotizaciones_danos"].insert_one(_cotizacion(version=3))
        resultado = {"prima_neta": 1.0, "prima_comercial": 1.35, "primas_por_ubicacion": []}

        # WHEN
        result = await repo.update_resultado_financiero("F2026041700001", resultado, current_version=1)

        # THEN
        assert result is None
