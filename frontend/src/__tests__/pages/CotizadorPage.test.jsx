import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import CotizadorPage from '../../pages/CotizadorPage/CotizadorPage';
import { CotizacionProvider } from '../../contexts/CotizacionContext';

vi.mock('../../services/cotizacionService', () => ({
  crearCotizacion: vi.fn(),
  listarCotizaciones: vi.fn(),
  obtenerEstado: vi.fn(),
}));

import { crearCotizacion, listarCotizaciones } from '../../services/cotizacionService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <CotizacionProvider>
        <CotizadorPage />
      </CotizacionProvider>
    </MemoryRouter>
  );

describe('CotizadorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    listarCotizaciones.mockResolvedValue([]);
  });

  it('renderiza el título del cotizador', async () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(screen.getByText('Cotizador de Daños')).toBeInTheDocument();
  });

  it('muestra mensaje vacío cuando no hay cotizaciones', async () => {
    // GIVEN
    listarCotizaciones.mockResolvedValue([]);

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText(/Sin cotizaciones aún/i)).toBeInTheDocument();
    });
  });

  it('muestra cotizaciones recientes cuando existen', async () => {
    // GIVEN
    listarCotizaciones.mockResolvedValue([
      {
        numero_folio: 'F20260417-00001',
        nombre_asegurado: 'Empresa Test',
        estado_cotizacion: 'CREADA',
        prima_neta: null,
        fecha_ultima_actualizacion: '2026-04-17T00:00:00',
      },
    ]);

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText('F20260417-00001')).toBeInTheDocument();
      expect(screen.getByText('Empresa Test')).toBeInTheDocument();
    });
  });

  it('muestra errores de validación cuando nombre está vacío', async () => {
    // GIVEN
    renderPage();
    await waitFor(() => screen.getByText(/Crear Folio Nuevo/i));

    // WHEN — click en Crear Folio sin rellenar el formulario
    fireEvent.click(screen.getByText('Crear Folio'));

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Nombre es requerido')).toBeInTheDocument();
    });
  });

  it('muestra error de email inválido', async () => {
    // GIVEN
    renderPage();
    await waitFor(() => screen.getByText(/Crear Folio Nuevo/i));

    // WHEN
    const nombreInput = screen.getByLabelText(/Nombre del Asegurado/);
    fireEvent.change(nombreInput, { target: { name: 'nombre', value: 'Juan' } });
    const emailInput = screen.getByLabelText(/Correo Electrónico/);
    fireEvent.change(emailInput, { target: { name: 'email', value: 'no-es-email' } });
    fireEvent.click(screen.getByText('Crear Folio'));

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });
  });

  it('crea folio y navega cuando formulario es válido', async () => {
    // GIVEN
    crearCotizacion.mockResolvedValue({ numero_folio: 'F20260417-00001' });
    renderPage();
    await waitFor(() => screen.getByText(/Crear Folio Nuevo/i));

    // WHEN
    fireEvent.change(screen.getByLabelText(/Nombre del Asegurado/), {
      target: { name: 'nombre', value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/), {
      target: { name: 'email', value: 'juan@test.com' },
    });
    fireEvent.click(screen.getByText('Crear Folio'));

    // THEN
    await waitFor(() => {
      expect(crearCotizacion).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/quotes/F20260417-00001/general-info');
    });
  });

  it('muestra error al abrir folio existente vacío', async () => {
    // GIVEN
    renderPage();
    await waitFor(() => screen.getByText(/Abrir Folio Existente/i));

    // WHEN
    fireEvent.click(screen.getByText('Abrir'));

    // THEN
    await waitFor(() => {
      expect(screen.getByText('Ingresa un número de folio')).toBeInTheDocument();
    });
  });

  it('navega al folio existente cuando se ingresa un número válido', async () => {
    // GIVEN
    renderPage();
    await waitFor(() => screen.getByText(/Abrir Folio Existente/i));

    // WHEN
    const folioInput = screen.getByLabelText('Número de Folio');
    fireEvent.change(folioInput, {
      target: { name: 'folioExistente', value: 'f20260417-00005' },
    });
    fireEvent.click(screen.getByText('Abrir'));

    // THEN
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/quotes/F20260417-00005/general-info');
    });
  });

  it('muestra error cuando listarCotizaciones falla', async () => {
    // GIVEN
    listarCotizaciones.mockRejectedValue(new Error('Network'));

    // WHEN
    renderPage();

    // THEN
    await waitFor(() => {
      expect(screen.getByText(/No se pudo cargar cotizaciones/i)).toBeInTheDocument();
    });
  });
});
