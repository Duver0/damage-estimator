"""
Punto de entrada de la aplicación FastAPI - Cotizador de Daños.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routes.folios_router import router as folios_router
from app.routes.ubicaciones_router import router as ubicaciones_router
from app.routes.calculo_router import router as calculo_router
from app.routes.catalogos_router import router as catalogos_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API REST para el cotizador de daños — FastAPI + MongoDB",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — permitir frontend local en desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Eventos de ciclo de vida
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()


# Registrar routers bajo prefijo /v1
PREFIX = settings.api_prefix  # "/v1"

app.include_router(folios_router, prefix=PREFIX, tags=["Folios"])
app.include_router(ubicaciones_router, prefix=PREFIX, tags=["Ubicaciones"])
app.include_router(calculo_router, prefix=PREFIX, tags=["Cálculo"])
app.include_router(catalogos_router, prefix=PREFIX, tags=["Catálogos"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": settings.app_version}
