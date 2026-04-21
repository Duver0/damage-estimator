from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from app.core.config import settings


class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None


db_manager = DatabaseManager()


async def connect_to_mongo() -> None:
    """Establece la conexión con MongoDB al iniciar la app."""
    db_manager.client = AsyncIOMotorClient(settings.mongodb_url)
    db_manager.db = db_manager.client[settings.mongodb_db_name]
    # Verificar conexión
    await db_manager.client.admin.command("ping")


async def close_mongo_connection() -> None:
    """Cierra la conexión con MongoDB al detener la app."""
    if db_manager.client:
        db_manager.client.close()


def get_database() -> AsyncIOMotorDatabase:
    """Dependencia FastAPI: retorna la instancia de base de datos."""
    if db_manager.db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo first.")
    return db_manager.db
