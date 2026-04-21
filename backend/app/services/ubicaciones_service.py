"""
Service: lógica de negocio para gestión de ubicaciones.
SPEC-002 — HU-07 a HU-11
"""
from datetime import datetime
from typing import List, Tuple
from fastapi import HTTPException

from app.repositories.ubicaciones_repository import UbicacionesRepository
from app.models.cotizacion_model import UbicacionInput, EstadoValidacion


class UbicacionesService:
    def __init__(self, repo: UbicacionesRepository):
        self.repo = repo

    # ---------------------------------------------------------
    # Layout
    # ---------------------------------------------------------

    async def set_layout(self, folio: str, cantidad: int, version: int) -> dict:
        """
        Configura el layout de ubicaciones.
        CRITERIO-7.1, 7.2
        """
        if cantidad < 1:
            raise HTTPException(
                status_code=400, detail="cantidadUbicaciones debe ser >= 1"
            )

        current = await self.repo.collection.find_one({"numero_folio": folio})
        if not current:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")

        if current["version"] != version:
            raise HTTPException(
                status_code=409,
                detail=f"Versión desactualizada. Version actual es {current['version']}, esperada {version}",
            )

        result = await self.repo.set_layout(folio, cantidad, version)
        if result is None:
            fresh = await self.repo.collection.find_one({"numero_folio": folio})
            raise HTTPException(
                status_code=409,
                detail=f"Versión desactualizada. Version actual es {fresh['version'] if fresh else 'desconocida'}",
            )
        return result

    async def get_layout(self, folio: str) -> dict:
        """Obtiene el layout de una cotización."""
        result = await self.repo.get_layout(folio)
        if not result:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")
        return result

    # ---------------------------------------------------------
    # Ubicaciones
    # ---------------------------------------------------------

    async def set_ubicaciones(self, folio: str, ubicaciones: List[UbicacionInput], version: int) -> dict:
        """
        Registra o reemplaza el array completo de ubicaciones.
        Valida cada ubicación y calcula estadoValidacion.
        CRITERIO-8.1, 8.2, 8.3
        """
        current = await self.repo.collection.find_one({"numero_folio": folio})
        if not current:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")

        if current["version"] != version:
            raise HTTPException(
                status_code=409,
                detail=f"Versión desactualizada. Version actual es {current['version']}, esperada {version}",
            )

        docs = []
        for idx, ub in enumerate(ubicaciones):
            # Validar CP contra catálogo
            cp_info = await self.repo.find_cp(ub.codigo_postal)
            if not cp_info:
                raise HTTPException(
                    status_code=400,
                    detail=f"Validación fallida en ubicación índice {idx}: Código postal {ub.codigo_postal} no válido",
                )

            # Calcular zona catastrófica
            zona_cat = cp_info.get("es_zona_cat", False)

            # Calcular estado de validación y alertas
            es_valida, alertas = self._validate_ubicacion(ub)

            doc = {
                "indice": idx,
                "nombre_ubicacion": ub.nombre_ubicacion,
                "direccion": ub.direccion,
                "codigo_postal": ub.codigo_postal,
                "estado": cp_info.get("estado", ub.estado),
                "municipio": cp_info.get("municipio", ub.municipio),
                "colonia": ub.colonia or cp_info.get("colonia"),
                "ciudad": cp_info.get("ciudad", ub.ciudad),
                "tipo_constructivo": ub.tipo_constructivo.value,
                "nivel": ub.nivel,
                "anio_construccion": ub.anio_construccion,
                "giro": ub.giro.model_dump(),
                "garantias": [g.model_dump() for g in ub.garantias],
                "zona_catastrofica": zona_cat,
                "estado_validacion": EstadoValidacion.COMPLETA.value if es_valida else EstadoValidacion.INCOMPLETA.value,
                "alertas_bloqueantes": alertas,
                "fecha_creacion": datetime.utcnow(),
                "fecha_actualizacion": datetime.utcnow(),
            }
            docs.append(doc)

        result = await self.repo.set_ubicaciones(folio, docs, version)
        if result is None:
            fresh = await self.repo.collection.find_one({"numero_folio": folio})
            raise HTTPException(
                status_code=409,
                detail=f"Versión desactualizada. Version actual es {fresh['version'] if fresh else 'desconocida'}",
            )
        return result

    async def get_ubicaciones(self, folio: str) -> dict:
        """Obtiene todas las ubicaciones de una cotización."""
        result = await self.repo.get_ubicaciones(folio)
        if not result:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")
        return result

    async def update_ubicacion(self, folio: str, indice: int, patch_data, version: int) -> dict:
        """
        Actualiza parcialmente una ubicación específica.
        CRITERIO-10.1, 10.2
        """
        current = await self.repo.collection.find_one({"numero_folio": folio})
        if not current:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")

        if current["version"] != version:
            raise HTTPException(
                status_code=409,
                detail=f"Versión desactualizada. Version actual es {current['version']}, esperada {version}",
            )

        # Verificar que el índice existe
        ubicaciones = current.get("ubicaciones") or []
        ub_current = next((u for u in ubicaciones if u.get("indice") == indice), None)
        if ub_current is None:
            raise HTTPException(
                status_code=404, detail=f"Ubicación en índice {indice} no existe"
            )

        # Construir diccionario de campos a actualizar
        update_dict = patch_data.model_dump(exclude_none=True, exclude={"version"})

        # Si se actualiza CP, re-validar
        cp_to_check = update_dict.get("codigo_postal", ub_current.get("codigo_postal"))
        cp_info = await self.repo.find_cp(cp_to_check)
        if not cp_info:
            raise HTTPException(
                status_code=400,
                detail=f"Código postal {cp_to_check} no válido",
            )

        # Aplicar datos del CP
        if "codigo_postal" in update_dict:
            update_dict["estado"] = cp_info.get("estado", ub_current.get("estado"))
            update_dict["municipio"] = cp_info.get("municipio", ub_current.get("municipio"))
            update_dict["ciudad"] = cp_info.get("ciudad", ub_current.get("ciudad"))
            update_dict["zona_catastrofica"] = cp_info.get("es_zona_cat", False)

        # Serializar tipo_constructivo si es enum
        if "tipo_constructivo" in update_dict and hasattr(update_dict["tipo_constructivo"], "value"):
            update_dict["tipo_constructivo"] = update_dict["tipo_constructivo"].value

        # Serializar giro si presente
        if "giro" in update_dict and hasattr(update_dict["giro"], "model_dump"):
            update_dict["giro"] = update_dict["giro"].model_dump()

        # Serializar garantias si presente
        if "garantias" in update_dict:
            garantias = update_dict["garantias"]
            if garantias and hasattr(garantias[0], "model_dump"):
                update_dict["garantias"] = [g.model_dump() for g in garantias]

        # Recalcular estado de validación con los datos fusionados
        merged = {**ub_current, **update_dict}
        is_valid, alertas = self._validate_dict_ubicacion(merged)
        update_dict["estado_validacion"] = EstadoValidacion.COMPLETA.value if is_valid else EstadoValidacion.INCOMPLETA.value
        update_dict["alertas_bloqueantes"] = alertas
        update_dict["fecha_actualizacion"] = datetime.utcnow()

        result = await self.repo.update_ubicacion(folio, indice, update_dict, version)
        if result is None:
            raise HTTPException(
                status_code=409,
                detail="Versión desactualizada o ubicación no encontrada",
            )

        # Retornar la ubicación actualizada
        updated_ubicaciones = result.get("ubicaciones") or []
        updated_ub = next((u for u in updated_ubicaciones if u.get("indice") == indice), None)
        return updated_ub or {}

    async def get_summary(self, folio: str) -> dict:
        """Calcula el resumen de completitud de ubicaciones. CRITERIO-11.1"""
        result = await self.repo.get_ubicaciones(folio)
        if not result:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")

        ubicaciones = result.get("ubicaciones") or []
        total = len(ubicaciones)
        completas = sum(1 for u in ubicaciones if u.get("estado_validacion") == "COMPLETA")
        incompletas = total - completas
        porcentaje = round((completas / total) * 100, 1) if total > 0 else 0.0

        alertas = []
        for u in ubicaciones:
            if u.get("estado_validacion") == "INCOMPLETA":
                for alerta in u.get("alertas_bloqueantes") or []:
                    alertas.append({
                        "ubicacion_indice": u.get("indice"),
                        "tipo": "INCOMPLETO",
                        "mensaje": alerta.get("mensaje", ""),
                    })

        return {
            "numero_folio": folio,
            "resumen": {
                "total_ubicaciones": total,
                "ubicaciones_completas": completas,
                "ubicaciones_incompletas": incompletas,
                "porcentaje_completitud": porcentaje,
            },
            "alertas": alertas,
            "version": result.get("version"),
        }

    # ---------------------------------------------------------
    # Validación interna
    # ---------------------------------------------------------

    def _validate_ubicacion(self, ub: UbicacionInput) -> Tuple[bool, list]:
        """Valida una UbicacionInput y retorna (es_valida, alertas)."""
        alertas = []

        if not ub.giro or not ub.giro.clave_incendio:
            alertas.append({
                "tipo": "FALTA_CLAVE_INCENDIO",
                "mensaje": "Requiere giro con claveIncendio para cálculo",
            })

        if not ub.garantias or len(ub.garantias) == 0:
            alertas.append({
                "tipo": "FALTA_GARANTIA",
                "mensaje": "Requiere al menos una garantía para cálculo",
            })

        return len(alertas) == 0, alertas

    def _validate_dict_ubicacion(self, ub_dict: dict) -> Tuple[bool, list]:
        """Valida un diccionario de ubicación y retorna (es_valida, alertas)."""
        alertas = []

        giro = ub_dict.get("giro") or {}
        if isinstance(giro, dict):
            clave_incendio = giro.get("clave_incendio")
        else:
            clave_incendio = getattr(giro, "clave_incendio", None)

        if not clave_incendio:
            alertas.append({
                "tipo": "FALTA_CLAVE_INCENDIO",
                "mensaje": "Requiere giro con claveIncendio para cálculo",
            })

        garantias = ub_dict.get("garantias") or []
        if not garantias:
            alertas.append({
                "tipo": "FALTA_GARANTIA",
                "mensaje": "Requiere al menos una garantía para cálculo",
            })

        return len(alertas) == 0, alertas
