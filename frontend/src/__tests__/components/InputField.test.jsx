import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InputField from '../../components/InputField/InputField';

describe('InputField', () => {
  it('renderiza el label y el input', () => {
    // GIVEN / WHEN
    render(
      <InputField
        label="Nombre"
        name="nombre"
        value=""
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
  });

  it('no renderiza label cuando no se provee', () => {
    // GIVEN / WHEN
    const { container } = render(
      <InputField
        name="nombre"
        value=""
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(container.querySelector('label')).toBeNull();
  });

  it('muestra asterisco cuando required=true', () => {
    // GIVEN / WHEN
    render(
      <InputField
        label="Campo"
        name="campo"
        value=""
        onChange={vi.fn()}
        required={true}
      />
    );

    // THEN
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando error existe', () => {
    // GIVEN / WHEN
    render(
      <InputField
        label="Email"
        name="email"
        value=""
        onChange={vi.fn()}
        error="Email inválido"
      />
    );

    // THEN
    expect(screen.getByRole('alert')).toHaveTextContent('Email inválido');
  });

  it('no muestra mensaje de error cuando no hay error', () => {
    // GIVEN / WHEN
    render(
      <InputField
        label="Email"
        name="email"
        value=""
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('llama onChange al escribir', () => {
    // GIVEN
    const onChange = vi.fn();
    render(
      <InputField
        label="Nombre"
        name="nombre"
        value=""
        onChange={onChange}
      />
    );

    // WHEN
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Juan' } });

    // THEN
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('llama onBlur cuando el input pierde foco', () => {
    // GIVEN
    const onBlur = vi.fn();
    render(
      <InputField
        label="Campo"
        name="campo"
        value=""
        onChange={vi.fn()}
        onBlur={onBlur}
      />
    );

    // WHEN
    fireEvent.blur(screen.getByRole('textbox'));

    // THEN
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it('queda disabled cuando disabled=true', () => {
    // GIVEN / WHEN
    render(
      <InputField
        label="Campo"
        name="campo"
        value=""
        onChange={vi.fn()}
        disabled={true}
      />
    );

    // THEN
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('tiene aria-invalid cuando hay error', () => {
    // GIVEN / WHEN
    render(
      <InputField
        label="Campo"
        name="campo"
        value=""
        onChange={vi.fn()}
        error="Error aquí"
      />
    );

    // THEN
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('usa el placeholder provisto', () => {
    // GIVEN / WHEN
    render(
      <InputField
        label="Campo"
        name="campo"
        value=""
        onChange={vi.fn()}
        placeholder="Ingresa un valor"
      />
    );

    // THEN
    expect(screen.getByPlaceholderText('Ingresa un valor')).toBeInTheDocument();
  });
});
