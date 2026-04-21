"""
Service: lógica de negocio para gestión de folios y cotizaciones.
SPEC-001 — HU-01 a HU-06
"""
import json
import os
from datetime import datetime
from typing import Optional
from fastapi import HTTPException

from app.repositories.folios_repository import FoliosRepository
from app.models.cotizacion_model import (
    CotizacionCreate,
    EstadoCotizacion,
    TipoNegocio,
    OpcionCobertura,
)


# Coberturas por defecto al crear una cotización
DEFAULT_COBERTURAS = [
    {
        "cobertura": "INCENDIO_EDIFICIOS",
        "nombre": "Incendio Edificios",
        "descripcion": "Cobertura de incendio en estructura del edificio",
        "activa": True,
        "obligatoria": True,
    },
    {
        "cobertura": "INCENDIO_CONTENIDOS",
        "nombre": "Incendio Contenidos",
        "descripcion": "Cobertura de incendio en contenidos y bienes muebles",
        "activa": False,
        "obligatoria": False,
    },
    {
        "cobertura": "CATTEV",
        "nombre": "CAT Terremotos y Erupciones Volcánicas",
        "descripcion": "Cobertura de daños por terremoto",
        "activa": False,
        "obligatoria": False,
    },
    {
        "cobertura": "CATFHM",
        "nombre": "CAT Fenómeno Hidrometeorológico",
        "descripcion": "Cobertura de daños por ciclones e inundaciones",
        "activa": False,
        "obligatoria": False,
    },
    {
        "cobertura": "ROBO",
        "nombre": "Robo con Violencia",
        "descripcion": "Cobertura de robo con violencia",
        "activa": False,
        "obligatoria": False,
    },
]


