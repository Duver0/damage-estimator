"""
Tests unitarios para FoliosService.
Cubre SPEC-001 — HU-01 a HU-06.
"""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException

from app.services.folios_service import FoliosService, _generate_folio, _validate_agent
from app.models.cotizacion_model import (
    CotizacionCreate,
    DatosAseguradoCreate,
    DatosConduccionCreate,
    TipoNegocio,
    ClasificacionRiesgo,
    GeneralInfoUpdate,
    CoverageOptionsUpdate,
    OpcionCoberturaUpdate,
    DatosAseguradoBase,
)
from app.repositories.folios_repository import FoliosRepository


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def make_create_dto(agente="AG001"):
    return CotizacionCreate(
        datos_asegurado=DatosAseguradoCreate(nombre="Juan Test"),
        datos_conduccion=DatosConduccionCreate(codigo_agente=agente),
        tipo_negocio=TipoNegocio.COMERCIAL,
    )


def make_cotizacion_doc(folio="F2026041700001", version=1, **kwargs):
    return {
        "numero_folio": folio,
        "estado_cotizacion": "CREADA",
        "datos_asegurado": {"nombre": "Juan Test", "email": "test@test.mx"},
        "datos_conduccion": {"codigo_agente": "AG001"},
        "tipo_negocio": "COMERCIAL",
        "opciones_cobertura": [
            {"cobertura": "INCENDIO_EDIFICIOS", "activa": True, "obligatoria": True, "nombre": "Incendio"},
        ],
        "ubicaciones": [],
        "prima_neta": None,
        "version": version,
        "fecha_creacion": datetime.utcnow(),
        "fecha_ultima_actualizacion": datetime.utcnow(),
        "metadatos": {"idempotency_key": None},
        **kwargs,
    }


# ---------------------------------------------------------------------------
# Generador de folio
# ---------------------------------------------------------------------------

class TestGenerateFolio:
    def test_formato_correcto(self):
        # GIVEN una fecha y secuencia
        date_str = "20260417"
        sequence = 1
        # WHEN
        folio = _generate_folio(date_str, sequence)
        # THEN
        assert folio == "F2026041700001"
        assert folio.startswith("F")
        assert len(folio) == 14

    def test_secuencia_con_padding(self):
        folio = _generate_folio("20260417", 99)
        assert folio == "F2026041700099"

    def test_secuencia_maxima(self):
        folio = _generate_folio("20260417", 99999)
        assert folio == "F2026041799999"


# ---------------------------------------------------------------------------
# Validación de agente
# ---------------------------------------------------------------------------

class TestValidateAgent:
    def test_agente_valido(self):
        agents = [{"codigo": "AG001", "nombre": "Test", "correo": "t@t.mx", "activo": True}]
        with patch("app.services.folios_service._load_agents_fixture", return_value=agents):
            result = _validate_agent("AG001")
        assert result["codigo"] == "AG001"

    def test_agente_invalido_lanza_400(self):
        with patch("app.services.folios_service._load_agents_fixture", return_value=[]):
            with pytest.raises(HTTPException) as exc_info:
                _validate_agent("AGXX")
        assert exc_info.value.status_code == 400


# ---------------------------------------------------------------------------
# FoliosService.create_folio
# ---------------------------------------------------------------------------

