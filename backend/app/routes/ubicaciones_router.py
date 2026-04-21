"""
Router: endpoints de gestión de ubicaciones.
SPEC-002 — PUT/GET /v1/quotes/{folio}/locations/layout,
           PUT/GET /v1/quotes/{folio}/locations,
           PATCH   /v1/quotes/{folio}/locations/{indice},
           GET     /v1/quotes/{folio}/locations/summary
"""
from fastapi import APIRouter, Depends

from app.core.database import get_database
from app.repositories.ubicaciones_repository import UbicacionesRepository
from app.services.ubicaciones_service import UbicacionesService
from app.models.cotizacion_model import (
    LayoutUpdate,
    UbicacionesUpdate,
    UbicacionPatch,
)

router = APIRouter()


def get_ubicaciones_service(db=Depends(get_database)) -> UbicacionesService:
    repo = UbicacionesRepository(db)
    return UbicacionesService(repo)


# ---------------------------------------------------------------------------
# PUT /v1/quotes/{folio}/locations/layout — Definir layout
# ---------------------------------------------------------------------------

@router.put("/quotes/{folio}/locations/layout")
async def set_layout(
    folio: str,
    body: LayoutUpdate,
    service: UbicacionesService = Depends(get_ubicaciones_service),
):
    """
    Define el layout (cantidad de ubicaciones esperadas).
    CRITERIO-7.1, 7.2
    """
    return await service.set_layout(folio, body.cantidad_ubicaciones, body.version)


# ---------------------------------------------------------------------------
# GET /v1/quotes/{folio}/locations/layout — Consultar layout
# ---------------------------------------------------------------------------

@router.get("/quotes/{folio}/locations/layout")
async def get_layout(
    folio: str,
    service: UbicacionesService = Depends(get_ubicaciones_service),
):
    """Obtiene la configuración del layout."""
    return await service.get_layout(folio)


# ---------------------------------------------------------------------------
# GET /v1/quotes/{folio}/locations/summary — Resumen de completitud
# ---------------------------------------------------------------------------

@router.get("/quotes/{folio}/locations/summary")
async def get_summary(
    folio: str,
    service: UbicacionesService = Depends(get_ubicaciones_service),
):
    """
    Obtiene resumen de completitud de ubicaciones.
    CRITERIO-11.1
    """
    return await service.get_summary(folio)


# ---------------------------------------------------------------------------
# PUT /v1/quotes/{folio}/locations — Registrar/reemplazar ubicaciones
# ---------------------------------------------------------------------------

@router.put("/quotes/{folio}/locations")
async def set_ubicaciones(
    folio: str,
    body: UbicacionesUpdate,
    service: UbicacionesService = Depends(get_ubicaciones_service),
):
    """
    Registra o reemplaza el array completo de ubicaciones.
    CRITERIO-8.1, 8.2, 8.3
    """
    return await service.set_ubicaciones(folio, body.ubicaciones, body.version)


# ---------------------------------------------------------------------------
# GET /v1/quotes/{folio}/locations — Consultar ubicaciones
# ---------------------------------------------------------------------------

@router.get("/quotes/{folio}/locations")
async def get_ubicaciones(
    folio: str,
    service: UbicacionesService = Depends(get_ubicaciones_service),
):
    """Obtiene todas las ubicaciones registradas. CRITERIO-9.1"""
    return await service.get_ubicaciones(folio)


# ---------------------------------------------------------------------------
# PATCH /v1/quotes/{folio}/locations/{indice} — Editar ubicación individual
# ---------------------------------------------------------------------------

@router.patch("/quotes/{folio}/locations/{indice}")
async def update_ubicacion(
    folio: str,
    indice: int,
    body: UbicacionPatch,
    service: UbicacionesService = Depends(get_ubicaciones_service),
):
    """
    Actualiza parcialmente una ubicación específica.
    CRITERIO-10.1, 10.2
    """
    return await service.update_ubicacion(folio, indice, body, body.version)
