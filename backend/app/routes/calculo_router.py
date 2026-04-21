"""
Router: endpoint de cálculo de primas.
SPEC-003 — POST /v1/quotes/{folio}/calculate
"""
from fastapi import APIRouter, Depends

from app.core.database import get_database
from app.repositories.calculo_repository import CalculoRepository
from app.services.calculo_service import CalculoService

router = APIRouter()


def get_calculo_service(db=Depends(get_database)) -> CalculoService:
    repo = CalculoRepository(db)
    return CalculoService(repo)


# ---------------------------------------------------------------------------
# POST /v1/quotes/{folio}/calculate — Ejecutar cálculo de prima
# ---------------------------------------------------------------------------

@router.post("/quotes/{folio}/calculate")
async def calculate(
    folio: str,
    service: CalculoService = Depends(get_calculo_service),
):
    """
    Ejecuta el cálculo de prima para una cotización.
    Implementa las 8 fases del algoritmo de tarificación.
    CRITERIO-12.1, 12.2, 12.3, 12.4
    """
    return await service.ejecutar_calculo(folio)
