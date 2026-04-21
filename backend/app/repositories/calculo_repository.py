"""
Repository: acceso a datos para cálculo de primas.
"""
from datetime import datetime
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase


class CalculoRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["cotizaciones_danos"]
        self.params_collection = db["parametros_calculo"]
        self.tarifas_collection = db["tarifas_incendio"]
        self.tarifas_cat_collection = db["tarifas_cat"]
        self.dim_zona_tev = db["dim_zona_tev"]
        self.dim_zona_fhm = db["dim_zona_fhm"]

    async def get_cotizacion(self, folio: str) -> Optional[dict]:
        """Obtiene cotización completa para cálculo."""
        doc = await self.collection.find_one({"numero_folio": folio})
        return self._serialize(doc) if doc else None

    async def get_parametros_activos(self) -> Optional[dict]:
        """Obtiene los parámetros de cálculo activos."""
        doc = await self.params_collection.find_one({"activo": True})
        return self._serialize(doc) if doc else None

    async def get_tarifas_por_giro(self, clave_incendio: str) -> list:
        """Obtiene todas las tarifas para una clave de incendio."""
        cursor = self.tarifas_collection.find(
            {"clave_incendio": clave_incendio, "vigente": True}
        )
        docs = await cursor.to_list(length=100)
        return [self._serialize(d) for d in docs]

    async def get_tarifas_cat_por_giro(self, clave_giro: str) -> list:
        """Obtiene tarifas CAT (CATFHM/CATTEV) para un giro específico."""
        cursor = self.tarifas_cat_collection.find({"clave_giro": clave_giro, "vigente": True})
        docs = await cursor.to_list(length=100)
        return [self._serialize(d) for d in docs]

    async def get_dim_zona_tev(self, zona: str) -> Optional[dict]:
        doc = await self.dim_zona_tev.find_one({"zona": zona})
        return self._serialize(doc) if doc else None

    async def get_dim_zona_fhm(self, zona: str) -> Optional[dict]:
        doc = await self.dim_zona_fhm.find_one({"zona": zona})
        return self._serialize(doc) if doc else None

    async def update_resultado_financiero(
        self, folio: str, resultado: dict, current_version: int
    ) -> Optional[dict]:
        """
        Persiste resultados del cálculo sin sobrescribir otras secciones.
        Solo modifica: primaNeta, primaComercial, primasPorUbicacion, estadoCotizacion, version.
        """
        new_version = current_version + 1
        set_data = {
            "prima_neta": resultado["prima_neta"],
            "prima_comercial": resultado["prima_comercial"],
            "primas_por_ubicacion": resultado["primas_por_ubicacion"],
            "estado_cotizacion": "COTIZADA",
            "version": new_version,
            "fecha_ultima_actualizacion": datetime.utcnow(),
        }
        result = await self.collection.find_one_and_update(
            {"numero_folio": folio, "version": current_version},
            {"$set": set_data},
            return_document=True,
        )
        return self._serialize(result) if result else None

    @staticmethod
    def _serialize(doc: Optional[dict]) -> Optional[dict]:
        if doc is None:
            return None
        result = dict(doc)
        if "_id" in result:
            result["_id"] = str(result["_id"])
        return result
