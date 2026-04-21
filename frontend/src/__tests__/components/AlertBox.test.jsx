import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlertBox from '../../components/AlertBox';

describe('AlertBox', () => {
  it('renderiza mensaje', () => {
    // GIVEN / WHEN
    render(<AlertBox type="error" message="Error grave" />);

    // THEN
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error grave')).toBeInTheDocument();
  });

  it('no renderiza si message es falsy', () => {
    // GIVEN / WHEN
    const { container } = render(<AlertBox type="error" message="" />);

    // THEN
    expect(container.firstChild).toBeNull();
  });

  it('muestra boton cerrar solo cuando onClose es provisto', () => {
    // GIVEN
    const onClose = vi.fn();

    // WHEN
    render(<AlertBox type="info" message="Info" onClose={onClose} />);

    // THEN
    expect(screen.getByLabelText('Cerrar alerta')).toBeInTheDocument();
  });

  it('no muestra boton cerrar sin onClose', () => {
    // GIVEN / WHEN
    render(<AlertBox type="info" message="Sin boton" />);

    // THEN
    expect(screen.queryByLabelText('Cerrar alerta')).toBeNull();
  });

  it('llama onClose al hacer click en cerrar', () => {
    // GIVEN
    const onClose = vi.fn();
    render(<AlertBox type="warning" message="Advertencia" onClose={onClose} />);

    // WHEN
    fireEvent.click(screen.getByLabelText('Cerrar alerta'));

    // THEN
    expect(onClose).toHaveBeenCalledOnce();
  });
});
