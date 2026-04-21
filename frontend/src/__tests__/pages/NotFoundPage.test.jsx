import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from '../../pages/NotFoundPage/NotFoundPage';

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
      <NotFoundPage />
    </MemoryRouter>
  );

describe('NotFoundPage', () => {
  it('renderiza el código 404', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('muestra el mensaje de página no encontrada', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
  });

  it('renderiza el botón para ir al cotizador', () => {
    // GIVEN / WHEN
    renderPage();

    // THEN
    expect(screen.getByRole('button', { name: /Ir al Cotizador/i })).toBeInTheDocument();
  });

  it('navega a /cotizador al hacer click en el botón', () => {
    // GIVEN
    renderPage();

    // WHEN
    fireEvent.click(screen.getByRole('button', { name: /Ir al Cotizador/i }));

    // THEN
    expect(mockNavigate).toHaveBeenCalledWith('/cotizador');
  });
});
