import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

describe('ConfirmModal', () => {
  it('no renderiza nada cuando isOpen=false', () => {
    // GIVEN / WHEN
    const { container } = render(
      <ConfirmModal
        isOpen={false}
        title="Confirmar"
        message="¿Estás seguro?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // THEN
    expect(container.firstChild).toBeNull();
  });

  it('renderiza el modal cuando isOpen=true', () => {
    // GIVEN / WHEN
    render(
      <ConfirmModal
        isOpen={true}
        title="Eliminar folio"
        message="Esta acción no se puede deshacer"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // THEN
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Eliminar folio')).toBeInTheDocument();
    expect(screen.getByText('Esta acción no se puede deshacer')).toBeInTheDocument();
  });

  it('llama onConfirm al hacer click en Confirmar', () => {
    // GIVEN
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        title="Borrar"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    // WHEN
    fireEvent.click(screen.getByText('Confirmar'));

    // THEN
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('llama onCancel al hacer click en Cancelar', () => {
    // GIVEN
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        title="Borrar"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    // WHEN
    fireEvent.click(screen.getByText('Cancelar'));

    // THEN
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('renderiza sin message cuando no se provee', () => {
    // GIVEN / WHEN
    render(
      <ConfirmModal
        isOpen={true}
        title="Solo título"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // THEN
    expect(screen.getByText('Solo título')).toBeInTheDocument();
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('tiene aria-modal y aria-labelledby correctos', () => {
    // GIVEN / WHEN
    render(
      <ConfirmModal
        isOpen={true}
        title="Accesibilidad"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // THEN
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });
});
