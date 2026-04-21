import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LocationsPage from '../../pages/LocationsPage/LocationsPage';

vi.mock('../../services/ubicacionesService', () => ({
  obtenerUbicaciones: vi.fn(),
  setLayout: vi.fn(),
  agregarUbicaciones: vi.fn(),
  editarUbicacion: vi.fn(),
  obtenerResumen: vi.fn(),
  getLayout: vi.fn(),
}));
vi.mock('../../services/catalogosService', () => ({
  obtenerGiros: vi.fn(),
  obtenerGarantias: vi.fn(),
  validarCodigoPostal: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { obtenerUbicaciones, setLayout, agregarUbicaciones } from '../../services/ubicacionesService';
import { obtenerGiros, obtenerGarantias, validarCodigoPostal } from '../../services/catalogosService';

const giros = [
  { clave_giro: 'OF', clave_incendio: 'OF_INC', descripcion: 'Oficinas' },
];
const garantias = [
  { codigo_garantia: 'INCENDIO', nombre: 'Incendio Edificios' },
];
const ubicacionesVacias = { ubicaciones: [], version: 0 };

const renderPage = (folio = 'F20260417-00001') =>
  render(
    <MemoryRouter initialEntries={[`/quotes/${folio}/locations`]}>
      <Routes>
        <Route path="/quotes/:folio/locations" element={<LocationsPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('LocationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerUbicaciones.mockResolvedValue(ubicacionesVacias);
    obtenerGiros.mockResolvedValue(giros);
    obtenerGarantias.mockResolvedValue(garantias);
  });

  it('renderiza el título Ubicaciones de Riesgo', async () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Ubicaciones de Riesgo')).toBeInTheDocument();
    });
  });

  it('muestra sección de cantidad de ubicaciones', async () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Cantidad de ubicaciones a asegurar')).toBeInTheDocument();
    });
  });

  it('muestra mensaje de 0 ubicaciones registradas', async () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText(/Ubicaciones registradas \(0\)/)).toBeInTheDocument();
    });
  });

  it('muestra las ubicaciones cargadas', async () => {
    // GIVEN
    obtenerUbicaciones.mockResolvedValue({
      ubicaciones: [
        {
          indice: 0,
          nombre_ubicacion: 'Oficina Principal',
          codigo_postal: '110111',
          estado: 'Bogotá DC',
          estado_validacion: 'COMPLETA',
          alertas_bloqueantes: [],
        },
      ],
      version: 1,
    });

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText(/Oficina Principal/)).toBeInTheDocument();
    });
  });

  it('botón Siguiente está deshabilitado cuando no hay ubicaciones', async () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Siguiente')).toBeDisabled();
    });
  });

  it('botón Siguiente está habilitado cuando hay ubicaciones', async () => {
    // GIVEN
    obtenerUbicaciones.mockResolvedValue({
      ubicaciones: [
        { indice: 0, nombre_ubicacion: 'Oficina', estado_validacion: 'COMPLETA', alertas_bloqueantes: [] },
      ],
      version: 1,
    });

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Siguiente')).not.toBeDisabled();
    });
  });

  it('muestra el formulario de nueva ubicación al hacer click en Agregar', async () => {
    // GIVEN
    renderPage();
    await waitFor(() => screen.getByText('+ Agregar Ubicación'));

    // WHEN
    fireEvent.click(screen.getByText('+ Agregar Ubicación'));

    // THEN
    expect(screen.getByText('Nueva Ubicación')).toBeInTheDocument();
  });

  it('guarda el layout al hacer click en Guardar Layout', async () => {
    // GIVEN
    setLayout.mockResolvedValue({ configuracion_layout: { cantidad: 2 }, version: 1 });
    renderPage();
    await waitFor(() => screen.getByText('Guardar Layout'));

    // WHEN
    fireEvent.click(screen.getByText('Guardar Layout'));

    // THEN
    await waitFor(() => {
      expect(setLayout).toHaveBeenCalledWith('F20260417-00001', 1, 0);
    });
  });

  it('navega a general-info al hacer click en Atrás', async () => {
    // GIVEN
    renderPage();
    await waitFor(() => screen.getByText('Atrás'));

    // WHEN
    fireEvent.click(screen.getByText('Atrás'));

    // THEN
    expect(mockNavigate).toHaveBeenCalledWith('/quotes/F20260417-00001/general-info');
  });

  it('cancela el formulario al hacer click en Cancelar', async () => {
    // GIVEN
    renderPage();
    await waitFor(() => screen.getByText('+ Agregar Ubicación'));
    fireEvent.click(screen.getByText('+ Agregar Ubicación'));
    expect(screen.getByText('Nueva Ubicación')).toBeInTheDocument();

    // WHEN
    fireEvent.click(screen.getByText('Cancelar'));

    // THEN
    expect(screen.queryByText('Nueva Ubicación')).not.toBeInTheDocument();
  });

  it('muestra errores de validación al guardar ubicación sin datos', async () => {
    // GIVEN
    renderPage();
    await waitFor(() => screen.getByText('+ Agregar Ubicación'));
    fireEvent.click(screen.getByText('+ Agregar Ubicación'));

    // WHEN
    fireEvent.click(screen.getByText('Guardar Ubicación'));

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Nombre requerido')).toBeInTheDocument();
    });
  });

  it('muestra error de catálogos cuando falla la carga', async () => {
    // GIVEN
    obtenerGiros.mockRejectedValue({
      response: { data: { detail: 'Error catálogos' } },
    });

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar catálogos/)).toBeInTheDocument();
    });
  });
});
