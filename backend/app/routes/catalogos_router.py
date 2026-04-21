"""
Router: endpoints de catálogos (agentes, giros, garantías, CP).
Sirve datos de fixtures para consumo del frontend.
"""
import json
import os
from fastapi import APIRouter, HTTPException

router = APIRouter()

FIXTURES_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../fixtures")
)


def _load_json(filename: str) -> list:
    path = os.path.join(FIXTURES_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(
            status_code=503,
            detail={"code": "CATALOG_UNAVAILABLE", "message": f"Catálogo {filename} no disponible"},
        )
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else [data]
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=503,
            detail={"code": "CATALOG_PARSE_ERROR", "message": f"Error al parsear {filename}: {str(e)}"},
        )


@router.get("/catalogs/agents")
async def get_agents():
    """Retorna lista de agentes activos."""
    agents = _load_json("agents.json")
    return [a for a in agents if a.get("activo", True)]


@router.get("/catalogs/business-lines")
async def get_business_lines():
    """Retorna lista de giros activos."""
    giros = _load_json("business_lines.json")
    return [g for g in giros if g.get("activo", True)]


@router.get("/catalogs/guarantees")
async def get_guarantees():
    """Retorna lista de garantías activas."""
    garantias = _load_json("guarantees.json")
    return [g for g in garantias if g.get("activa", True)]


@router.get("/catalogs/zip-codes/{codigo_postal}")
async def validate_zip_code(codigo_postal: str):
    """Valida y retorna información de un código postal colombiano (6 dígitos)."""
    if not codigo_postal.isdigit() or len(codigo_postal) != 6:
        raise HTTPException(
            status_code=422,
            detail={"code": "INVALID_CP_FORMAT", "message": "Código postal debe ser 6 dígitos numéricos", "field": "codigo_postal"},
        )
    zip_codes = _load_json("zip_codes.json")
    cp_info = next((z for z in zip_codes if z["codigo_postal"] == codigo_postal), None)
    if not cp_info:
        raise HTTPException(
            status_code=404,
            detail={"code": "CP_NOT_FOUND", "message": f"Código postal {codigo_postal} no encontrado", "field": "codigo_postal"},
        )
    return cp_info
