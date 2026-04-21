"""
Schemas Pydantic v2 para la entidad Cotizacion y sus sub-documentos.
Cubre SPEC-001 (Folios), SPEC-002 (Ubicaciones), SPEC-003 (Cálculo) y SPEC-005 (Database).
"""
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ---------------------------------------------------------------------------
# Enums del dominio
# ---------------------------------------------------------------------------

class EstadoCotizacion(str, Enum):
    CREADA = "CREADA"
    COTIZADA = "COTIZADA"
    CANCELADA = "CANCELADA"


class TipoPersona(str, Enum):
    FISICA = "FISICA"
    MORAL = "MORAL"


class TipoIdentificacion(str, Enum):
    CC = "CC"
    NIT = "NIT"
    CE = "CE"
    PASAPORTE = "PASAPORTE"


class TipoNegocio(str, Enum):
    COMERCIAL = "COMERCIAL"
    RESIDENCIAL = "RESIDENCIAL"
    INDUSTRIAL = "INDUSTRIAL"
    SERVICIOS = "SERVICIOS"


class ClasificacionRiesgo(str, Enum):
    BAJO = "BAJO"
    MEDIO = "MEDIO"
    ALTO = "ALTO"


class TipoConstructivo(str, Enum):
    LADRILLO_CONCRETO = "LADRILLO_CONCRETO"
    ACERO = "ACERO"
    MADERA = "MADERA"
    HORMIGON_ARMADO = "HORMIGON_ARMADO"


class EstadoValidacion(str, Enum):
    COMPLETA = "COMPLETA"
    INCOMPLETA = "INCOMPLETA"


# ---------------------------------------------------------------------------
# Sub-modelos: Datos del asegurado y conducción
# ---------------------------------------------------------------------------

class DatosAseguradoBase(BaseModel):
    nombre: str = Field(..., max_length=200, description="Nombre del asegurado")
    apellidos: Optional[str] = Field(None, max_length=200)
    tipo_persona: Optional[TipoPersona] = TipoPersona.FISICA
    numero_identificacion: Optional[str] = Field(None, max_length=50)
    tipo_identificacion: Optional[TipoIdentificacion] = TipoIdentificacion.CC
    email: Optional[str] = Field(None, max_length=200)
    telefono: Optional[str] = Field(None, max_length=20)


class DatosAseguradoCreate(DatosAseguradoBase):
    nombre: str = Field(..., min_length=1, max_length=200)


class DatosAseguradoResponse(DatosAseguradoBase):
    pass


class DatosConduccionBase(BaseModel):
    codigo_agente: str = Field(..., min_length=1, max_length=20)
    nombre_agente: Optional[str] = Field(None, max_length=200)
    correo_agente: Optional[str] = Field(None, max_length=200)


class DatosConduccionCreate(DatosConduccionBase):
    pass


class DatosConduccionResponse(DatosConduccionBase):
    pass


# ---------------------------------------------------------------------------
# Sub-modelos: Opciones de cobertura
# ---------------------------------------------------------------------------

class OpcionCobertura(BaseModel):
    cobertura: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=100)
    descripcion: Optional[str] = Field(None, max_length=300)
    activa: bool = False
    obligatoria: bool = False


class OpcionCoberturaUpdate(BaseModel):
    cobertura: str
    activa: bool


# ---------------------------------------------------------------------------
# Sub-modelos: Layout
# ---------------------------------------------------------------------------

class ConfiguracionLayout(BaseModel):
    cantidad_ubicaciones: int = Field(default=0, ge=0)
    puede_agregar_mas: bool = True


# ---------------------------------------------------------------------------
# Sub-modelos: Garantías y Ubicaciones
# ---------------------------------------------------------------------------

class GarantiaInput(BaseModel):
    codigo_garantia: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=200)
    suma_asegurada: float = Field(..., gt=0)
    prima: Optional[float] = Field(default=0.0, ge=0)
    tasa: Optional[float] = Field(default=0.0, ge=0)