class TestCreateFolio:
    @pytest.mark.asyncio
    async def test_crear_folio_exitoso(self):
        # GIVEN
        mock_repo = AsyncMock(spec=FoliosRepository)
        mock_repo.find_by_idempotency_key.return_value = None
        mock_repo.get_next_folio_sequence.return_value = 1
        doc = make_cotizacion_doc()
        mock_repo.create.return_value = doc

        service = FoliosService(mock_repo)
        agents = [{"codigo": "AG001", "nombre": "Agente", "correo": "a@a.mx", "activo": True}]

        with patch("app.services.folios_service._load_agents_fixture", return_value=agents):
            # WHEN
            result = await service.create_folio(make_create_dto())

        # THEN
        assert result["estado_cotizacion"] == "CREADA"
        mock_repo.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_idempotencia_retorna_existente(self):
        # GIVEN mismo idempotency key
        existing_doc = make_cotizacion_doc()
        mock_repo = AsyncMock(spec=FoliosRepository)
        mock_repo.find_by_idempotency_key.return_value = existing_doc

        service = FoliosService(mock_repo)
        agents = [{"codigo": "AG001", "nombre": "Agente", "correo": "a@a.mx", "activo": True}]

        with patch("app.services.folios_service._load_agents_fixture", return_value=agents):
            # WHEN
            result = await service.create_folio(make_create_dto(), idempotency_key="key-123")

        # THEN: retorna el existente, no llama a create
        assert result == existing_doc
        mock_repo.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_agente_invalido_lanza_400(self):
        # GIVEN agente no existe
        mock_repo = AsyncMock(spec=FoliosRepository)
        mock_repo.find_by_idempotency_key.return_value = None

        service = FoliosService(mock_repo)
        with patch("app.services.folios_service._load_agents_fixture", return_value=[]):
            with pytest.raises(HTTPException) as exc_info:
                await service.create_folio(make_create_dto(agente="AGXX"))

        assert exc_info.value.status_code == 400


# ---------------------------------------------------------------------------
# FoliosService.get_general_info
# ---------------------------------------------------------------------------

class TestGetGeneralInfo:
    @pytest.mark.asyncio
    async def test_obtener_existente(self):
        # GIVEN
        doc = make_cotizacion_doc()
        mock_repo = AsyncMock(spec=FoliosRepository)
        mock_repo.find_by_folio.return_value = doc

        service = FoliosService(mock_repo)
        # WHEN
        result = await service.get_general_info("F2026041700001")

        # THEN
        assert result["numero_folio"] == "F2026041700001"

    @pytest.mark.asyncio
    async def test_folio_no_existe_lanza_404(self):
        # GIVEN folio inexistente
        mock_repo = AsyncMock(spec=FoliosRepository)
        mock_repo.find_by_folio.return_value = None

        service = FoliosService(mock_repo)
        # WHEN / THEN
        with pytest.raises(HTTPException) as exc_info:
            await service.get_general_info("FNOEXISTE")

        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# FoliosService.update_general_info
# ---------------------------------------------------------------------------

class TestUpdateGeneralInfo:
    @pytest.mark.asyncio
    async def test_actualizar_exitoso(self):
        # GIVEN versión correcta
        doc = make_cotizacion_doc(version=1)
        updated_doc = make_cotizacion_doc(version=2)
        mock_repo = AsyncMock(spec=FoliosRepository)
        mock_repo.find_by_folio.return_value = doc
        mock_repo.update_multiple_fields.return_value = updated_doc

        service = FoliosService(mock_repo)
        update_dto = GeneralInfoUpdate(
            version=1,
            datos_asegurado=DatosAseguradoBase(nombre="Nombre Nuevo"),
        )

        agents = [{"codigo": "AG001", "nombre": "Agente", "correo": "a@a.mx", "activo": True}]
        with patch("app.services.folios_service._load_agents_fixture", return_value=agents):
            result = await service.update_general_info("F2026041700001", update_dto)

        # THEN versión incrementada
        assert result["version"] == 2

    @pytest.mark.asyncio
    async def test_version_desactualizada_lanza_409(self):
        # GIVEN versión desactualizada
        doc = make_cotizacion_doc(version=3)
        mock_repo = AsyncMock(spec=FoliosRepository)
        mock_repo.find_by_folio.return_value = doc

        service = FoliosService(mock_repo)
        update_dto = GeneralInfoUpdate(version=1)  # versión vieja

        with pytest.raises(HTTPException) as exc_info:
            await service.update_general_info("F2026041700001", update_dto)

        assert exc_info.value.status_code == 409
        assert "3" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_folio_no_encontrado_lanza_404(self):
        mock_repo = AsyncMock(spec=FoliosRepository)
        mock_repo.find_by_folio.return_value = None

        service = FoliosService(mock_repo)
        update_dto = GeneralInfoUpdate(version=1)

        with pytest.raises(HTTPException) as exc_info:
            await service.update_general_info("FNOEXISTE", update_dto)

        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_actualizacion_parcial_no_sobrescribe(self):
        # GIVEN solo se actualiza nombre, conducción no cambia
        doc = make_cotizacion_doc(version=1)
        doc["datos_conduccion"] = {"codigo_agente": "AG001", "nombre_agente": "Original"}
        updated = make_cotizacion_doc(version=2)
        updated["datos_conduccion"] = {"codigo_agente": "AG001", "nombre_agente": "Original"}

        mock_repo = AsyncMock(spec=FoliosRepository)
        mock_repo.find_by_folio.return_value = doc
        mock_repo.update_multiple_fields.return_value = updated

        service = FoliosService(mock_repo)
        update_dto = GeneralInfoUpdate(
            version=1,
            datos_asegurado=DatosAseguradoBase(nombre="Solo Este Campo"),
        )

        agents = [{"codigo": "AG001", "nombre": "Original", "correo": "a@a.mx", "activo": True}]
        with patch("app.services.folios_service._load_agents_fixture", return_value=agents):
            result = await service.update_general_info("F2026041700001", update_dto)

        # THEN: conducción intacta
        assert result["datos_conduccion"]["codigo_agente"] == "AG001"


