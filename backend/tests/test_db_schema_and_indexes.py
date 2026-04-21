import importlib.util
from pathlib import Path
from datetime import datetime

import pytest


def _load_seed_module():
    seed_path = Path(__file__).parents[1] / "fixtures" / "seed.py"
    spec = importlib.util.spec_from_file_location("seed", seed_path)
    seed = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(seed)
    return seed


async def _get_index_key_tuples(collection):
    info = await collection.index_information()
    keys = []
    for v in info.values():
        k = v.get("key")
        if isinstance(k, list):
            keys.append(tuple(pair[0] for pair in k))
        else:
            # defensive fallback
            keys.append(tuple())
    return keys


async def _find_index_info(collection, key_tuple):
    info = await collection.index_information()
    for name, v in info.items():
        k = v.get("key")
        if isinstance(k, list) and tuple(pair[0] for pair in k) == key_tuple:
            return v
    return None


@pytest.mark.asyncio
async def test_seed_create_indexes_and_unique_numero_folio(mock_db):
    """Seed.create_indexes debe crear índices esperados y aplicar unicidad a `numero_folio`."""
    seed = _load_seed_module()
    # Ejecutar creación de índices sobre la BD de prueba
    await seed.create_indexes(mock_db)

    cot = mock_db["cotizaciones_danos"]

    keys = await _get_index_key_tuples(cot)
    assert ("numero_folio",) in keys, "Índice sobre 'numero_folio' no encontrado"

    # Verificar que el índice sobre numero_folio sea unique
    idx_info = await _find_index_info(cot, ("numero_folio",))
    assert idx_info is not None
    assert idx_info.get("unique", False) is True

    # Intentar insertar documento duplicado debe lanzar DuplicateKeyError
    from pymongo.errors import DuplicateKeyError

    doc = {
        "numero_folio": "F2026041700001",
        "version": 1,
        "fecha_creacion": datetime.utcnow(),
        "fecha_ultima_actualizacion": datetime.utcnow(),
    }

    await cot.insert_one(doc)
    with pytest.raises(DuplicateKeyError):
        await cot.insert_one(doc)


@pytest.mark.asyncio
async def test_parametros_calculo_has_version_index(mock_db):
    """La colección `parametros_calculo` debe tener índice en `version` según la spec."""
    seed = _load_seed_module()
    await seed.create_indexes(mock_db)

    params = mock_db["parametros_calculo"]
    keys = await _get_index_key_tuples(params)

    assert ("version",) in keys, "Falta índice 'version' en parametros_calculo"
