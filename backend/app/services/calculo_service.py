"""
Service: lógica de cálculo de primas (8 fases).
SPEC-003 — HU-12
"""
from datetime import datetime
from typing import List, Tuple
from fastapi import HTTPException

from app.repositories.calculo_repository import CalculoRepository


class CalculoService:
    def __init__(self, repo: CalculoRepository):
        self.repo = repo

    async def ejecutar_calculo(self, folio: str) -> dict:
        """
        Ejecuta el cálculo de prima para una cotización completa.
        Implementa el algoritmo de 8 fases definido en SPEC-003.
        """
        # Fase 1: Leer cotización
        cotizacion = await self.repo.get_cotizacion(folio)
        if not cotizacion:
            raise HTTPException(status_code=404, detail=f"Folio {folio} no encontrado")

        # Fase 2: Leer parámetros de cálculo
        parametros = await self.repo.get_parametros_activos()
        if not parametros:
            raise HTTPException(
                status_code=500,
                detail="Error: Parámetros de cálculo no encontrados o incompletos",
            )

        # Fase 3: Validar que existan ubicaciones calculables
        ubicaciones = cotizacion.get("ubicaciones") or []
        ubicaciones_validas = [
            u for u in ubicaciones if u.get("estado_validacion") == "COMPLETA"
        ]
        ubicaciones_invalidas = [
            u for u in ubicaciones if u.get("estado_validacion") != "COMPLETA"
        ]

        if not ubicaciones_validas:
            raise HTTPException(
                status_code=400, detail="No hay ubicaciones válidas para calcular"
            )

        # Fases 4-5: Calcular prima por ubicación
        primas_por_ubicacion = []
        alertas = []

        for ubicacion in ubicaciones_validas:
            prima_ub = await self._calcular_prima_ubicacion(
                ubicacion, parametros, cotizacion.get("opciones_cobertura") or []
            )
            primas_por_ubicacion.append(prima_ub)

        # Alertas de ubicaciones omitidas
        for ub_invalida in ubicaciones_invalidas:
            alertas.append({
                "tipo": "INCOMPLETO",
                "ubicacion_indice": ub_invalida.get("indice"),
                "mensaje": f"Ubicación {(ub_invalida.get('indice') or 0) + 1} omitida del cálculo: incompleta",
            })

        # Fase 6: Consolidar prima neta total
        prima_neta_total = sum(p["prima_neta_ubicacion"] for p in primas_por_ubicacion)
        prima_neta_total = round(prima_neta_total, 2)

        # Fase 7: Derivar prima comercial
        margen = parametros.get("margen_comercial", 0.35)
        prima_comercial_total = round(prima_neta_total * (1 + margen), 2)

        # Fase 8: Persistir sin sobrescribir otras secciones
        resultado = {
            "prima_neta": prima_neta_total,
            "prima_comercial": prima_comercial_total,
            "primas_por_ubicacion": primas_por_ubicacion,
        }

        current_version = cotizacion.get("version", 1)
        updated = await self.repo.update_resultado_financiero(folio, resultado, current_version)
        if updated is None:
            raise HTTPException(
                status_code=409,
                detail="Conflicto al persistir resultado del cálculo. Reintente.",
            )

        return {
            "numero_folio": folio,
            "estado_cotizacion": "COTIZADA",
            "resultado_financiero": {
                "prima_neta": prima_neta_total,
                "prima_comercial": prima_comercial_total,
                "margen_aplicado": margen,
                "primas_por_ubicacion": primas_por_ubicacion,
                "total_ubicaciones_calculadas": len(primas_por_ubicacion),
                "total_ubicaciones_omitidas": len(ubicaciones_invalidas),
                "fecha_ultimo_calculo": datetime.utcnow().isoformat(),
                "parametros_utilizados": {
                    "margen_comercial": margen,
                    "version_parametros": parametros.get("version", "1.0"),
                },
            },
            "version": updated.get("version"),
            "alertas": alertas,
        }

    async def _calcular_prima_ubicacion(
        self, ubicacion: dict, parametros: dict, coberturas_activas: list
    ) -> dict:
        """
        Calcula la prima para una ubicación completa.
        Aplica la fórmula simplificada de SPEC-003.
        """
        clave_incendio = (ubicacion.get("giro") or {}).get("clave_incendio")
        tipo_constructivo = ubicacion.get("tipo_constructivo", "LADRILLO_CONCRETO")
        zona_cat = ubicacion.get("zona_catastrofica", False)

        # Obtener tarifas del catálogo
        tarifas_raw = await self.repo.get_tarifas_por_giro(clave_incendio)
        tarifas_por_garantia = {t["garantia"]: t for t in tarifas_raw} if tarifas_raw else {}

        # Factores de parámetros
        factores_construccion = parametros.get("factores_construccion", {})
        factor_construccion = factores_construccion.get(tipo_constructivo, 1.0)

        factores_zona = parametros.get("factores_zona_cat", {})
        factor_zona = factores_zona.get("APLICABLE", 1.5) if zona_cat else factores_zona.get("NO_APLICABLE", 1.0)

        recargos_cat = parametros.get("recargos_cat", {})

        # Coberturas activas de la cotización
        coberturas_activas_set = {
            c["cobertura"] for c in coberturas_activas if c.get("activa")
        }

        primas_componentes = []
        garantias = ubicacion.get("garantias") or []

        for garantia in garantias:
            codigo_garantia = garantia.get("codigo_garantia")
            suma_asegurada = garantia.get("suma_asegurada", 0)

            # Obtener tasa del catálogo (o usar tasa del documento si no hay en catálogo)
            tarifa = tarifas_por_garantia.get(codigo_garantia)
            if tarifa:
                tasa = tarifa.get("tasa", 0.005)
                factor_giro = tarifa.get("factor_riesgo", 1.0)
            else:
                # Tasa por defecto si no hay tarifa específica
                tasa = garantia.get("tasa", 0.005)
                factor_giro = 1.0

            # Recargo CAT: aplica solo si la cobertura CAT está activa
            recargo_cat = 0.0
            if codigo_garantia == "CATFHM" and "CATFHM" in coberturas_activas_set:
                recargo_cat = recargos_cat.get("CATFHM", 0.25)
            elif codigo_garantia == "CATTEV" and "CATTEV" in coberturas_activas_set:
                recargo_cat = recargos_cat.get("CATTEV", 0.15)

            # Fórmula: Prima = SA × Tasa × FZona × FConstrucción × FGiro × (1 + RecargoCat)
            prima_unitaria = suma_asegurada * tasa
            prima_calculada = prima_unitaria * factor_zona * factor_construccion * factor_giro * (1 + recargo_cat)
            prima_calculada = round(prima_calculada, 2)

            primas_componentes.append({
                "cobertura": codigo_garantia,
                "nombre": garantia.get("nombre", codigo_garantia),
                "suma_asegurada": suma_asegurada,
                "tasa": tasa,
                "factor_zona": factor_zona,
                "factor_construccion": factor_construccion,
                "factor_giro": factor_giro,
                "recargo_cat": recargo_cat,
                "prima_unitaria": round(prima_unitaria, 2),
                "prima_calculada": prima_calculada,
            })

        prima_neta_ubicacion = round(sum(p["prima_calculada"] for p in primas_componentes), 2)
        margen = parametros.get("margen_comercial", 0.35)
        prima_comercial_ubicacion = round(prima_neta_ubicacion * (1 + margen), 2)

        return {
            "ubicacion_indice": ubicacion.get("indice"),
            "nombre_ubicacion": ubicacion.get("nombre_ubicacion"),
            "primas_componentes": primas_componentes,
            "prima_neta_ubicacion": prima_neta_ubicacion,
            "prima_comercial_ubicacion": prima_comercial_ubicacion,
            "alertas": [],
            "fecha_calculo": datetime.utcnow().isoformat(),
        }

    def calcular_prima_garantia(
        self,
        suma_asegurada: float,
        tasa: float,
        factor_zona: float,
        factor_construccion: float,
        factor_giro: float,
        recargo_cat: float,
    ) -> float:
        """
        Calcula la prima para una garantía individual (método público para tests).
        Fórmula: SA × Tasa × FZona × FConstrucción × FGiro × (1 + RecargoCat)
        """
        prima = suma_asegurada * tasa * factor_zona * factor_construccion * factor_giro * (1 + recargo_cat)
        return round(prima, 2)

    def consolidar_resultados(self, primas_ubicaciones: list, margen: float) -> dict:
        """Consolida los resultados de múltiples ubicaciones."""
        prima_neta = round(sum(p["prima_neta_ubicacion"] for p in primas_ubicaciones), 2)
        prima_comercial = round(prima_neta * (1 + margen), 2)
        return {
            "prima_neta": prima_neta,
            "prima_comercial": prima_comercial,
            "margen_aplicado": margen,
        }