# ---------------------------------------------------------------------------
# FoliosService.get_coverage_options
# ---------------------------------------------------------------------------

class TestCoverageOptions:
    @pytest.mark.asyncio
    async def test_obtener_coberturas(self):
        doc = make_cotizacion_doc()
        mock_repo = AsyncMock(spec=FoliosRepository)
        mock_repo.find_by_folio.return_value = doc

        service = FoliosService(mock_repo)
        result = await service.get_coverage_options("F2026041700001")

        assert "opciones_cobertura" in result
        assert len(result["opciones_cobertura"]) > 0

    @pytest.mark.asyncio
    async def test_actualizar_coberturas_version_correcta(self):
        doc = make_cotizacion_doc(version=1)
        updated = make_cotizacion_doc(version=2)
        updated["opciones_cobertura"] = [
            {"cobertura": "INCENDIO_EDIFICIOS", "activa": True, "obligatoria": True, "nombre": "Incendio"},
        ]
        mock_repo = AsyncMock(spec=FoliosRepository)
        mock_repo.find_by_folio.return_value = doc
        mock_repo.update_multiple_fields.return_value = updated

        service = FoliosService(mock_repo)
        update_dto = CoverageOptionsUpdate(
            version=1,
            opciones_cobertura=[OpcionCoberturaUpdate(cobertura="INCENDIO_EDIFICIOS", activa=True)],
        )
        result = await service.update_coverage_options("F2026041700001", update_dto)

        assert result["version"] == 2


# ---------------------------------------------------------------------------
# FoliosService.get_state
# ---------------------------------------------------------------------------

class TestGetState:
    @pytest.mark.asyncio
    async def test_get_state_includes_prima_neta_and_prima_comercial(self):
        """get_state() debe retornar prima_neta y prima_comercial en respuesta."""
        mock_repo = AsyncMock()
        mock_repo.find_by_folio.return_value = {
            "numero_folio": "F20260419-00001",
            "estado_cotizacion": "CALCULADA",
            "datos_asegurado": {"nombre": "Test"},
            "datos_conduccion": {"codigo_agente": "AG001"},
            "tipo_negocio": "COMERCIO",
            "ubicaciones": [
                {"indice": 0, "estado_validacion": "COMPLETA", "alertas_bloqueantes": []}
            ],
            "opciones_cobertura": [{"cobertura": "INCENDIO_EDIFICIOS", "activa": True}],
            "prima_neta": 50000.00,
            "prima_comercial": 67500.00,
            "version": 1,
            "fecha_ultima_actualizacion": "2026-04-19T00:00:00"
        }

        service = FoliosService(mock_repo)
        resultado = await service.get_state("F20260419-00001")

        assert resultado.get("prima_neta") == 50000.00
        assert resultado.get("prima_comercial") == 67500.00
        assert resultado.get("numero_folio") == "F20260419-00001"

    @pytest.mark.asyncio
    async def test_estado_con_ubicaciones_mixtas(self):
        # GIVEN: folio con 2 ubicaciones (1 completa, 1 incompleta)
        doc = make_cotizacion_doc()
        doc["datos_asegurado"] = {"nombre": "Juan", "email": "j@j.mx"}
        doc["datos_conduccion"] = {"codigo_agente": "AG001"}
        doc["tipo_negocio"] = "COMERCIAL"
        doc["ubicaciones"] = [
            {"indice": 0, "estado_validacion": "COMPLETA", "alertas_bloqueantes": []},
            {"indice": 1, "estado_validacion": "INCOMPLETA", "alertas_bloqueantes": [
                {"tipo": "FALTA_GIRO", "mensaje": "Falta giro"}
            ]},
        ]

        mock_repo = AsyncMock(spec=FoliosRepository)
        mock_repo.find_by_folio.return_value = doc

        service = FoliosService(mock_repo)
        result = await service.get_state("F2026041700001")

        # THEN
        assert result["estados_seccion"]["ubicaciones_completas"] == 1
        assert result["estados_seccion"]["ubicaciones_incompletas"] == 1
        assert result["estados_seccion"]["datos_generales_completo"] is True
        assert len(result["alertas"]) == 1


