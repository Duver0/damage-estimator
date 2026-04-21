"""Utility: limpia colecciones de test (uso manual).

ADVERTENCIA: Este script elimina datos. Solo ejecútalo conscientemente.

Para ejecutar en local:
  FORCE_CLEAN=1 python fixtures/clean_test_data.py
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

COLLS_TO_DROP = [
    "cotizaciones_danos",
    "parametros_calculo",
    "tarifas_incendio",
    "tarifas_cat",
    "catalogo_cp_zonas",
    "catalogo_giros",
    "catalogo_garantias",
    "catalogo_agentes",
    "dim_zona_tev",
    "dim_zona_fhm",
]


async def run():
    if os.environ.get("FORCE_CLEAN") != "1":
        print("Setear FORCE_CLEAN=1 para confirmar la operación. Abortando.")
        return 1

    url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("MONGODB_DB_NAME", "cotizador_danos")
    client = AsyncIOMotorClient(url)
    db = client[db_name]

    for c in COLLS_TO_DROP:
        try:
            await db.drop_collection(c)
            print(f"Dropped {c}")
        except Exception as e:
            print(f"Failed dropping {c}: {e}")

    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
