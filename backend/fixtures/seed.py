"""
Script de seed: carga todos los fixtures en MongoDB.
Uso: python fixtures/seed.py
"""
import asyncio
import json
import os
import sys
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

# Agregar ruta del proyecto al path
sys.path.insert(0, str(Path(__file__).parent.parent))

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("MONGODB_DB_NAME", "cotizador_danos")

FIXTURES_DIR = Path(__file__).parent


async def load_fixture(db, collection_name: str, fixture_file: str, unique_field) -> int:
    """Carga un fixture en una colección, evitando duplicados.

    unique_field puede ser str (campo único) o list[str] (clave compuesta).
    """
    fixture_path = FIXTURES_DIR / fixture_file
    if not fixture_path.exists():
        print(f"  [SKIP] {fixture_file} no encontrado")
        return 0

    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict):
        data = [data]

    collection = db[collection_name]
    inserted = 0

    fields = [unique_field] if isinstance(unique_field, str) else unique_field

    for doc in data:
        query = {f: doc.get(f) for f in fields}
        if any(v is None for v in query.values()):
            continue
        existing = await collection.find_one(query)
        if not existing:
            await collection.insert_one(doc)
            inserted += 1

    return inserted


async def create_indexes(db) -> None:
    """Crea índices necesarios en todas las colecciones."""
    # Ensure collections exist and (optionally) JSON Schema validators are applied.
    # This is best-effort: some test backends (mongomock) may not support collMod/create_collection with validators.
    try:
        await _ensure_validators(db)
    except Exception:
        # Non-fatal in test environments
        print("  [WARN] Validators could not be created (test env may not support them)")
    # cotizaciones_danos
    await db.cotizaciones_danos.create_index("numero_folio", unique=True)
    await db.cotizaciones_danos.create_index("estado_cotizacion")
    await db.cotizaciones_danos.create_index("tipo_negocio")
    await db.cotizaciones_danos.create_index("fecha_creacion")
    await db.cotizaciones_danos.create_index([("version", 1), ("numero_folio", 1)])
    await db.cotizaciones_danos.create_index("metadatos.idempotency_key", sparse=True)

    # parametros_calculo
    await db.parametros_calculo.create_index("codigo_parametro", unique=True)
    await db.parametros_calculo.create_index("activo")
    await db.parametros_calculo.create_index("version")

    # tarifas_incendio
    await db.tarifas_incendio.create_index([("clave_giro", 1), ("clave_incendio", 1)])
    await db.tarifas_incendio.create_index("garantia")
    await db.tarifas_incendio.create_index("vigente")

    # tarifas_cat (CAT rates)
    await db.tarifas_cat.create_index([("clave_giro", 1), ("coberturaCat", 1)])
    await db.tarifas_cat.create_index("vigente")

    # catalogo_cp_zonas
    await db.catalogo_cp_zonas.create_index("codigo_postal", unique=True)
    await db.catalogo_cp_zonas.create_index("estado")
    await db.catalogo_cp_zonas.create_index("es_zona_cat")

    # catalogo_giros
    await db.catalogo_giros.create_index("clave_giro", unique=True)
    await db.catalogo_giros.create_index("clave_incendio")
    await db.catalogo_giros.create_index("activo")

    # catalogo_garantias
    await db.catalogo_garantias.create_index("codigo_garantia", unique=True)
    await db.catalogo_garantias.create_index("grupo")
    await db.catalogo_garantias.create_index("activa")

    # catalogo_agentes
    await db.catalogo_agentes.create_index("codigo", unique=True)

    # dimensiones de zona
    await db.dim_zona_tev.create_index("zona", unique=True)
    await db.dim_zona_fhm.create_index("zona", unique=True)

    print("  [OK] Índices creados")


