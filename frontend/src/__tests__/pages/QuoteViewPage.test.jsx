import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QuoteViewPage from '../../pages/QuoteViewPage/QuoteViewPage';

vi.mock('../../services/cotizacionService', () => ({
  obtenerEstado: vi.fn(),
  crearCotizacion: vi.fn(),
  listarCotizaciones: vi.fn(),
}));

import { obtenerEstado } from '../../services/cotizacionService';

const estadoBase = {
  estados_seccion: {
    datos_generales_completo: true,
    ubicaciones_capturadas: 2,
    ubicaciones_completas: 2,
    ubicaciones_incompletas: 0,
    coberturas_definidas: true,
    calculo_realizado: true,
  },
  prima_neta: 100000,
  prima_comercial: 135000,
  alertas: [],
};

const renderPage = (folio = 'F20260417-00001') =>
  render(
    <MemoryRouter initialEntries={[`/quotes/${folio}/view`]}>
      <Routes>
        <Route path="/quotes/:folio/view" element={<QuoteViewPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('QuoteViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra spinner mientras carga', () => {
    // GIVEN
    obtenerEstado.mockReturnValue(new Promise(() => {}));

    // WHEN
    renderPage();

    // THEN
    expect(screen.getByText(/Cargando cotización/i)).toBeInTheDocument();
  });

  it('muestra error cuando el servicio falla', async () => {
    // GIVEN
    obtenerEstado.mockRejectedValue(new Error('Not found'));

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText(/No se pudo cargar la cotización/i)).toBeInTheDocument();
    });
  });

  it('renderiza el folio en el título', async () => {
    // GIVEN
    obtenerEstado.mockResolvedValue(estadoBase);

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText(/Cotización: F20260417-00001/)).toBeInTheDocument();
    });
  });

  it('muestra Completo cuando datos_generales_completo=true', async () => {
    // GIVEN
    obtenerEstado.mockResolvedValue(estadoBase);

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText(/✓ Completo/)).toBeInTheDocument();
    });
  });

  it('muestra Incompleto cuando datos_generales_completo=false', async () => {
    // GIVEN
    obtenerEstado.mockResolvedValue({
      ...estadoBase,
      estados_seccion: {
        ...estadoBase.estados_seccion,
        datos_generales_completo: false,
      },
    });

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText(/✗ Incompleto/)).toBeInTheDocument();
    });
  });

  it('muestra la sección financiera cuando calculo_realizado=true', async () => {
    // GIVEN
    obtenerEstado.mockResolvedValue(estadoBase);

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Prima Neta:')).toBeInTheDocument();
      expect(screen.getByText('Prima Comercial (margen 35%):' )).toBeInTheDocument();
    });
  });

  it('no muestra la sección financiera cuando calculo_realizado=false', async () => {
    // GIVEN
    obtenerEstado.mockResolvedValue({
      ...estadoBase,
      estados_seccion: {
        ...estadoBase.estados_seccion,
        calculo_realizado: false,
      },
    });

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.queryByText('Prima Neta:')).not.toBeInTheDocument();
    });
  });

  it('muestra alertas cuando hay alertas en el estado', async () => {
    // GIVEN
    obtenerEstado.mockResolvedValue({
      ...estadoBase,
      alertas: [{ mensaje: 'Ubicación incompleta omitida' }],
    });

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Ubicación incompleta omitida')).toBeInTheDocument();
    });
  });

  it('no muestra sección alertas cuando alertas está vacío', async () => {
    // GIVEN
    obtenerEstado.mockResolvedValue(estadoBase);

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Alertas/i })).not.toBeInTheDocument();
    });
  });
});