class GarantiaResponse(GarantiaInput):
    pass


class GiroInfo(BaseModel):
    clave_giro: Optional[str] = Field(None, max_length=20)
    clave_incendio: Optional[str] = Field(None, max_length=20)
    descripcion: Optional[str] = Field(None, max_length=300)


class AlertaUbicacion(BaseModel):
    tipo: str
    mensaje: str


class UbicacionInput(BaseModel):
    nombre_ubicacion: str = Field(..., max_length=200)
    direccion: str = Field(..., max_length=500)
    codigo_postal: str = Field(..., max_length=6)

    @field_validator("codigo_postal")
    @classmethod
    def validate_codigo_postal(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Código postal debe ser 6 dígitos numéricos (Colombia)")
        return v
    estado: str = Field(..., max_length=100)
    municipio: str = Field(..., max_length=200)
    colonia: Optional[str] = Field(None, max_length=200)
    ciudad: str = Field(..., max_length=200)
    tipo_constructivo: TipoConstructivo
    nivel: int = Field(..., ge=1)
    anio_construccion: int = Field(..., ge=1900, le=2100)
    giro: GiroInfo
    garantias: List[GarantiaInput] = Field(default_factory=list)

    @field_validator("anio_construccion")
    @classmethod
    def validate_anio_construccion(cls, v: int) -> int:
        from datetime import datetime
        current_year = datetime.utcnow().year
        if v > current_year:
            raise ValueError(f"Año de construcción no puede ser mayor a {current_year}")
        return v


class UbicacionResponse(UbicacionInput):
    indice: int
    zona_catastrofica: bool = False
    estado_validacion: EstadoValidacion = EstadoValidacion.INCOMPLETA
    alertas_bloqueantes: List[AlertaUbicacion] = Field(default_factory=list)
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Sub-modelos: Resultados de cálculo
# ---------------------------------------------------------------------------

class PrimaComponente(BaseModel):
    cobertura: str
    nombre: str
    suma_asegurada: float
    tasa: float
    factor_zona: float = 1.0
    factor_construccion: float = 1.0
    factor_giro: float = 1.0
    recargo_cat: float = 0.0
    prima_unitaria: float
    prima_calculada: float


class PrimaUbicacion(BaseModel):
    ubicacion_indice: int
    nombre_ubicacion: str
    primas_componentes: List[PrimaComponente]
    prima_neta_ubicacion: float
    prima_comercial_ubicacion: float
    alertas: List[AlertaUbicacion] = Field(default_factory=list)
    fecha_calculo: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Modelos principales de request/response
# ---------------------------------------------------------------------------

class CotizacionCreate(BaseModel):
    datos_asegurado: DatosAseguradoCreate
    datos_conduccion: DatosConduccionCreate
    tipo_negocio: TipoNegocio = TipoNegocio.COMERCIAL
    clasificacion_riesgo: Optional[ClasificacionRiesgo] = ClasificacionRiesgo.MEDIO


class CotizacionResponse(BaseModel):
    numero_folio: str
    estado_cotizacion: EstadoCotizacion
    datos_asegurado: Optional[DatosAseguradoResponse] = None
    datos_conduccion: Optional[DatosConduccionResponse] = None
    tipo_negocio: Optional[TipoNegocio] = None
    clasificacion_riesgo: Optional[ClasificacionRiesgo] = None
    configuracion_layout: Optional[ConfiguracionLayout] = None
    opciones_cobertura: List[OpcionCobertura] = Field(default_factory=list)
    ubicaciones: List[UbicacionResponse] = Field(default_factory=list)
    prima_neta: Optional[float] = None
    prima_comercial: Optional[float] = None
    primas_por_ubicacion: List[PrimaUbicacion] = Field(default_factory=list)
    version: int
    fecha_creacion: datetime
    fecha_ultima_actualizacion: datetime


class GeneralInfoUpdate(BaseModel):
    version: int = Field(..., ge=1)
    datos_asegurado: Optional[DatosAseguradoBase] = None
    datos_conduccion: Optional[DatosConduccionBase] = None
    tipo_negocio: Optional[TipoNegocio] = None


class GeneralInfoResponse(BaseModel):
    numero_folio: str
    datos_asegurado: Optional[DatosAseguradoResponse] = None
    datos_conduccion: Optional[DatosConduccionResponse] = None
    tipo_negocio: Optional[TipoNegocio] = None
    clasificacion_riesgo: Optional[ClasificacionRiesgo] = None
    version: int
    fecha_ultima_actualizacion: datetime


class CoverageOptionsUpdate(BaseModel):
    version: int = Field(..., ge=1)
    opciones_cobertura: List[OpcionCoberturaUpdate]


class CoverageOptionsResponse(BaseModel):
    numero_folio: str
    opciones_cobertura: List[OpcionCobertura]
    version: int


class EstadoSeccion(BaseModel):
    datos_generales_completo: bool
    ubicaciones_capturadas: int
    ubicaciones_completas: int
    ubicaciones_incompletas: int
    coberturas_definidas: bool
    calculo_realizado: bool


class AlertaEstado(BaseModel):
    tipo: str
    ubicacion_indice: Optional[int] = None
    mensaje: str


class CotizacionStateResponse(BaseModel):
    numero_folio: str
    estado_cotizacion: EstadoCotizacion
    estados_seccion: EstadoSeccion
    alertas: List[AlertaEstado] = Field(default_factory=list)
    version: int
    fecha_ultima_actualizacion: datetime


class LayoutUpdate(BaseModel):
    version: int = Field(..., ge=1)
    cantidad_ubicaciones: int = Field(..., ge=1)


class LayoutResponse(BaseModel):
    numero_folio: str
    configuracion_layout: ConfiguracionLayout
    version: int
    fecha_ultima_actualizacion: Optional[datetime] = None


class UbicacionesUpdate(BaseModel):
    version: int = Field(..., ge=1)
    ubicaciones: List[UbicacionInput]


class UbicacionesResponse(BaseModel):
    numero_folio: str
    ubicaciones: List[UbicacionResponse]
    version: int
    fecha_ultima_actualizacion: Optional[datetime] = None


class UbicacionPatch(BaseModel):
    version: int = Field(..., ge=1)
    nombre_ubicacion: Optional[str] = Field(None, max_length=200)
    direccion: Optional[str] = Field(None, max_length=500)
    codigo_postal: Optional[str] = Field(None, max_length=6)
    estado: Optional[str] = Field(None, max_length=100)
    municipio: Optional[str] = Field(None, max_length=200)
    colonia: Optional[str] = Field(None, max_length=200)
    ciudad: Optional[str] = Field(None, max_length=200)
    tipo_constructivo: Optional[TipoConstructivo] = None
    nivel: Optional[int] = Field(None, ge=1)
    anio_construccion: Optional[int] = Field(None, ge=1900, le=2100)
    giro: Optional[GiroInfo] = None
    garantias: Optional[List[GarantiaInput]] = None


class ResumenUbicaciones(BaseModel):
    total_ubicaciones: int
    ubicaciones_completas: int
    ubicaciones_incompletas: int
    porcentaje_completitud: float


class AlertaResumen(BaseModel):
    ubicacion_indice: int
    tipo: str
    mensaje: str


class UbicacionesSummaryResponse(BaseModel):
    numero_folio: str
    resumen: ResumenUbicaciones
    alertas: List[AlertaResumen] = Field(default_factory=list)
    version: int


class CalculoResponse(BaseModel):
    numero_folio: str
    estado_cotizacion: EstadoCotizacion
    resultado_financiero: dict
    version: int
    alertas: List[AlertaEstado] = Field(default_factory=list)
