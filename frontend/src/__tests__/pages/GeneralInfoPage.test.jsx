import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GeneralInfoPage from '../../pages/GeneralInfoPage/GeneralInfoPage';

vi.mock('../../services/generalInfoService', () => ({
  obtenerGeneralInfo: vi.fn(),
  actualizarGeneralInfo: vi.fn(),
}));

import { obtenerGeneralInfo, actualizarGeneralInfo } from '../../services/generalInfoService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderPage = (folio = 'F20260417-00001') =>
  render(
    <MemoryRouter initialEntries={[`/quotes/${folio}/general-info`]}>
      <Routes>
        <Route path="/quotes/:folio/general-info" element={<GeneralInfoPage />} />
      </Routes>
    </MemoryRouter>
  );

const datosBase = {
  datos_asegurado: {
    nombre: 'Juan',
    apellidos: 'Pérez',
    email: 'juan@test.com',
    telefono: '3001234567',
    tipo_identificacion: 'CC',
    numero_identificacion: '12345678',
  },
  datos_conduccion: {
    codigo_agente: 'AG001',
  },
  tipo_negocio: 'COMERCIAL',
  version: 1,
};

describe('GeneralInfoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el título Datos Generales', async () => {
    // GIVEN
    obtenerGeneralInfo.mockResolvedValue(datosBase);

    // WHEN
    renderPage();

    // THEN — getByRole('heading') evita colisión con el step label de ProgressBar
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Datos Generales' })).toBeInTheDocument();
    });
  });

  it('pre-rellena el formulario con los datos cargados', async () => {
    // GIVEN
    obtenerGeneralInfo.mockResolvedValue(datosBase);

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
      expect(screen.getByDisplayValue('AG001')).toBeInTheDocument();
    });
  });

  it('muestra error de validación cuando nombre está vacío', async () => {
    // GIVEN
    obtenerGeneralInfo.mockResolvedValue({
      ...datosBase,
      datos_asegurado: { ...datosBase.datos_asegurado, nombre: '' },
    });
    renderPage();
    await waitFor(() => screen.getByRole('heading', { name: 'Datos Generales' }));

    // WHEN
    fireEvent.click(screen.getByText('Siguiente'));

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Nombre es requerido')).toBeInTheDocument();
    });
  });

  it('guarda los datos y navega a locations cuando el formulario es válido', async () => {
    // GIVEN
    obtenerGeneralInfo.mockResolvedValue(datosBase);
    actualizarGeneralInfo.mockResolvedValue({ ...datosBase, version: 2 });
    renderPage();
    await waitFor(() => screen.getByDisplayValue('Juan'));

    // WHEN
    fireEvent.click(screen.getByText('Siguiente'));

    // THEN
    await waitFor(() => {
      expect(actualizarGeneralInfo).toHaveBeenCalledOnce();
    });
  });

  it('navega a /cotizador al hacer click en Atrás', async () => {
    // GIVEN
    obtenerGeneralInfo.mockResolvedValue(datosBase);
    renderPage();
    await waitFor(() => screen.getByRole('heading', { name: 'Datos Generales' }));

    // WHEN — HeaderNav también tiene "← Atrás"; usamos el botón de la sección de acciones
    fireEvent.click(screen.getByText('Atrás'));

    // THEN
    expect(mockNavigate).toHaveBeenCalledWith('/cotizador');
  });

  it('muestra spinner cuando loading=true y no hay datos', () => {
    // GIVEN — la promesa nunca resuelve
    obtenerGeneralInfo.mockReturnValue(new Promise(() => {}));

    // WHEN
    renderPage();

    // THEN
    expect(screen.getByText(/Cargando datos/i)).toBeInTheDocument();
  });

  it('mapea tipo identificacion RFC legacy a CC', async () => {
    // GIVEN
    obtenerGeneralInfo.mockResolvedValue({
      ...datosBase,
      datos_asegurado: {
        ...datosBase.datos_asegurado,
        tipo_identificacion: 'RFC',
      },
    });

    // WHEN
    renderPage();

    // THEN — debe haberse mapeado a CC (valor del select)
    await waitFor(() => {
      const select = screen.getByLabelText('Tipo de Identificación');
      expect(select.value).toBe('CC');
    });
  });

  it('muestra error del servicio cuando cargar falla', async () => {
    // GIVEN
    obtenerGeneralInfo.mockRejectedValue({
      response: { data: { detail: 'Folio no encontrado' } },
    });

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Folio no encontrado')).toBeInTheDocument();
    });
  });
});
