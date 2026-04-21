import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckboxField from '../../components/CheckboxField/CheckboxField';

describe('CheckboxField', () => {
  it('renderiza el label y el checkbox', () => {
    // GIVEN
    const onChange = vi.fn();

    // WHEN
    render(
      <CheckboxField
        label="Acepto términos"
        name="terms"
        checked={false}
        onChange={onChange}
      />
    );

    // THEN
    expect(screen.getByText('Acepto términos')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('checkbox aparece marcado cuando checked=true', () => {
    // GIVEN / WHEN
    render(
      <CheckboxField
        label="Opción"
        name="opcion"
        checked={true}
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('checkbox aparece desmarcado cuando checked=false', () => {
    // GIVEN / WHEN
    render(
      <CheckboxField
        label="Opción"
        name="opcion"
        checked={false}
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('llama onChange al hacer click', () => {
    // GIVEN
    const onChange = vi.fn();
    render(
      <CheckboxField
        label="Click me"
        name="click"
        checked={false}
        onChange={onChange}
      />
    );

    // WHEN
    fireEvent.click(screen.getByRole('checkbox'));

    // THEN
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('queda disabled cuando disabled=true', () => {
    // GIVEN / WHEN
    render(
      <CheckboxField
        label="Deshabilitado"
        name="dis"
        checked={false}
        onChange={vi.fn()}
        disabled={true}
      />
    );

    // THEN
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('no es disabled por defecto', () => {
    // GIVEN / WHEN
    render(
      <CheckboxField
        label="Normal"
        name="normal"
        checked={false}
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(screen.getByRole('checkbox')).not.toBeDisabled();
  });
});
