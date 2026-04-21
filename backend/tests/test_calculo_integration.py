"""
Test de integración: persiste 2 ubicaciones en la colección de prueba
y ejecuta `CalculoService.ejecutar_calculo` usando el repositorio real
para verificar que las primas se calculan por ubicación (no se agrupan).
"""
import pytest
from datetime import datetime

from app.repositories.ubicaciones_repository import UbicacionesRepository
from app.repositories.calculo_repository import CalculoRepository
from app.services.calculo_service import CalculoService


@pytest.mark.asyncio
async def test_calculo_integration_dos_ubicaciones(
    mock_db, seed_calc_params, seed_tarifas, cotizacion_base
):
    folio = cotizacion_base["numero_folio"]

    ubicaciones = [
        {
            "indice": 0,
            "nombre_ubicacion": "Casa",
            "direccion": "Calle Uno 1",
            "codigo_postal": "110111",
            "estado": "CUNDINAMARCA",
            "municipio": "Bogotá D.C.",
            "colonia": "Centro",
            "ciudad": "Bogotá",
            "tipo_constructivo": "LADRILLO_CONCRETO",
            "nivel": 1,
            "anio_construccion": 2010,
            "giro": {"clave_giro": "6311", "clave_incendio": "1000"},
            "garantias": [
                {"codigo_garantia": "INCENDIO_EDIFICIOS", "nombre": "Inc", "suma_asegurada": 1_000_000, "prima": 0, "tasa": 0.005}
            ],
            "zona_catastrofica": False,
            "estado_validacion": "COMPLETA",
            "alertas_bloqueantes": [],
            "fecha_creacion": datetime.utcnow(),
            "fecha_actualizacion": datetime.utcnow(),
        },
        {
            "indice": 1,
            "nombre_ubicacion": "Bodega",
            "direccion": "Calle Dos 2",
            "codigo_postal": "110111",
            "estado": "CUNDINAMARCA",
            "municipio": "Bogotá D.C.",
            "colonia": "Industrial",
            "ciudad": "Bogotá",
            "tipo_constructivo": "LADRILLO_CONCRETO",
            "nivel": 1,
            "anio_construccion": 2015,
            "giro": {"clave_giro": "6311", "clave_incendio": "1000"},
            "garantias": [
                {"codigo_garantia": "INCENDIO_EDIFICIOS", "nombre": "Inc", "suma_asegurada": 300_000, "prima": 0, "tasa": 0.005}
            ],
            "zona_catastrofica": False,
            "estado_validacion": "COMPLETA",
            "alertas_bloqueantes": [],
            "fecha_creacion": datetime.utcnow(),
            "fecha_actualizacion": datetime.utcnow(),
        },
    ]

    # Persistir ubicaciones usando el repositorio (evita validación CP por servicio)
    ub_repo = UbicacionesRepository(mock_db)
    updated = await ub_repo.set_ubicaciones(folio, ubicaciones, current_version=1)
    assert updated is not None

    # Ejecutar cálculo con repositorio real
    calc_repo = CalculoRepository(mock_db)
    service = CalculoService(calc_repo)
    result = await service.ejecutar_calculo(folio)

    rf = result["resultado_financiero"]
    assert rf["total_ubicaciones_calculadas"] == 2
    assert rf["total_ubicaciones_omitidas"] == 0

    primas = rf["primas_por_ubicacion"]
    assert len(primas) == 2
    primas_netas = sorted([p["prima_neta_ubicacion"] for p in primas], reverse=True)
    # Esperado: 1_000_000 * 0.005 = 5000 ; 300_000 * 0.005 = 1500
    assert 5000.0 in primas_netas
    assert 1500.0 in primas_netas
