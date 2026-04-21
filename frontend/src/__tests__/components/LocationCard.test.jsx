import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LocationCard from '../../components/LocationCard/LocationCard';

const locationBase = {
  nombre_ubicacion: 'Oficina Central',
  direccion: 'Calle 123',
  codigo_postal: '110111',
  estado: 'Bogotá DC',
  giro: { descripcion: 'Oficinas' },
  alertas_bloqueantes: [],
};

describe('LocationCard', () => {
  it('renderiza el nombre y el indice de la ubicacion', () => {
    // GIVEN / WHEN
    render(
      <LocationCard
        location={locationBase}
        index={0}
        onEdit={vi.fn()}
        isComplete={true}
      />
    );

    // THEN
    expect(screen.getByText(/Ubicación 1: Oficina Central/)).toBeInTheDocument();
  });

  it('muestra etiqueta COMPLETA cuando isComplete=true', () => {
    // GIVEN / WHEN
    render(
      <LocationCard
        location={locationBase}
        index={0}
        onEdit={vi.fn()}
        isComplete={true}
      />
    );

    // THEN
    expect(screen.getByText('COMPLETA')).toBeInTheDocument();
  });

  it('muestra etiqueta INCOMPLETA cuando isComplete=false', () => {
    // GIVEN / WHEN
    render(
      <LocationCard
        location={locationBase}
        index={0}
        onEdit={vi.fn()}
        isComplete={false}
      />
    );

    // THEN
    expect(screen.getByText('INCOMPLETA')).toBeInTheDocument();
  });

  it('muestra Sin nombre cuando nombre_ubicacion es vacío', () => {
    // GIVEN
    const sinNombre = { ...locationBase, nombre_ubicacion: '' };

    // WHEN
    render(
      <LocationCard
        location={sinNombre}
        index={2}
        onEdit={vi.fn()}
        isComplete={false}
      />
    );

    // THEN
    expect(screen.getByText(/Sin nombre/)).toBeInTheDocument();
  });

  it('muestra dirección cuando existe', () => {
    // GIVEN / WHEN
    render(
      <LocationCard
        location={locationBase}
        index={0}
        onEdit={vi.fn()}
        isComplete={true}
      />
    );

    // THEN
    expect(screen.getByText('Calle 123')).toBeInTheDocument();
  });

  it('muestra CP y estado', () => {
    // GIVEN / WHEN
    render(
      <LocationCard
        location={locationBase}
        index={0}
        onEdit={vi.fn()}
        isComplete={true}
      />
    );

    // THEN
    expect(screen.getByText(/CP: 110111/)).toBeInTheDocument();
  });

  it('muestra descripcion del giro cuando existe', () => {
    // GIVEN / WHEN
    render(
      <LocationCard
        location={locationBase}
        index={0}
        onEdit={vi.fn()}
        isComplete={true}
      />
    );

    // THEN
    expect(screen.getByText(/Giro: Oficinas/)).toBeInTheDocument();
  });

  it('muestra alertas bloqueantes cuando ubicacion es incompleta', () => {
    // GIVEN
    const conAlertas = {
      ...locationBase,
      alertas_bloqueantes: [
        { mensaje: 'CP no válido' },
        { mensaje: 'Sin giro configurado' },
      ],
    };

    // WHEN
    render(
      <LocationCard
        location={conAlertas}
        index={0}
        onEdit={vi.fn()}
        isComplete={false}
      />
    );

    // THEN
    expect(screen.getByText('CP no válido')).toBeInTheDocument();
    expect(screen.getByText('Sin giro configurado')).toBeInTheDocument();
  });

  it('no muestra alertas cuando isComplete=true', () => {
    // GIVEN
    const conAlertas = {
      ...locationBase,
      alertas_bloqueantes: [{ mensaje: 'Alerta oculta' }],
    };

    // WHEN
    render(
      <LocationCard
        location={conAlertas}
        index={0}
        onEdit={vi.fn()}
        isComplete={true}
      />
    );

    // THEN
    expect(screen.queryByText('Alerta oculta')).not.toBeInTheDocument();
  });

  it('llama onEdit con el indice correcto al hacer click en Editar', () => {
    // GIVEN
    const onEdit = vi.fn();

    // WHEN
    render(
      <LocationCard
        location={locationBase}
        index={3}
        onEdit={onEdit}
        isComplete={true}
      />
    );
    fireEvent.click(screen.getByText('Editar'));

    // THEN
    expect(onEdit).toHaveBeenCalledWith(3);
  });
});
