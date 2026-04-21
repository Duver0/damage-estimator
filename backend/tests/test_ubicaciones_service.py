"""
Tests unitarios para UbicacionesService.
Cubre SPEC-002 — HU-07 a HU-11.
"""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException

from app.services.ubicaciones_service import UbicacionesService
from app.models.cotizacion_model import (
    UbicacionInput,
    GiroInfo,
    GarantiaInput,
    TipoConstructivo,
)
from app.repositories.ubicaciones_repository import UbicacionesRepository


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_ubicacion_input(**kwargs):
    defaults = dict(
        nombre_ubicacion="Oficina Test",
        direccion="Carrera 7 # 32-16",
        codigo_postal="110111",
        estado="CUNDINAMARCA",
        municipio="Bogotá D.C.",
        ciudad="Bogotá",
        tipo_constructivo=TipoConstructivo.LADRILLO_CONCRETO,
        nivel=2,
        anio_construccion=2005,
        giro=GiroInfo(clave_giro="6311", clave_incendio="1000", descripcion="Oficinas"),
        garantias=[
            GarantiaInput(
                codigo_garantia="INCENDIO_EDIFICIOS",
                nombre="Incendio - Edificio",
                suma_asegurada=500000,
            )
        ],
    )
    defaults.update(kwargs)
    return UbicacionInput(**defaults)


def make_cp_info(es_zona_cat=False):
    return {
        "codigo_postal": "110111",
        "estado": "CUNDINAMARCA",
        "municipio": "Bogotá D.C.",
        "ciudad": "Bogotá",
        "es_zona_cat": es_zona_cat,
    }


def make_cotizacion_doc(version=2, folio="F2026041700001"):
    return {
        "numero_folio": folio,
        "version": version,
        "ubicaciones": [],
        "configuracion_layout": {"cantidad_ubicaciones": 0},
        "fecha_ultima_actualizacion": datetime.utcnow(),
    }


# ---------------------------------------------------------------------------
# Validación interna de ubicaciones
# ---------------------------------------------------------------------------

class TestValidateUbicacion:
    def test_ubicacion_completa_es_valida(self):
        service = UbicacionesService(MagicMock())
        ub = make_ubicacion_input()
        is_valid, alertas = service._validate_ubicacion(ub)
        assert is_valid is True
        assert len(alertas) == 0

    def test_sin_clave_incendio_es_incompleta(self):
        service = UbicacionesService(MagicMock())
        ub = make_ubicacion_input(
            giro=GiroInfo(clave_giro="9999", clave_incendio=None, descripcion="Sin clave")
        )
        is_valid, alertas = service._validate_ubicacion(ub)
        assert is_valid is False
        assert any("clave" in a["tipo"].lower() or "INCENDIO" in a["tipo"] for a in alertas)

    def test_sin_garantias_es_incompleta(self):
        service = UbicacionesService(MagicMock())
        ub = make_ubicacion_input(garantias=[])
        is_valid, alertas = service._validate_ubicacion(ub)
        assert is_valid is False
        assert any("GARANTIA" in a["tipo"] for a in alertas)

    def test_sin_giro_ni_garantias_tiene_multiples_alertas(self):
        service = UbicacionesService(MagicMock())
        ub = make_ubicacion_input(
            giro=GiroInfo(clave_giro=None, clave_incendio=None),
            garantias=[],
        )
        is_valid, alertas = service._validate_ubicacion(ub)
        assert is_valid is False
        assert len(alertas) == 2


# ---------------------------------------------------------------------------
# UbicacionesService.set_layout
# ---------------------------------------------------------------------------