# ---------------------------------------------------------------------------
# FoliosService.list_quotations
# ---------------------------------------------------------------------------

class TestListQuotations:
    @pytest.mark.asyncio
    async def test_list_quotations_returns_all_folios(self):
        """Service debe listar todas las cotizaciones."""
        mock_repo = AsyncMock()
        mock_repo.find_all.return_value = [
            {
                "numero_folio": "F20260419-00001",
                "estado_cotizacion": "CREADA",
                "fecha_creacion": "2026-04-19",
                "fecha_ultima_actualizacion": "2026-04-19",
                "datos_asegurado": {"nombre": "Empresa A"},
                "prima_neta": None,
            },
            {
                "numero_folio": "F20260419-00002",
                "estado_cotizacion": "CALCULADA",
                "fecha_creacion": "2026-04-19",
                "fecha_ultima_actualizacion": "2026-04-19",
                "datos_asegurado": {"nombre": "Empresa B"},
                "prima_neta": 50000.00,
            },
        ]

        service = FoliosService(mock_repo)
        resultado = await service.list_quotations()

        assert len(resultado) == 2
        assert resultado[0]["numero_folio"] == "F20260419-00001"
        assert resultado[1]["numero_folio"] == "F20260419-00002"

    @pytest.mark.asyncio
    async def test_list_quotations_mapea_nombre_asegurado(self):
        """El resumen debe exponer nombre_asegurado desde datos_asegurado."""
        mock_repo = AsyncMock()
        mock_repo.find_all.return_value = [
            {
                "numero_folio": "F20260419-00001",
                "estado_cotizacion": "CREADA",
                "fecha_creacion": "2026-04-19",
                "fecha_ultima_actualizacion": "2026-04-19",
                "datos_asegurado": {"nombre": "Empresa A"},
                "prima_neta": None,
                "prima_comercial": None,
            },
        ]

        service = FoliosService(mock_repo)
        resultado = await service.list_quotations()

        assert resultado[0]["nombre_asegurado"] == "Empresa A"

    @pytest.mark.asyncio
    async def test_list_quotations_sin_datos_asegurado_usa_na(self):
        """Si datos_asegurado es None, nombre_asegurado debe ser 'N/A'."""
        mock_repo = AsyncMock()
        mock_repo.find_all.return_value = [
            {
                "numero_folio": "F20260419-00001",
                "estado_cotizacion": "CREADA",
                "fecha_creacion": "2026-04-19",
                "fecha_ultima_actualizacion": "2026-04-19",
                "datos_asegurado": None,
                "prima_neta": None,
                "prima_comercial": None,
            },
        ]

        service = FoliosService(mock_repo)
        resultado = await service.list_quotations()

        assert resultado[0]["nombre_asegurado"] == "N/A"

    @pytest.mark.asyncio
    async def test_list_quotations_lista_vacia(self):
        """Cuando no hay cotizaciones, retorna lista vacía."""
        mock_repo = AsyncMock()
        mock_repo.find_all.return_value = []

        service = FoliosService(mock_repo)
        resultado = await service.list_quotations()

        assert resultado == []
