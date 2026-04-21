import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from '../../components/ProgressBar/ProgressBar';

describe('ProgressBar', () => {
  it('renderiza el nav con todos los pasos por defecto', () => {
    // GIVEN / WHEN
    render(<ProgressBar currentStep={0} />);

    // THEN
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Crear Folio')).toBeInTheDocument();
    expect(screen.getByText('Datos Generales')).toBeInTheDocument();
    expect(screen.getByText('Ubicaciones')).toBeInTheDocument();
    expect(screen.getByText('Cobertura')).toBeInTheDocument();
    expect(screen.getByText('Resultado')).toBeInTheDocument();
  });

  it('marca el primer paso como activo cuando currentStep=0', () => {
    // GIVEN / WHEN
    render(<ProgressBar currentStep={0} />);

    // THEN
    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveAttribute('aria-current', 'step');
  });

  it('marca el segundo paso como activo cuando currentStep=1', () => {
    // GIVEN / WHEN
    render(<ProgressBar currentStep={1} />);

    // THEN
    const listItems = screen.getAllByRole('listitem');
    expect(listItems[1]).toHaveAttribute('aria-current', 'step');
    expect(listItems[0]).not.toHaveAttribute('aria-current');
  });

  it('muestra checkmark en pasos completados', () => {
    // GIVEN / WHEN
    render(<ProgressBar currentStep={2} />);

    // THEN — pasos 0 y 1 completados, deben mostrar checkmark
    const circles = screen.getAllByText('✓');
    expect(circles).toHaveLength(2);
  });

  it('muestra numeros en pasos no completados', () => {
    // GIVEN / WHEN
    render(<ProgressBar currentStep={0} />);

    // THEN
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('respeta totalSteps para mostrar solo N pasos', () => {
    // GIVEN / WHEN
    render(<ProgressBar currentStep={0} totalSteps={3} />);

    // THEN
    expect(screen.getByText('Crear Folio')).toBeInTheDocument();
    expect(screen.getByText('Datos Generales')).toBeInTheDocument();
    expect(screen.getByText('Ubicaciones')).toBeInTheDocument();
    expect(screen.queryByText('Cobertura')).not.toBeInTheDocument();
  });

  it('el ultimo paso activo no tiene aria-current en pasos anteriores', () => {
    // GIVEN / WHEN
    render(<ProgressBar currentStep={4} />);

    // THEN
    const listItems = screen.getAllByRole('listitem');
    expect(listItems[4]).toHaveAttribute('aria-current', 'step');
    expect(listItems[3]).not.toHaveAttribute('aria-current');
  });
});