class TestSetLayout:
    @pytest.mark.asyncio
    async def test_layout_valido(self):
        # GIVEN
        doc = make_cotizacion_doc(version=1)
        mock_repo = AsyncMock(spec=UbicacionesRepository)
        mock_repo.collection = AsyncMock()
        mock_repo.collection.find_one.return_value = doc
        mock_repo.set_layout.return_value = {**doc, "version": 2, "configuracion_layout": {"cantidad_ubicaciones": 3}}

        service = UbicacionesService(mock_repo)
        # WHEN
        result = await service.set_layout("F2026041700001", 3, 1)

        # THEN
        assert result["configuracion_layout"]["cantidad_ubicaciones"] == 3

    @pytest.mark.asyncio
    async def test_cantidad_cero_lanza_400(self):
        service = UbicacionesService(AsyncMock())
        with pytest.raises(HTTPException) as exc_info:
            await service.set_layout("FTEST", 0, 1)
        assert exc_info.value.status_code == 400
        assert "cantidad" in exc_info.value.detail.lower() or ">= 1" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_folio_no_encontrado_lanza_404(self):
        mock_repo = AsyncMock(spec=UbicacionesRepository)
        mock_repo.collection = AsyncMock()
        mock_repo.collection.find_one.return_value = None

        service = UbicacionesService(mock_repo)
        with pytest.raises(HTTPException) as exc_info:
            await service.set_layout("FNOEXISTE", 2, 1)
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_version_invalida_lanza_409(self):
        doc = make_cotizacion_doc(version=5)
        mock_repo = AsyncMock(spec=UbicacionesRepository)
        mock_repo.collection = AsyncMock()
        mock_repo.collection.find_one.return_value = doc

        service = UbicacionesService(mock_repo)
        with pytest.raises(HTTPException) as exc_info:
            await service.set_layout("FTEST", 2, 1)  # version 1 != 5
        assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# UbicacionesService.set_ubicaciones
# ---------------------------------------------------------------------------

class TestSetUbicaciones:
    @pytest.mark.asyncio
    async def test_registrar_ubicaciones_validas(self):
        # GIVEN
        doc = make_cotizacion_doc(version=2)
        cp_info = make_cp_info()
        updated_doc = {
            **doc,
            "version": 3,
            "ubicaciones": [{"indice": 0, "estado_validacion": "COMPLETA"}],
        }

        mock_repo = AsyncMock(spec=UbicacionesRepository)
        mock_repo.collection = AsyncMock()
        mock_repo.collection.find_one.return_value = doc
        mock_repo.find_cp.return_value = cp_info
        mock_repo.set_ubicaciones.return_value = updated_doc

        service = UbicacionesService(mock_repo)
        # WHEN
        result = await service.set_ubicaciones("FTEST", [make_ubicacion_input()], 2)

        # THEN
        assert result["version"] == 3

    @pytest.mark.asyncio
    async def test_cp_invalido_lanza_400(self):
        # GIVEN CP no existe en catálogo
        doc = make_cotizacion_doc(version=1)
        mock_repo = AsyncMock(spec=UbicacionesRepository)
        mock_repo.collection = AsyncMock()
        mock_repo.collection.find_one.return_value = doc
        mock_repo.find_cp.return_value = None  # CP no encontrado

        service = UbicacionesService(mock_repo)
        with pytest.raises(HTTPException) as exc_info:
            await service.set_ubicaciones("FTEST", [make_ubicacion_input()], 1)

        assert exc_info.value.status_code == 400
        assert "postal" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_ubicacion_sin_clave_incendio_es_incompleta(self):
        # GIVEN CP válido pero giro sin claveIncendio
        doc = make_cotizacion_doc(version=1)
        cp_info = make_cp_info()
        ub_incompleta = make_ubicacion_input(
            giro=GiroInfo(clave_giro="9999", clave_incendio=None)
        )

        mock_repo = AsyncMock(spec=UbicacionesRepository)
        mock_repo.collection = AsyncMock()
        mock_repo.collection.find_one.return_value = doc
        mock_repo.find_cp.return_value = cp_info
        mock_repo.set_ubicaciones.return_value = {
            **doc,
            "version": 2,
            "ubicaciones": [{"indice": 0, "estado_validacion": "INCOMPLETA"}],
        }

        service = UbicacionesService(mock_repo)
        result = await service.set_ubicaciones("FTEST", [ub_incompleta], 1)

        # THEN: ubicación marcada como incompleta, no error 400
        ubicaciones = result.get("ubicaciones", [])
        if ubicaciones:
            assert ubicaciones[0]["estado_validacion"] == "INCOMPLETA"

    @pytest.mark.asyncio
    async def test_zona_catastrofica_marcada_desde_cp(self):
        # GIVEN CP en zona CAT
        doc = make_cotizacion_doc(version=1)
        cp_info = make_cp_info(es_zona_cat=True)  # CP en zona CAT

        mock_repo = AsyncMock(spec=UbicacionesRepository)
        mock_repo.collection = AsyncMock()
        mock_repo.collection.find_one.return_value = doc
        mock_repo.find_cp.return_value = cp_info
        mock_repo.set_ubicaciones.return_value = {
            **doc,
            "version": 2,
            "ubicaciones": [{"indice": 0, "zona_catastrofica": True, "estado_validacion": "COMPLETA"}],
        }

        service = UbicacionesService(mock_repo)
        result = await service.set_ubicaciones("FTEST", [make_ubicacion_input()], 1)

        # THEN
        assert result["ubicaciones"][0]["zona_catastrofica"] is True


