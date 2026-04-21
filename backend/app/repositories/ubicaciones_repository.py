"""
Repository: operaciones sobre ubicaciones dentro de cotizaciones.
"""
from datetime import datetime
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase


class UbicacionesRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["cotizaciones_danos"]
        self.cp_collection = db["catalogo_cp_zonas"]
        self.giros_collection = db["catalogo_giros"]
        self.garantias_collection = db["catalogo_garantias"]

    # ---------------------------------------------------------
    # Layout
    # ---------------------------------------------------------

    async def set_layout(
        self, folio: str, cantidad: int, current_version: int
    ) -> Optional[dict]:
        """Actualiza configuracion de layout con versionado optimista."""
        new_version = current_version + 1
        result = await self.collection.find_one_and_update(
            {"numero_folio": folio, "version": current_version},
            {
                "$set": {
                    "configuracion_layout.cantidad_ubicaciones": cantidad,
                    "configuracion_layout.puede_agregar_mas": True,
                    "version": new_version,
                    "fecha_ultima_actualizacion": datetime.utcnow(),
                }
            },
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def get_layout(self, folio: str) -> Optional[dict]:
        """Obtiene configuracion de layout de una cotización."""
        doc = await self.collection.find_one(
            {"numero_folio": folio},
            {"configuracion_layout": 1, "version": 1, "numero_folio": 1},
        )
        return self._serialize(doc) if doc else None

    # ---------------------------------------------------------
    # Ubicaciones
    # ---------------------------------------------------------

    async def set_ubicaciones(
        self, folio: str, ubicaciones: List[dict], current_version: int
    ) -> Optional[dict]:
        """Reemplaza array completo de ubicaciones con versionado optimista."""
        new_version = current_version + 1
        result = await self.collection.find_one_and_update(
            {"numero_folio": folio, "version": current_version},
            {
                "$set": {
                    "ubicaciones": ubicaciones,
                    "version": new_version,
                    "fecha_ultima_actualizacion": datetime.utcnow(),
                }
            },
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def get_ubicaciones(self, folio: str) -> Optional[dict]:
        """Obtiene todas las ubicaciones de una cotización."""
        doc = await self.collection.find_one(
            {"numero_folio": folio},
            {"ubicaciones": 1, "version": 1, "numero_folio": 1, "fecha_ultima_actualizacion": 1},
        )
        return self._serialize(doc) if doc else None

    async def update_ubicacion(
        self, folio: str, indice: int, fields: dict, current_version: int
    ) -> Optional[dict]:
        """
        Actualiza campos de una ubicación específica por índice.
        Usa operador posicional $ con condición en el filtro.
        """
        # Construir set con prefijo del array
        set_data = {f"ubicaciones.{indice}.{k}": v for k, v in fields.items()}
        set_data["version"] = current_version + 1
        set_data["fecha_ultima_actualizacion"] = datetime.utcnow()

        result = await self.collection.find_one_and_update(
            {
                "numero_folio": folio,
                "version": current_version,
                f"ubicaciones.{indice}": {"$exists": True},
            },
            {"$set": set_data},
            return_document=True,
        )
        return self._serialize(result) if result else None

    async def get_ubicacion(self, folio: str, indice: int) -> Optional[dict]:
        """Obtiene una ubicación específica por índice."""
        doc = await self.collection.find_one(
            {"numero_folio": folio, f"ubicaciones.{indice}": {"$exists": True}},
            {"ubicaciones": 1, "version": 1, "numero_folio": 1},
        )
        if not doc:
            return None
        serialized = self._serialize(doc)
        ubicaciones = serialized.get("ubicaciones", [])
        # Buscar por campo indice dentro del array
        for ub in ubicaciones:
            if ub.get("indice") == indice:
                return ub
        return None

    # ---------------------------------------------------------
    # Catálogos (solo lectura)
    # ---------------------------------------------------------

    async def find_cp(self, codigo_postal: str) -> Optional[dict]:
        """Busca un código postal en el catálogo."""
        doc = await self.cp_collection.find_one({"codigo_postal": codigo_postal})
        return self._serialize(doc) if doc else None

    async def find_giro(self, clave_giro: str) -> Optional[dict]:
        """Busca un giro en el catálogo."""
        doc = await self.giros_collection.find_one({"clave_giro": clave_giro})
        return self._serialize(doc) if doc else None

    async def find_garantia(self, codigo_garantia: str) -> Optional[dict]:
        """Busca una garantía en el catálogo."""
        doc = await self.garantias_collection.find_one({"codigo_garantia": codigo_garantia})
        return self._serialize(doc) if doc else None

    @staticmethod
    def _serialize(doc: Optional[dict]) -> Optional[dict]:
        if doc is None:
            return None
        result = dict(doc)
        if "_id" in result:
            result["_id"] = str(result["_id"])
        return result