async def _ensure_validators(db):
    """Crea colecciones con validators JSON Schema cuando sea posible.

    Esto es "best effort" para entornos locales de desarrollo y no debe
    fallar los tests en entornos que no soportan estas operaciones.
    """
    validators = {
        "cotizaciones_danos": {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["numero_folio", "estado_cotizacion", "version", "fecha_creacion"],
                "properties": {
                    "numero_folio": {"bsonType": "string", "pattern": "^F[0-9]{12}$"},
                    "estado_cotizacion": {"enum": ["CREADA", "COTIZADA", "CANCELADA"]},
                    "version": {"bsonType": "int", "minimum": 1},
                    "fecha_creacion": {"bsonType": "date"},
                    "fecha_ultima_actualizacion": {"bsonType": "date"},
                },
            }
        },
        "parametros_calculo": {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["codigo_parametro", "activo"],
                "properties": {
                    "codigo_parametro": {"bsonType": "string"},
                    "version": {"bsonType": "string"},
                    "activo": {"bsonType": "bool"},
                },
            }
        },
        "catalogo_cp_zonas": {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["codigo_postal", "estado"],
                "properties": {
                    "codigo_postal": {"bsonType": "string", "pattern": "^[0-9]{6}$"},
                    "estado": {"bsonType": "string"},
                    "es_zona_cat": {"bsonType": "bool"},
                },
            }
        },
    }

    for name, validator in validators.items():
        try:
            existing = await db.list_collection_names()
            if name in existing:
                # Try to modify validator if supported
                try:
                    await db.command({
                        "collMod": name,
                        "validator": validator,
                        "validationLevel": "moderate",
                        "validationAction": "warn",
                    })
                    print(f"  [OK] Validator applied to existing collection {name}")
                except Exception:
                    # Best effort: ignore failures in test env
                    print(f"  [WARN] collMod not supported for {name}; skipping")
            else:
                try:
                    await db.create_collection(name, validator=validator, validationLevel="moderate", validationAction="warn")
                    print(f"  [OK] Collection {name} created with validator")
                except Exception:
                    print(f"  [WARN] create_collection with validator failed for {name}; skipping")
        except Exception as e:
            print(f"  [WARN] Error ensuring validator for {name}: {e}")


async def seed():
    """Ejecuta la carga completa de fixtures."""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    print(f"Conectando a {MONGODB_URL} / {DB_NAME}")
    await client.admin.command("ping")
    print("Conexión exitosa.\n")

    print("Creando índices...")
    await create_indexes(db)

    print("\nCargando fixtures:")

    count = await load_fixture(db, "catalogo_agentes", "agents.json", "codigo")
    print(f"  catalogo_agentes: {count} documentos insertados")

    count = await load_fixture(db, "catalogo_giros", "business_lines.json", "clave_giro")
    print(f"  catalogo_giros: {count} documentos insertados")

    count = await load_fixture(db, "catalogo_cp_zonas", "zip_codes.json", "codigo_postal")
    print(f"  catalogo_cp_zonas: {count} documentos insertados")

    count = await load_fixture(db, "catalogo_garantias", "guarantees.json", "codigo_garantia")
    print(f"  catalogo_garantias: {count} documentos insertados")

    count = await load_fixture(db, "tarifas_incendio", "tariffs.json", ["clave_giro", "garantia"])
    print(f"  tarifas_incendio: {count} documentos insertados")

    count = await load_fixture(db, "tarifas_cat", "tariffs_cat.json", ["clave_giro", "coberturaCat"])
    print(f"  tarifas_cat: {count} documentos insertados")

    count = await load_fixture(db, "parametros_calculo", "calc_params.json", "codigo_parametro")
    print(f"  parametros_calculo: {count} documentos insertados")

    count = await load_fixture(db, "dim_zona_tev", "dim_zona_tev.json", "zona")
    print(f"  dim_zona_tev: {count} documentos insertados")

    count = await load_fixture(db, "dim_zona_fhm", "dim_zona_fhm.json", "zona")
    print(f"  dim_zona_fhm: {count} documentos insertados")

    client.close()
    print("\nSeed completado exitosamente.")


if __name__ == "__main__":
    asyncio.run(seed())
