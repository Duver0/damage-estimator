import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeaderNav from '../../components/HeaderNav/HeaderNav';

const renderHeaderNav = (props = {}) =>
  render(
    <MemoryRouter>
      <HeaderNav {...props} />
    </MemoryRouter>
  );

describe('HeaderNav', () => {
  it('renderiza el título del sistema', () => {
    // GIVEN / WHEN
    renderHeaderNav();

    // THEN
    expect(screen.getByText('Cotizador de Daños')).toBeInTheDocument();
  });

  it('muestra el folio cuando se provee', () => {
    // GIVEN / WHEN
    renderHeaderNav({ folio: 'F20260417-00001' });

    // THEN
    expect(screen.getByText('Folio: F20260417-00001')).toBeInTheDocument();
  });

  it('no muestra folio cuando no se provee', () => {
    // GIVEN / WHEN
    renderHeaderNav();

    // THEN
    expect(screen.queryByText(/Folio:/)).not.toBeInTheDocument();
  });

  it('renderiza enlace al Dashboard', () => {
    // GIVEN / WHEN
    renderHeaderNav();

    // THEN
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('llama onBack cuando se provee y se hace click en Atrás', () => {
    // GIVEN
    const onBack = vi.fn();
    renderHeaderNav({ onBack });

    // WHEN
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));

    // THEN
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renderiza boton de Inicio', () => {
    // GIVEN / WHEN
    renderHeaderNav();

    // THEN
    expect(screen.getByRole('button', { name: 'Inicio' })).toBeInTheDocument();
  });

  it('el botón Atrás tiene aria-label Volver', () => {
    // GIVEN / WHEN
    renderHeaderNav();

    // THEN
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();
  });
});
