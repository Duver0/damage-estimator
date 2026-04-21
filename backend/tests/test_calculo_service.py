"""
Tests unitarios para CalculoService.
Cubre SPEC-003 — HU-12, algoritmo de 8 fases y fórmula de prima.
"""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException

from app.services.calculo_service import CalculoService
from app.repositories.calculo_repository import CalculoRepository


# ---------------------------------------------------------------------------
# Fixtures de dominio
# ---------------------------------------------------------------------------

def make_parametros():
    return {
        "codigo_parametro": "PARAMS_TEST",
        "version": "1.0",
        "margen_comercial": 0.35,
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


def make_cotizacion(folio="F2026041700001", version=3, estado_validacion="COMPLETA"):
    return {
        "numero_folio": folio,
        "version": version,
        "estado_cotizacion": "CREADA",
        "opciones_cobertura": [
            {"cobertura": "INCENDIO_EDIFICIOS", "activa": True},
        ],
        "ubicaciones": [
            {
                "indice": 0,
                "nombre_ubicacion": "Oficina",
                "tipo_constructivo": "LADRILLO_CONCRETO",
                "zona_catastrofica": False,
                "giro": {"clave_giro": "6311", "clave_incendio": "1000"},
                "garantias": [
                    {
                        "codigo_garantia": "INCENDIO_EDIFICIOS",
                        "nombre": "Incendio - Edificio",
                        "suma_asegurada": 1000000,
                        "prima": 0,
                        "tasa": 0.005,
                    }
                ],
                "estado_validacion": estado_validacion,
            }
        ],
    }


def make_tarifas():
    return [
        {
            "clave_incendio": "1000",
            "garantia": "INCENDIO_EDIFICIOS",
            "tasa": 0.005,
            "factor_riesgo": 1.0,
        }
    ]


# ---------------------------------------------------------------------------
# Cálculo de prima unitaria (fórmula directa)
# ---------------------------------------------------------------------------

class TestCalcularPrimaGarantia:
    def test_formula_basica(self):
        service = CalculoService(MagicMock())
        # SA=1_000_000, tasa=0.005, f_zona=1.0, f_const=1.0, f_giro=1.0, recargo=0.0
        prima = service.calcular_prima_garantia(
            suma_asegurada=1_000_000,
            tasa=0.005,
            factor_zona=1.0,
            factor_construccion=1.0,
            factor_giro=1.0,
            recargo_cat=0.0,
        )
        assert prima == 5000.0

    def test_factor_zona_catastrofica(self):
        service = CalculoService(MagicMock())
        prima = service.calcular_prima_garantia(
            suma_asegurada=1_000_000,
            tasa=0.005,
            factor_zona=1.5,  # zona CAT
            factor_construccion=1.0,
            factor_giro=1.0,
            recargo_cat=0.0,
        )
        assert prima == 7500.0

    def test_factor_construccion_acero(self):
        service = CalculoService(MagicMock())
        prima = service.calcular_prima_garantia(
            suma_asegurada=1_000_000,
            tasa=0.005,
            factor_zona=1.0,
            factor_construccion=0.8,  # ACERO
            factor_giro=1.0,
            recargo_cat=0.0,
        )
        assert prima == 4000.0

    def test_recargo_catfhm(self):
        service = CalculoService(MagicMock())
        prima = service.calcular_prima_garantia(
            suma_asegurada=1_000_000,
            tasa=0.005,
            factor_zona=1.0,
            factor_construccion=1.0,
            factor_giro=1.0,
            recargo_cat=0.25,  # CATFHM = 25%
        )
        assert prima == 6250.0

    def test_redondeo_a_2_decimales(self):
        service = CalculoService(MagicMock())
        prima = service.calcular_prima_garantia(
            suma_asegurada=333333,
            tasa=0.003,
            factor_zona=1.0,
            factor_construccion=1.0,
            factor_giro=1.0,
            recargo_cat=0.0,
        )
        assert prima == round(333333 * 0.003, 2)


# ---------------------------------------------------------------------------
# Consolidar resultados
# ---------------------------------------------------------------------------

class TestConsolidarResultados:
    def test_suma_correcta(self):
        service = CalculoService(MagicMock())
        primas = [
            {"prima_neta_ubicacion": 5000.0},
            {"prima_neta_ubicacion": 3000.0},
        ]
        result = service.consolidar_resultados(primas, 0.35)
        assert result["prima_neta"] == 8000.0
        assert result["prima_comercial"] == round(8000.0 * 1.35, 2)
        assert result["margen_aplicado"] == 0.35

    def test_prima_comercial_formula(self):
        service = CalculoService(MagicMock())
        primas = [{"prima_neta_ubicacion": 10000.0}]
        result = service.consolidar_resultados(primas, 0.35)
        assert result["prima_comercial"] == 13500.0  # 10000 * 1.35


# ---------------------------------------------------------------------------
# CalculoService.ejecutar_calculo — flujo completo
# ---------------------------------------------------------------------------

class TestEjecutarCalculo:
    @pytest.mark.asyncio
    async def test_calculo_exitoso(self):
        # GIVEN cotización con una ubicación completa
        cotizacion = make_cotizacion()
        parametros = make_parametros()
        tarifas = make_tarifas()

        mock_repo = AsyncMock(spec=CalculoRepository)
        mock_repo.get_cotizacion.return_value = cotizacion
        mock_repo.get_parametros_activos.return_value = parametros
        mock_repo.get_tarifas_por_giro.return_value = tarifas
        mock_repo.update_resultado_financiero.return_value = {
            **cotizacion,
            "version": 4,
            "estado_cotizacion": "COTIZADA",
        }

        service = CalculoService(mock_repo)
        result = await service.ejecutar_calculo("F2026041700001")

        assert result["estado_cotizacion"] == "COTIZADA"
        assert result["resultado_financiero"]["prima_neta"] > 0
        assert result["resultado_financiero"]["prima_comercial"] > result["resultado_financiero"]["prima_neta"]

    @pytest.mark.asyncio
    async def test_sin_ubicaciones_validas_lanza_400(self):
        # GIVEN todas las ubicaciones incompletas
        cotizacion = make_cotizacion(estado_validacion="INCOMPLETA")

        mock_repo = AsyncMock(spec=CalculoRepository)
        mock_repo.get_cotizacion.return_value = cotizacion
        mock_repo.get_parametros_activos.return_value = make_parametros()

        service = CalculoService(mock_repo)
        with pytest.raises(HTTPException) as exc_info:
            await service.ejecutar_calculo("F2026041700001")

        assert exc_info.value.status_code == 400
        assert "ubicaciones" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_parametros_faltantes_lanza_500(self):
        # GIVEN no existen parámetros de cálculo
        cotizacion = make_cotizacion()

        mock_repo = AsyncMock(spec=CalculoRepository)
        mock_repo.get_cotizacion.return_value = cotizacion
        mock_repo.get_parametros_activos.return_value = None  # sin parámetros

        service = CalculoService(mock_repo)
        with pytest.raises(HTTPException) as exc_info:
            await service.ejecutar_calculo("F2026041700001")

        assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    async def test_folio_no_encontrado_lanza_404(self):
        mock_repo = AsyncMock(spec=CalculoRepository)
        mock_repo.get_cotizacion.return_value = None

        service = CalculoService(mock_repo)
        with pytest.raises(HTTPException) as exc_info:
            await service.ejecutar_calculo("FNOEXISTE")

        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_calculo_mixto_omite_incompletas(self):
        # GIVEN 2 ubicaciones: 1 completa, 1 incompleta
        cotizacion = make_cotizacion()
        cotizacion["ubicaciones"].append({
            "indice": 1,
            "nombre_ubicacion": "Incompleta",
            "tipo_constructivo": "LADRILLO_CONCRETO",
            "zona_catastrofica": False,
            "giro": {"clave_incendio": None},
            "garantias": [],
            "estado_validacion": "INCOMPLETA",
        })

        mock_repo = AsyncMock(spec=CalculoRepository)
        mock_repo.get_cotizacion.return_value = cotizacion
        mock_repo.get_parametros_activos.return_value = make_parametros()
        mock_repo.get_tarifas_por_giro.return_value = make_tarifas()
        mock_repo.update_resultado_financiero.return_value = {
            **cotizacion, "version": 4, "estado_cotizacion": "COTIZADA"
        }

        service = CalculoService(mock_repo)
        result = await service.ejecutar_calculo("F2026041700001")

        # THEN: calculada 1, omitida 1
        assert result["resultado_financiero"]["total_ubicaciones_calculadas"] == 1
        assert result["resultado_financiero"]["total_ubicaciones_omitidas"] == 1
        assert len(result["alertas"]) == 1

    @pytest.mark.asyncio
    async def test_calculo_no_modifica_ubicaciones(self):
        # GIVEN
        cotizacion = make_cotizacion(version=5)
        ubicacion_original = cotizacion["ubicaciones"][0].copy()

        mock_repo = AsyncMock(spec=CalculoRepository)
        mock_repo.get_cotizacion.return_value = cotizacion
        mock_repo.get_parametros_activos.return_value = make_parametros()
        mock_repo.get_tarifas_por_giro.return_value = make_tarifas()
        mock_repo.update_resultado_financiero.return_value = {
            **cotizacion, "version": 6, "estado_cotizacion": "COTIZADA"
        }

        service = CalculoService(mock_repo)
        await service.ejecutar_calculo("F2026041700001")

        # THEN: update_resultado_financiero NO incluye 'ubicaciones' en su llamado
        call_args = mock_repo.update_resultado_financiero.call_args
        resultado_pasado = call_args[0][1]  # segundo argumento posicional
        assert "ubicaciones" not in resultado_pasado

    @pytest.mark.asyncio
    async def test_version_incrementa(self):
        cotizacion = make_cotizacion(version=3)

        mock_repo = AsyncMock(spec=CalculoRepository)
        mock_repo.get_cotizacion.return_value = cotizacion
        mock_repo.get_parametros_activos.return_value = make_parametros()
        mock_repo.get_tarifas_por_giro.return_value = make_tarifas()
        mock_repo.update_resultado_financiero.return_value = {
            **cotizacion, "version": 4, "estado_cotizacion": "COTIZADA"
        }

        service = CalculoService(mock_repo)
        result = await service.ejecutar_calculo("F2026041700001")

        assert result["version"] == 4


# ---------------------------------------------------------------------------
# CalculoService._calcular_prima_ubicacion
# ---------------------------------------------------------------------------

class TestCalcularPrimaUbicacion:
    @pytest.mark.asyncio
    async def test_prima_con_tasa_de_catalogo(self):
        ubicacion = {
            "indice": 0,
            "nombre_ubicacion": "Test",
            "tipo_constructivo": "LADRILLO_CONCRETO",
            "zona_catastrofica": False,
            "giro": {"clave_incendio": "1000"},
            "garantias": [
                {"codigo_garantia": "INCENDIO_EDIFICIOS", "nombre": "Inc", "suma_asegurada": 1_000_000, "tasa": 0.005},
            ],
            "estado_validacion": "COMPLETA",
        }
        parametros = make_parametros()
        tarifas = [{"garantia": "INCENDIO_EDIFICIOS", "tasa": 0.005, "factor_riesgo": 1.0}]

        mock_repo = AsyncMock(spec=CalculoRepository)
        mock_repo.get_tarifas_por_giro.return_value = tarifas
        service = CalculoService(mock_repo)

        result = await service._calcular_prima_ubicacion(ubicacion, parametros, [])

        assert result["prima_neta_ubicacion"] == 5000.0
        assert result["prima_comercial_ubicacion"] == 6750.0

    @pytest.mark.asyncio
    async def test_factor_zona_cat_aplicado(self):
        ubicacion = {
            "indice": 0,
            "nombre_ubicacion": "CAT Zone",
            "tipo_constructivo": "LADRILLO_CONCRETO",
            "zona_catastrofica": True,  # zona CAT
            "giro": {"clave_incendio": "1000"},
            "garantias": [
                {"codigo_garantia": "INCENDIO_EDIFICIOS", "nombre": "Inc", "suma_asegurada": 1_000_000, "tasa": 0.005},
            ],
            "estado_validacion": "COMPLETA",
        }
        parametros = make_parametros()

        mock_repo = AsyncMock(spec=CalculoRepository)
        mock_repo.get_tarifas_por_giro.return_value = []  # Sin tarifa de catálogo, usa tasa del doc
        service = CalculoService(mock_repo)

        result = await service._calcular_prima_ubicacion(ubicacion, parametros, [])

        # 1_000_000 * 0.005 * 1.5 = 7500
        assert result["prima_neta_ubicacion"] == 7500.0


class TestCalculoMultipleUbicaciones:
    @pytest.mark.asyncio
    async def test_calculo_dos_ubicaciones_distribuidas(self):
        # GIVEN: 2 ubicaciones completas con garantias separadas
        cotizacion = {
            "numero_folio": "F2026041700002",
            "version": 1,
            "estado_cotizacion": "CREADA",
            "opciones_cobertura": [],
            "ubicaciones": [
                {
                    "indice": 0,
                    "nombre_ubicacion": "Casa",
                    "tipo_constructivo": "LADRILLO_CONCRETO",
                    "zona_catastrofica": False,
                    "giro": {"clave_incendio": "1000"},
                    "garantias": [
                        {"codigo_garantia": "INCENDIO_EDIFICIOS", "nombre": "Inc", "suma_asegurada": 1_000_000, "tasa": 0.005}
                    ],
                    "estado_validacion": "COMPLETA",
                },
                {
                    "indice": 1,
                    "nombre_ubicacion": "Bodega",
                    "tipo_constructivo": "LADRILLO_CONCRETO",
                    "zona_catastrofica": False,
                    "giro": {"clave_incendio": "1000"},
                    "garantias": [
                        {"codigo_garantia": "INCENDIO_EDIFICIOS", "nombre": "Inc", "suma_asegurada": 300_000, "tasa": 0.005}
                    ],
                    "estado_validacion": "COMPLETA",
                },
            ],
        }

        parametros = make_parametros()
        tarifas = make_tarifas()

        mock_repo = AsyncMock(spec=CalculoRepository)
        mock_repo.get_cotizacion.return_value = cotizacion
        mock_repo.get_parametros_activos.return_value = parametros
        mock_repo.get_tarifas_por_giro.return_value = tarifas
        mock_repo.update_resultado_financiero.return_value = {**cotizacion, "version": 2, "estado_cotizacion": "COTIZADA"}

        service = CalculoService(mock_repo)
        result = await service.ejecutar_calculo(cotizacion["numero_folio"]) 

        rf = result["resultado_financiero"]
        assert rf["total_ubicaciones_calculadas"] == 2
        assert rf["total_ubicaciones_omitidas"] == 0
        # Prima esperada por ubicacion: 1_000_000 * 0.005 = 5000 ; 300_000 * 0.005 = 1500
        primas = rf["primas_por_ubicacion"]
        assert len(primas) == 2
        primas_netas = [p["prima_neta_ubicacion"] for p in primas]
        assert 5000.0 in primas_netas
        assert 1500.0 in primas_netas
