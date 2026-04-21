"""
Router: endpoints de gestión de folios y cotizaciones.
SPEC-001 — POST /v1/folios, GET/PUT /v1/quotes/{folio}/general-info,
           GET/PUT /v1/quotes/{folio}/coverage-options, GET /v1/quotes/{folio}/state
"""
from fastapi import APIRouter, Depends, Header
from typing import Optional

from app.core.database import get_database
from app.repositories.folios_repository import FoliosRepository
from app.services.folios_service import FoliosService
from app.models.cotizacion_model import (
    CotizacionCreate,
    GeneralInfoUpdate,
    CoverageOptionsUpdate,
)

router = APIRouter()


def get_folios_service(db=Depends(get_database)) -> FoliosService:
    repo = FoliosRepository(db)
    return FoliosService(repo)


# ---------------------------------------------------------------------------
# POST /v1/folios — Crear nuevo folio
# ---------------------------------------------------------------------------

@router.post("/folios", status_code=201)
async def create_folio(
    body: CotizacionCreate,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    service: FoliosService = Depends(get_folios_service),
):
    """
    Crea un nuevo folio de cotización.
    CRITERIO-1.1, 1.2, 1.3 (idempotencia)
    """
    return await service.create_folio(body, idempotency_key)


# ---------------------------------------------------------------------------
# GET /v1/quotes/list — Listar todas las cotizaciones
# ---------------------------------------------------------------------------

@router.get("/quotes/list")
async def list_quotations(
    service: FoliosService = Depends(get_folios_service),
):
    """
    Lista todas las cotizaciones con resumen.
    """
    return await service.list_quotations()


# ---------------------------------------------------------------------------
# GET /v1/quotes/{folio}/general-info — Consultar datos generales
# ---------------------------------------------------------------------------

@router.get("/quotes/{folio}/general-info")
async def get_general_info(
    folio: str,
    service: FoliosService = Depends(get_folios_service),
):
    """
    Obtiene datos generales de una cotización.
    CRITERIO-2.1, 2.2
    """
    return await service.get_general_info(folio)


# ---------------------------------------------------------------------------
# PUT /v1/quotes/{folio}/general-info — Actualizar datos generales
# ---------------------------------------------------------------------------

@router.put("/quotes/{folio}/general-info")
async def update_general_info(
    folio: str,
    body: GeneralInfoUpdate,
    service: FoliosService = Depends(get_folios_service),
):
    """
    Actualiza datos generales con versionado optimista.
    CRITERIO-3.1, 3.2, 3.3, 3.4
    """
    return await service.update_general_info(folio, body)


# ---------------------------------------------------------------------------
# GET /v1/quotes/{folio}/coverage-options — Consultar opciones de cobertura
# ---------------------------------------------------------------------------

@router.get("/quotes/{folio}/coverage-options")
async def get_coverage_options(
    folio: str,
    service: FoliosService = Depends(get_folios_service),
):
    """
    Obtiene opciones de cobertura disponibles.
    CRITERIO-4.1
    """
    return await service.get_coverage_options(folio)


# ---------------------------------------------------------------------------
# PUT /v1/quotes/{folio}/coverage-options — Actualizar coberturas
# ---------------------------------------------------------------------------

@router.put("/quotes/{folio}/coverage-options")
async def update_coverage_options(
    folio: str,
    body: CoverageOptionsUpdate,
    service: FoliosService = Depends(get_folios_service),
):
    """
    Actualiza opciones de cobertura seleccionadas.
    CRITERIO-5.1
    """
    return await service.update_coverage_options(folio, body)


# ---------------------------------------------------------------------------
# GET /v1/quotes/{folio}/state — Consultar estado de la cotización
# ---------------------------------------------------------------------------

@router.get("/quotes/{folio}/state")
async def get_state(
    folio: str,
    service: FoliosService = Depends(get_folios_service),
):
    """
    Obtiene el estado actual de la cotización.
    CRITERIO-6.1
    """
    return await service.get_state(folio)


# ---------------------------------------------------------------------------
# DELETE /v1/quotes/{folio} — Eliminar cotización
# ---------------------------------------------------------------------------

@router.delete("/quotes/{folio}")
async def delete_folio(
    folio: str,
    service: FoliosService = Depends(get_folios_service),
):
    """
    Elimina una cotización.
    """
    return await service.delete_folio(folio)
