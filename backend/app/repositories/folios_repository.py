"""
Repository: acceso a datos para cotizaciones (Motor async).
Capa de datos pura — sin lógica de negocio.
"""
from datetime import datetime
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase


class FoliosRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["cotizaciones_danos"]

    async def create(self, doc: dict) -> dict:
        """Inserta un nuevo documento de cotización."""
        result = await self.collection.insert_one(doc)
        created = await self.collection.find_one({"_id": result.inserted_id})
        return self._serialize(created)

    async def find_by_folio(self, folio: str) -> Optional[dict]:
        """Busca cotización por numeroFolio."""
        doc = await self.collection.find_one({"numero_folio": folio})
        return self._serialize(doc) if doc else None

    async def find_by_idempotency_key(self, key: str) -> Optional[dict]:
        """Busca cotización por idempotency key."""
        doc = await self.collection.find_one({"metadatos.idempotency_key": key})
        return self._serialize(doc) if doc else None

    async def update_general_info(
        self, folio: str, update_data: dict, current_version: int
    ) -> Optional[dict]:
        """
        Actualización con versionado optimista.
        Retorna None si la versión no coincide.
        """
        new_version = current_version + 1
        result = await self.collection.find_one_and_update(
            {"numero_folio": folio, "version": current_version},
            {"$set": {**update_data, "version": new_version, "fecha_ultima_actualizacion": datetime.utcnow()}},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def update_field(self, folio: str, field_path: str, value, current_version: int) -> Optional[dict]:
        """Actualiza un campo específico con versionado optimista."""
        new_version = current_version + 1
        result = await self.collection.find_one_and_update(
            {"numero_folio": folio, "version": current_version},
            {
                "$set": {
                    field_path: value,
                    "version": new_version,
                    "fecha_ultima_actualizacion": datetime.utcnow(),
                }
            },
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def update_multiple_fields(
        self, folio: str, fields: dict, current_version: int
    ) -> Optional[dict]:
        """Actualiza múltiples campos con versionado optimista."""
        new_version = current_version + 1
        set_data = {**fields, "version": new_version, "fecha_ultima_actualizacion": datetime.utcnow()}
        result = await self.collection.find_one_and_update(
            {"numero_folio": folio, "version": current_version},
            {"$set": set_data},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def find_all(self) -> list:
        """Retorna todas las cotizaciones ordenadas por fecha de creación descendente."""
        docs = await self.collection.find({}).sort("fecha_creacion", -1).to_list(None)
        return [self._serialize(doc) for doc in docs]

    async def get_next_folio_sequence(self, date_str: str) -> int:
        """
        Calcula el siguiente número secuencial de folio para una fecha dada.
        Patrón: F<YYYYMMDD><5_digitos>
        """
        prefix = f"F{date_str}"
        count = await self.collection.count_documents(
            {"numero_folio": {"$regex": f"^{prefix}"}}
        )
        return count + 1

    async def delete_by_folio(self, folio: str) -> bool:
        """Elimina una cotización por folio."""
        result = await self.collection.delete_one({"numero_folio": folio})
        return result.deleted_count > 0

    @staticmethod
    def _serialize(doc: Optional[dict]) -> Optional[dict]:
        """Convierte ObjectId a string para la respuesta."""
        if doc is None:
            return None
        result = dict(doc)
        if "_id" in result:
            result["_id"] = str(result["_id"])
        return result
