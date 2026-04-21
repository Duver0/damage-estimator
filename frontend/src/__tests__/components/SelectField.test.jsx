import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectField from '../../components/SelectField/SelectField';

const options = [
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'RESIDENCIAL', label: 'Residencial' },
];

describe('SelectField', () => {
  it('renderiza el label y el select', () => {
    // GIVEN / WHEN
    render(
      <SelectField
        label="Tipo"
        name="tipo"
        value=""
        onChange={vi.fn()}
        options={options}
      />
    );

    // THEN
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
  });

  it('no renderiza label cuando no se provee', () => {
    // GIVEN / WHEN
    const { container } = render(
      <SelectField
        name="tipo"
        value=""
        onChange={vi.fn()}
        options={options}
      />
    );

    // THEN
    expect(container.querySelector('label')).toBeNull();
  });

  it('muestra las opciones del catalogo', () => {
    // GIVEN / WHEN
    render(
      <SelectField
        label="Tipo"
        name="tipo"
        value=""
        onChange={vi.fn()}
        options={options}
      />
    );

    // THEN
    expect(screen.getByText('Comercial')).toBeInTheDocument();
    expect(screen.getByText('Residencial')).toBeInTheDocument();
  });

  it('muestra placeholder por defecto', () => {
    // GIVEN / WHEN
    render(
      <SelectField
        label="Tipo"
        name="tipo"
        value=""
        onChange={vi.fn()}
        options={options}
      />
    );

    // THEN
    expect(screen.getByText('Seleccionar...')).toBeInTheDocument();
  });

  it('muestra Cargando... cuando loading=true', () => {
    // GIVEN / WHEN
    render(
      <SelectField
        label="Tipo"
        name="tipo"
        value=""
        onChange={vi.fn()}
        options={[]}
        loading={true}
      />
    );

    // THEN
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('queda disabled cuando loading=true', () => {
    // GIVEN / WHEN
    render(
      <SelectField
        label="Tipo"
        name="tipo"
        value=""
        onChange={vi.fn()}
        options={[]}
        loading={true}
      />
    );

    // THEN
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('queda disabled cuando disabled=true', () => {
    // GIVEN / WHEN
    render(
      <SelectField
        label="Tipo"
        name="tipo"
        value=""
        onChange={vi.fn()}
        options={options}
        disabled={true}
      />
    );

    // THEN
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('muestra mensaje de error cuando error existe', () => {
    // GIVEN / WHEN
    render(
      <SelectField
        label="Tipo"
        name="tipo"
        value=""
        onChange={vi.fn()}
        options={options}
        error="Selección requerida"
      />
    );

    // THEN
    expect(screen.getByText('Selección requerida')).toBeInTheDocument();
  });

  it('muestra asterisco cuando required=true', () => {
    // GIVEN / WHEN
    render(
      <SelectField
        label="Tipo"
        name="tipo"
        value=""
        onChange={vi.fn()}
        options={options}
        required={true}
      />
    );

    // THEN
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('llama onChange al cambiar la seleccion', () => {
    // GIVEN
    const onChange = vi.fn();
    render(
      <SelectField
        label="Tipo"
        name="tipo"
        value=""
        onChange={onChange}
        options={options}
      />
    );

    // WHEN
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'COMERCIAL' } });

    // THEN
    expect(onChange).toHaveBeenCalledOnce();
  });
});
