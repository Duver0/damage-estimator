import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../../pages/DashboardPage';

// Mock del service de cotizacion
vi.mock('../../services/cotizacionService', () => ({
  listarCotizaciones: vi.fn(),
  crearCotizacion: vi.fn(),
  eliminarCotizacion: vi.fn(),
}));

import { listarCotizaciones, crearCotizacion } from '../../services/cotizacionService';

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra spinner mientras carga', () => {
    // GIVEN: listarCotizaciones nunca resuelve (pendiente)
    listarCotizaciones.mockReturnValue(new Promise(() => {}));

    // WHEN
    renderDashboard();

    // THEN
    expect(screen.getByText(/Cargando cotizaciones/i)).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay cotizaciones', async () => {
    // GIVEN
    listarCotizaciones.mockResolvedValue([]);

    // WHEN
    renderDashboard();

    // THEN
    await waitFor(() => {
      expect(screen.getByText(/No hay cotizaciones/i)).toBeInTheDocument();
    });
  });

  it('muestra la tabla con cotizaciones cargadas', async () => {
    // GIVEN
    listarCotizaciones.mockResolvedValue([
      {
        numero_folio: 'F20260419-00001',
        nombre_asegurado: 'Empresa Prueba',
        estado_cotizacion: 'CREADA',
        prima_neta: null,
        fecha_ultima_actualizacion: '2026-04-19T00:00:00',
      },
    ]);

    // WHEN
    renderDashboard();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('F20260419-00001')).toBeInTheDocument();
      expect(screen.getByText('Empresa Prueba')).toBeInTheDocument();
      expect(screen.getByText('CREADA')).toBeInTheDocument();
    });
  });

  it('muestra prima formateada en COP cuando existe', async () => {
    // GIVEN
    listarCotizaciones.mockResolvedValue([
      {
        numero_folio: 'F20260419-00002',
        nombre_asegurado: 'Empresa B',
        estado_cotizacion: 'CALCULADA',
        prima_neta: 50000,
        fecha_ultima_actualizacion: '2026-04-19T00:00:00',
      },
    ]);

    // WHEN
    renderDashboard();

    // THEN
    await waitFor(() => {
      // La prima se formatea en COP (es-CO) — el texto exacto depende del navegador
      expect(screen.getByText(/50\.000|50,000/)).toBeInTheDocument();
    });
  });

  it('muestra error cuando listarCotizaciones falla', async () => {
    // GIVEN
    listarCotizaciones.mockRejectedValue(new Error('Network error'));

    // WHEN
    renderDashboard();

    // THEN
    await waitFor(() => {
      expect(screen.getByText(/No se pudo cargar las cotizaciones/i)).toBeInTheDocument();
    });
  });

  it('boton Nueva Cotizacion llama a crearCotizacion', async () => {
    // GIVEN
    listarCotizaciones.mockResolvedValue([]);
    crearCotizacion.mockResolvedValue({ numero_folio: 'F20260420-00001' });

    // WHEN
    renderDashboard();
    await waitFor(() => screen.getByText(/\+ Nueva Cotización/i));
    fireEvent.click(screen.getByText(/\+ Nueva Cotización/i));

    // THEN
    await waitFor(() => {
      expect(crearCotizacion).toHaveBeenCalledOnce();
    });
  });
});
