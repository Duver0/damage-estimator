"""Utility: valida que los índices esperados existan en la base de datos.

Uso (local):
  python fixtures/validate_indexes.py

La URL de Mongo se toma de `MONGODB_URL` y la DB de `MONGODB_DB_NAME`.
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

EXPECTED = {
    "cotizaciones_danos": [
        ("numero_folio",),
        ("fecha_creacion",),
        (("version", 1), ("numero_folio", 1)),
    ],
    "parametros_calculo": [("codigo_parametro",), ("version",)],
    "tarifas_incendio": [(("clave_giro", 1), ("clave_incendio", 1))],
    "tarifas_cat": [(("clave_giro", 1), ("coberturaCat", 1))],
    "catalogo_cp_zonas": [("codigo_postal",)],
}


async def run():
    url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("MONGODB_DB_NAME", "cotizador_danos")
    client = AsyncIOMotorClient(url)
    db = client[db_name]

    ok = True
    for coll, expected_idxs in EXPECTED.items():
        print(f"\nColección: {coll}")
        try:
            info = await db[coll].index_information()
        except Exception as e:
            print(f"  ERROR al obtener índices: {e}")
            ok = False
            continue

        existing = []
        for v in info.values():
            k = v.get("key")
            if isinstance(k, list):
                existing.append(tuple(pair[0] for pair in k))
            else:
                existing.append(tuple())

        for ei in expected_idxs:
            # normalize expected representation
            if isinstance(ei[0], tuple) and len(ei) > 1 and isinstance(ei[0][0], tuple):
                # composite with order
                key_tuple = tuple(k[0] for k in ei)
            elif isinstance(ei[0], tuple) and len(ei[0]) == 2 and isinstance(ei[0][1], int):
                key_tuple = tuple(k[0] for k in ei)
            else:
                key_tuple = ei if isinstance(ei, tuple) else (ei,)

            if key_tuple in existing:
                print(f"  OK índice presente: {key_tuple}")
            else:
                print(f"  MISSING índice: {key_tuple}")
                ok = False

    client.close()
    return 0 if ok else 2


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