def _load_agents_fixture() -> list:
    """Carga el fixture de agentes desde el sistema de archivos."""
    fixture_path = os.path.join(os.path.dirname(__file__), "../../fixtures/agents.json")
    fixture_path = os.path.abspath(fixture_path)
    try:
        with open(fixture_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _validate_agent(codigo_agente: str) -> dict:
    """Valida que el código de agente existe en el catálogo."""
    agents = _load_agents_fixture()
    agent = next((a for a in agents if a["codigo"] == codigo_agente and a.get("activo", True)), None)
    if not agent:
        raise HTTPException(
            status_code=400,
            detail=f"Validación fallida: codigoAgente '{codigo_agente}' no encontrado en catálogo",
        )
    return agent


def _generate_folio(date_str: str, sequence: int) -> str:
    """Genera numero de folio: F<YYYYMMDD><5_dígitos>"""
    return f"F{date_str}{sequence:05d}"


class FoliosService:
    def __init__(self, repo: FoliosRepository):
        self.repo = repo

    async def create_folio(
        self, create_dto: CotizacionCreate, idempotency_key: Optional[str] = None
    ) -> dict:
        """
        Crea un nuevo folio con idempotencia.
        Si se provee idempotency_key y ya existe, retorna el existente.
        """
        # CRITERIO-1.3: Idempotencia
        if idempotency_key:
            existing = await self.repo.find_by_idempotency_key(idempotency_key)
            if existing:
                return existing

        # Validar agente
        agent = _validate_agent(create_dto.datos_conduccion.codigo_agente)

        # Generar folio
        now = datetime.utcnow()
        date_str = now.strftime("%Y%m%d")
        sequence = await self.repo.get_next_folio_sequence(date_str)
        numero_folio = _generate_folio(date_str, sequence)

        doc = {
            "numero_folio": numero_folio,
            "estado_cotizacion": EstadoCotizacion.CREADA.value,
            "datos_asegurado": create_dto.datos_asegurado.model_dump(),
            "datos_conduccion": {
                **create_dto.datos_conduccion.model_dump(),
                "nombre_agente": agent.get("nombre"),
                "correo_agente": agent.get("correo"),
            },
            "tipo_negocio": create_dto.tipo_negocio.value,
            "clasificacion_riesgo": create_dto.clasificacion_riesgo.value if create_dto.clasificacion_riesgo else "MEDIO",
            "configuracion_layout": {
                "cantidad_ubicaciones": 0,
                "puede_agregar_mas": True,
            },
            "opciones_cobertura": DEFAULT_COBERTURAS,
            "ubicaciones": [],
            "prima_neta": None,
            "prima_comercial": None,
            "primas_por_ubicacion": [],
            "version": 1,
            "fecha_creacion": now,
            "fecha_ultima_actualizacion": now,
            "metadatos": {
                "idempotency_key": idempotency_key,
                "usuario_creacion": None,
                "ultimo_usuario_actualizacion": None,
            },
        }

        return await self.repo.create(doc)

    async def get_general_info(self, folio: str) -> dict:
        """Obtiene datos generales de una cotización."""
        doc = await self.repo.find_by_folio(folio)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")
        return doc

    async def update_general_info(self, folio: str, update_dto) -> dict:
        """
        Actualiza datos generales con versionado optimista.
        CRITERIO-3.1, 3.2, 3.4 (actualización parcial)
        """
        current = await self.repo.find_by_folio(folio)
        if not current:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")

        # Validar versión
        if current["version"] != update_dto.version:
            raise HTTPException(
                status_code=409,
                detail=f"Versión desactualizada. Version actual es {current['version']}, esperada {update_dto.version}",
            )

        update_fields = {}

        # Actualización parcial: solo campos presentes
        if update_dto.datos_asegurado is not None:
            current_asegurado = current.get("datos_asegurado", {}) or {}
            patch = update_dto.datos_asegurado.model_dump(exclude_none=True)
            merged = {**current_asegurado, **patch}
            update_fields["datos_asegurado"] = merged

        if update_dto.datos_conduccion is not None:
            # Validar agente si se cambia
            if update_dto.datos_conduccion.codigo_agente:
                agent = _validate_agent(update_dto.datos_conduccion.codigo_agente)
                current_conduccion = current.get("datos_conduccion", {}) or {}
                patch = update_dto.datos_conduccion.model_dump(exclude_none=True)
                patch["nombre_agente"] = agent.get("nombre")
                patch["correo_agente"] = agent.get("correo")
                merged = {**current_conduccion, **patch}
                update_fields["datos_conduccion"] = merged

        if update_dto.tipo_negocio is not None:
            update_fields["tipo_negocio"] = update_dto.tipo_negocio.value

        if not update_fields:
            return current

        result = await self.repo.update_multiple_fields(folio, update_fields, update_dto.version)
        if result is None:
            # Conflicto de versión (race condition)
            fresh = await self.repo.find_by_folio(folio)
            raise HTTPException(
                status_code=409,
                detail=f"Versión desactualizada. Version actual es {fresh['version'] if fresh else 'desconocida'}",
            )
        return result

    async def get_coverage_options(self, folio: str) -> dict:
        """Obtiene opciones de cobertura disponibles."""
        doc = await self.repo.find_by_folio(folio)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")
        return doc

    async def update_coverage_options(self, folio: str, update_dto) -> dict:
        """Actualiza las opciones de cobertura seleccionadas."""
        current = await self.repo.find_by_folio(folio)
        if not current:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")

        if current["version"] != update_dto.version:
            raise HTTPException(
                status_code=409,
                detail=f"Versión desactualizada. Version actual es {current['version']}, esperada {update_dto.version}",
            )

        current_opciones = {o["cobertura"]: o for o in (current.get("opciones_cobertura") or [])}

        for opt in update_dto.opciones_cobertura:
            if opt.cobertura in current_opciones:
                current_opciones[opt.cobertura]["activa"] = opt.activa

        updated_list = list(current_opciones.values())
        result = await self.repo.update_multiple_fields(
            folio, {"opciones_cobertura": updated_list}, update_dto.version
        )
        if result is None:
            fresh = await self.repo.find_by_folio(folio)
            raise HTTPException(
                status_code=409,
                detail=f"Versión desactualizada. Version actual es {fresh['version'] if fresh else 'desconocida'}",
            )
        return result

    async def list_quotations(self) -> list:
        """Lista todas las cotizaciones con resumen."""
        docs = await self.repo.find_all()

        resumen = []
        for doc in docs:
            datos_asegurado = doc.get("datos_asegurado") or {}
            resumen.append({
                "numero_folio": doc.get("numero_folio"),
                "estado_cotizacion": doc.get("estado_cotizacion"),
                "nombre_asegurado": datos_asegurado.get("nombre", "N/A"),
                "prima_neta": doc.get("prima_neta"),
                "prima_comercial": doc.get("prima_comercial"),
                "fecha_creacion": doc.get("fecha_creacion"),
                "fecha_ultima_actualizacion": doc.get("fecha_ultima_actualizacion"),
            })

        return resumen

    async def get_state(self, folio: str) -> dict:
        """Calcula y retorna el estado de la cotización."""
        doc = await self.repo.find_by_folio(folio)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")

        ubicaciones = doc.get("ubicaciones") or []
        completas = sum(1 for u in ubicaciones if u.get("estado_validacion") == "COMPLETA")
        incompletas = len(ubicaciones) - completas

        datos_asegurado = doc.get("datos_asegurado") or {}
        datos_generales_completo = bool(
            datos_asegurado.get("nombre") and
            doc.get("datos_conduccion", {}) and
            doc.get("tipo_negocio")
        )

        coberturas = doc.get("opciones_cobertura") or []
        coberturas_definidas = any(c.get("activa") for c in coberturas)

        calculo_realizado = doc.get("prima_neta") is not None

        alertas = []
        for u in ubicaciones:
            if u.get("estado_validacion") == "INCOMPLETA":
                for alerta in u.get("alertas_bloqueantes") or []:
                    alertas.append({
                        "tipo": "INCOMPLETO",
                        "ubicacion_indice": u.get("indice"),
                        "mensaje": f"Ubicación {u.get('indice', '?') + 1} incompleta: {alerta.get('mensaje', '')}",
                    })

        return {
            "numero_folio": folio,
            "estado_cotizacion": doc.get("estado_cotizacion"),
            "estados_seccion": {
                "datos_generales_completo": datos_generales_completo,
                "ubicaciones_capturadas": len(ubicaciones),
                "ubicaciones_completas": completas,
                "ubicaciones_incompletas": incompletas,
                "coberturas_definidas": coberturas_definidas,
                "calculo_realizado": calculo_realizado,
            },
            "alertas": alertas,
            "prima_neta": doc.get("prima_neta"),
            "prima_comercial": doc.get("prima_comercial"),
            "version": doc.get("version"),
            "fecha_ultima_actualizacion": doc.get("fecha_ultima_actualizacion"),
        }

    async def delete_folio(self, folio: str) -> dict:
        """Elimina una cotización por folio."""
        doc = await self.repo.find_by_folio(folio)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")

        await self.repo.delete_by_folio(folio)
        return {"mensaje": f"Cotización {folio} eliminada"}
