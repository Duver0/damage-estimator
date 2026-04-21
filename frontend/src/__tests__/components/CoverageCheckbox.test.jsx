import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CoverageCheckbox from '../../components/CoverageCheckbox/CoverageCheckbox';

const coverageBase = {
  cobertura: 'INCENDIO_EDIFICIOS',
  nombre: 'Incendio Edificios',
  descripcion: 'Cubre daños por incendio',
  obligatoria: false,
};

describe('CoverageCheckbox', () => {
  it('renderiza el nombre de la cobertura', () => {
    // GIVEN / WHEN
    render(
      <CoverageCheckbox
        coverage={coverageBase}
        checked={false}
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(screen.getByText('Incendio Edificios')).toBeInTheDocument();
  });

  it('renderiza la descripcion cuando existe', () => {
    // GIVEN / WHEN
    render(
      <CoverageCheckbox
        coverage={coverageBase}
        checked={false}
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(screen.getByText('Cubre daños por incendio')).toBeInTheDocument();
  });

  it('no renderiza descripcion cuando no se provee', () => {
    // GIVEN
    const { descripcion, ...sinDesc } = coverageBase;

    // WHEN
    render(
      <CoverageCheckbox
        coverage={sinDesc}
        checked={false}
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(screen.queryByText('Cubre daños por incendio')).not.toBeInTheDocument();
  });

  it('muestra etiqueta Obligatoria cuando obligatoria=true', () => {
    // GIVEN
    const obligatoria = { ...coverageBase, obligatoria: true };

    // WHEN
    render(
      <CoverageCheckbox
        coverage={obligatoria}
        checked={true}
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(screen.getByText('Obligatoria')).toBeInTheDocument();
  });

  it('no muestra etiqueta Obligatoria cuando obligatoria=false', () => {
    // GIVEN / WHEN
    render(
      <CoverageCheckbox
        coverage={coverageBase}
        checked={false}
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(screen.queryByText('Obligatoria')).not.toBeInTheDocument();
  });

  it('checkbox queda disabled cuando obligatoria=true', () => {
    // GIVEN
    const obligatoria = { ...coverageBase, obligatoria: true };

    // WHEN
    render(
      <CoverageCheckbox
        coverage={obligatoria}
        checked={true}
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('llama onChange al hacer click en cobertura no obligatoria', () => {
    // GIVEN
    const onChange = vi.fn();
    render(
      <CoverageCheckbox
        coverage={coverageBase}
        checked={false}
        onChange={onChange}
      />
    );

    // WHEN
    fireEvent.click(screen.getByRole('checkbox'));

    // THEN
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('checkbox aparece marcado cuando checked=true', () => {
    // GIVEN / WHEN
    render(
      <CoverageCheckbox
        coverage={coverageBase}
        checked={true}
        onChange={vi.fn()}
      />
    );

    // THEN
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});
