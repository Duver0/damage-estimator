import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock de servicios antes del import del componente
vi.mock('../../services/coberturasService', () => ({
  obtenerCoberturas: vi.fn(),
  actualizarCoberturas: vi.fn(),
}));
vi.mock('../../services/calculoService', () => ({
  ejecutarCalculo: vi.fn(),
}));

// PriceBreakdown no tiene implementación real: se mockea con el mismo path que usa la página
vi.mock('../../components/PriceBreakdown', () => ({
  default: ({ primaNeta, primaComercial }) => (
    <div data-testid="price-breakdown">
      {primaNeta != null && <span>Prima Neta: {primaNeta}</span>}
      {primaComercial != null && <span>Prima Comercial: {primaComercial}</span>}
    </div>
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import TechnicalInfoPage from '../../pages/TechnicalInfoPage/TechnicalInfoPage';
import { obtenerCoberturas } from '../../services/coberturasService';
import { ejecutarCalculo } from '../../services/calculoService';

const coberturas = [
  { cobertura: 'INCENDIO_EDIFICIOS', nombre: 'Incendio Edificios', activa: true, obligatoria: true },
  { cobertura: 'CATFHM', nombre: 'CATFHM', activa: false, obligatoria: false },
];

const renderPage = (folio = 'F20260417-00001') =>
  render(
    <MemoryRouter initialEntries={[`/quotes/${folio}/technical-info`]}>
      <Routes>
        <Route path="/quotes/:folio/technical-info" element={<TechnicalInfoPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('TechnicalInfoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el título de la página', async () => {
    // GIVEN
    obtenerCoberturas.mockResolvedValue({ opciones_cobertura: coberturas, version: 1 });

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Información Técnica y Coberturas')).toBeInTheDocument();
    });
  });

  it('muestra las coberturas cargadas', async () => {
    // GIVEN
    obtenerCoberturas.mockResolvedValue({ opciones_cobertura: coberturas, version: 1 });

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Incendio Edificios')).toBeInTheDocument();
      expect(screen.getByText('CATFHM')).toBeInTheDocument();
    });
  });

  it('muestra spinner mientras cargan las coberturas', () => {
    // GIVEN
    obtenerCoberturas.mockReturnValue(new Promise(() => {}));

    // WHEN
    renderPage();

    // THEN
    expect(screen.getByText(/Cargando coberturas/i)).toBeInTheDocument();
  });

  it('muestra el botón Calcular Prima', async () => {
    // GIVEN
    obtenerCoberturas.mockResolvedValue({ opciones_cobertura: coberturas, version: 1 });

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Calcular Prima')).toBeInTheDocument();
    });
  });

  it('llama a ejecutarCalculo al hacer click en Calcular Prima', async () => {
    // GIVEN
    obtenerCoberturas.mockResolvedValue({ opciones_cobertura: coberturas, version: 1 });
    ejecutarCalculo.mockResolvedValue({
      resultado_financiero: { prima_neta: 100000, prima_comercial: 135000, primas_por_ubicacion: [] },
      alertas: [],
    });

    renderPage();
    await waitFor(() => screen.getByText('Calcular Prima'));

    // WHEN
    fireEvent.click(screen.getByText('Calcular Prima'));

    // THEN
    await waitFor(() => {
      expect(ejecutarCalculo).toHaveBeenCalledWith('F20260417-00001');
    });
  });

  it('muestra alertas del calculo', async () => {
    // GIVEN
    obtenerCoberturas.mockResolvedValue({ opciones_cobertura: coberturas, version: 1 });
    ejecutarCalculo.mockResolvedValue({
      resultado_financiero: { prima_neta: 50000, prima_comercial: 67500, primas_por_ubicacion: [] },
      alertas: [{ mensaje: 'Ubicación incompleta omitida del cálculo' }],
    });

    renderPage();
    await waitFor(() => screen.getByText('Calcular Prima'));
    fireEvent.click(screen.getByText('Calcular Prima'));

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Ubicación incompleta omitida del cálculo')).toBeInTheDocument();
    });
  });

  it('muestra error de coberturas cuando el servicio falla', async () => {
    // GIVEN
    obtenerCoberturas.mockRejectedValue({
      response: { data: { detail: 'Error al obtener coberturas' } },
    });

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Error al obtener coberturas')).toBeInTheDocument();
    });
  });

  it('navega a locations al hacer click en Atrás', async () => {
    // GIVEN
    obtenerCoberturas.mockResolvedValue({ opciones_cobertura: coberturas, version: 1 });
    renderPage();
    await waitFor(() => screen.getByText('Calcular Prima'));

    // WHEN
    fireEvent.click(screen.getByText('Atrás'));

    // THEN
    expect(mockNavigate).toHaveBeenCalledWith('/quotes/F20260417-00001/locations');
  });

  it('navega a terms-and-conditions al hacer click en Siguiente', async () => {
    // GIVEN
    obtenerCoberturas.mockResolvedValue({ opciones_cobertura: coberturas, version: 1 });
    renderPage();
    await waitFor(() => screen.getByText('Términos y Confirmación'));

    // WHEN
    fireEvent.click(screen.getByText('Términos y Confirmación'));

    // THEN
    expect(mockNavigate).toHaveBeenCalledWith('/quotes/F20260417-00001/terms-and-conditions');
  });
});