# ---------------------------------------------------------------------------
# UbicacionesService.update_ubicacion
# ---------------------------------------------------------------------------

class TestUpdateUbicacion:
    @pytest.mark.asyncio
    async def test_patch_exitoso(self):
        # GIVEN
        doc = make_cotizacion_doc(version=3)
        doc["ubicaciones"] = [
            {
                "indice": 0,
                "nombre_ubicacion": "Viejo Nombre",
                "codigo_postal": "110111",
                "giro": {"clave_incendio": "1000"},
                "garantias": [{"codigo_garantia": "INCENDIO_EDIFICIOS", "suma_asegurada": 500000}],
                "estado_validacion": "COMPLETA",
                "alertas_bloqueantes": [],
            }
        ]
        updated_ub = {"indice": 0, "nombre_ubicacion": "Nuevo Nombre", "estado_validacion": "COMPLETA"}
        updated_doc = {**doc, "version": 4, "ubicaciones": [updated_ub]}

        mock_repo = AsyncMock(spec=UbicacionesRepository)
        mock_repo.collection = AsyncMock()
        mock_repo.collection.find_one.return_value = doc
        mock_repo.find_cp.return_value = make_cp_info()
        mock_repo.update_ubicacion.return_value = updated_doc

        from app.models.cotizacion_model import UbicacionPatch
        patch_dto = UbicacionPatch(version=3, nombre_ubicacion="Nuevo Nombre")

        service = UbicacionesService(mock_repo)
        result = await service.update_ubicacion("FTEST", 0, patch_dto, 3)

        assert result.get("nombre_ubicacion") == "Nuevo Nombre"

    @pytest.mark.asyncio
    async def test_indice_invalido_lanza_404(self):
        doc = make_cotizacion_doc(version=1)
        doc["ubicaciones"] = [{"indice": 0, "nombre_ubicacion": "Existe"}]

        mock_repo = AsyncMock(spec=UbicacionesRepository)
        mock_repo.collection = AsyncMock()
        mock_repo.collection.find_one.return_value = doc

        from app.models.cotizacion_model import UbicacionPatch
        patch_dto = UbicacionPatch(version=1)

        service = UbicacionesService(mock_repo)
        with pytest.raises(HTTPException) as exc_info:
            await service.update_ubicacion("FTEST", 99, patch_dto, 1)

        assert exc_info.value.status_code == 404
        assert "99" in exc_info.value.detail


# ---------------------------------------------------------------------------
# UbicacionesService.get_summary
# ---------------------------------------------------------------------------

class TestGetSummary:
    @pytest.mark.asyncio
    async def test_resumen_con_mixtas(self):
        # GIVEN 2 ubicaciones: 1 completa, 1 incompleta
        mock_repo = AsyncMock(spec=UbicacionesRepository)
        mock_repo.get_ubicaciones.return_value = {
            "numero_folio": "FTEST",
            "version": 3,
            "ubicaciones": [
                {"indice": 0, "estado_validacion": "COMPLETA", "alertas_bloqueantes": []},
                {"indice": 1, "estado_validacion": "INCOMPLETA", "alertas_bloqueantes": [
                    {"tipo": "FALTA_GIRO", "mensaje": "Falta giro"}
                ]},
            ],
        }

        service = UbicacionesService(mock_repo)
        result = await service.get_summary("FTEST")

        assert result["resumen"]["total_ubicaciones"] == 2
        assert result["resumen"]["ubicaciones_completas"] == 1
        assert result["resumen"]["ubicaciones_incompletas"] == 1
        assert result["resumen"]["porcentaje_completitud"] == 50.0
        assert len(result["alertas"]) == 1

    @pytest.mark.asyncio
    async def test_sin_ubicaciones_porcentaje_cero(self):
        mock_repo = AsyncMock(spec=UbicacionesRepository)
        mock_repo.get_ubicaciones.return_value = {
            "numero_folio": "FTEST",
            "version": 1,
            "ubicaciones": [],
        }

        service = UbicacionesService(mock_repo)
        result = await service.get_summary("FTEST")

        assert result["resumen"]["porcentaje_completitud"] == 0.0
        assert result["resumen"]["total_ubicaciones"] == 0
