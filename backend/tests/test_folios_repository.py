"""
Tests de integración para FoliosRepository.
Usa mongomock-motor para simular MongoDB sin instancia real.
"""
import pytest
from datetime import datetime

from app.repositories.folios_repository import FoliosRepository


# ---------------------------------------------------------------------------
# Tests de integración con BD en memoria
# ---------------------------------------------------------------------------

class TestFoliosRepository:
    @pytest.mark.asyncio
    async def test_create_y_find_by_folio(self, mock_db):
        # GIVEN
        repo = FoliosRepository(mock_db)
        doc = {
            "numero_folio": "F2026041700001",
            "estado_cotizacion": "CREADA",
            "version": 1,
            "fecha_creacion": datetime.utcnow(),
            "fecha_ultima_actualizacion": datetime.utcnow(),
        }

        # WHEN
        created = await repo.create(doc)
        found = await repo.find_by_folio("F2026041700001")

        # THEN
        assert created["numero_folio"] == "F2026041700001"
        assert found is not None
        assert found["numero_folio"] == "F2026041700001"

    @pytest.mark.asyncio
    async def test_find_by_folio_not_found_returns_none(self, mock_db):
        repo = FoliosRepository(mock_db)
        result = await repo.find_by_folio("FNOEXISTE")
        assert result is None

    @pytest.mark.asyncio
    async def test_find_by_idempotency_key(self, mock_db):
        # GIVEN
        repo = FoliosRepository(mock_db)
        doc = {
            "numero_folio": "F2026041700002",
            "version": 1,
            "fecha_creacion": datetime.utcnow(),
            "fecha_ultima_actualizacion": datetime.utcnow(),
            "metadatos": {"idempotency_key": "key-abc-123"},
        }
        await repo.create(doc)

        # WHEN
        found = await repo.find_by_idempotency_key("key-abc-123")

        # THEN
        assert found is not None
        assert found["metadatos"]["idempotency_key"] == "key-abc-123"

    @pytest.mark.asyncio
    async def test_update_general_info_version_correcta(self, mock_db):
        # GIVEN
        repo = FoliosRepository(mock_db)
        doc = {
            "numero_folio": "F2026041700003",
            "version": 1,
            "datos_asegurado": {"nombre": "Original"},
            "fecha_creacion": datetime.utcnow(),
            "fecha_ultima_actualizacion": datetime.utcnow(),
        }
        await repo.create(doc)

        # WHEN
        updated = await repo.update_multiple_fields(
            "F2026041700003",
            {"datos_asegurado": {"nombre": "Actualizado"}},
            current_version=1,
        )

        # THEN
        assert updated is not None
        assert updated["version"] == 2
        assert updated["datos_asegurado"]["nombre"] == "Actualizado"

    @pytest.mark.asyncio
    async def test_update_version_incorrecta_retorna_none(self, mock_db):
        # GIVEN versión desactualizada
        repo = FoliosRepository(mock_db)
        doc = {
            "numero_folio": "F2026041700004",
            "version": 5,  # versión actual es 5
            "fecha_creacion": datetime.utcnow(),
            "fecha_ultima_actualizacion": datetime.utcnow(),
        }
        await repo.create(doc)

        # WHEN: intentar actualizar con versión 1 (incorrecta)
        result = await repo.update_multiple_fields(
            "F2026041700004",
            {"datos_asegurado": {"nombre": "Fallo"}},
            current_version=1,  # versión incorrecta
        )

        # THEN: retorna None (sin actualización)
        assert result is None

    @pytest.mark.asyncio
    async def test_get_next_folio_sequence(self, mock_db):
        # GIVEN sin folios previos
        repo = FoliosRepository(mock_db)

        # WHEN
        seq = await repo.get_next_folio_sequence("20260417")

        # THEN
        assert seq == 1

    @pytest.mark.asyncio
    async def test_get_next_folio_sequence_incrementa(self, mock_db):
        # GIVEN ya existe un folio para esa fecha
        repo = FoliosRepository(mock_db)
        doc = {
            "numero_folio": "F2026041700001",
            "version": 1,
            "fecha_creacion": datetime.utcnow(),
            "fecha_ultima_actualizacion": datetime.utcnow(),
        }
        await repo.create(doc)

        # WHEN
        seq = await repo.get_next_folio_sequence("20260417")

        # THEN: secuencia = 2
        assert seq == 2
