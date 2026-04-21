import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUbicaciones } from '../../hooks/useUbicaciones';
import * as service from '../../services/ubicacionesService';

vi.mock('../../services/ubicacionesService');

const mockUbicacionesResult = {
  ubicaciones: [
    { indice: 0, nombre_ubicacion: 'Oficina', estado_validacion: 'COMPLETA' },
  ],
  version: 1,
};

describe('useUbicaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('estado inicial', () => {
    it('inicia con arrays vacíos, loading false y version null', () => {
      // GIVEN / WHEN
      const { result } = renderHook(() => useUbicaciones('F001'));

      // THEN
      expect(result.current.ubicaciones).toEqual([]);
      expect(result.current.version).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('cargarUbicaciones', () => {
    it('no hace nada si folio es null', async () => {
      // GIVEN
      const { result } = renderHook(() => useUbicaciones(null));

      // WHEN
      await act(async () => { await result.current.cargarUbicaciones(); });

      // THEN
      expect(service.obtenerUbicaciones).not.toHaveBeenCalled();
    });

    it('carga ubicaciones y version', async () => {
      // GIVEN
      service.obtenerUbicaciones.mockResolvedValue(mockUbicacionesResult);

      // WHEN
      const { result } = renderHook(() => useUbicaciones('F001'));
      await act(async () => { await result.current.cargarUbicaciones(); });

      // THEN
      expect(result.current.ubicaciones).toHaveLength(1);
      expect(result.current.version).toBe(1);
    });

    it('setea error cuando el servicio falla', async () => {
      // GIVEN
      service.obtenerUbicaciones.mockRejectedValue({
        response: { data: { detail: 'Error al cargar' } },
      });

      // WHEN
      const { result } = renderHook(() => useUbicaciones('F001'));
      await act(async () => {
        try { await result.current.cargarUbicaciones(); } catch {}
      });

      // THEN
      expect(result.current.error).toBe('Error al cargar');
    });
  });

  describe('setLayout', () => {
    it('no hace nada si folio es null', async () => {
      // GIVEN
      const { result } = renderHook(() => useUbicaciones(null));

      // WHEN
      await act(async () => { await result.current.setLayout(3); });

      // THEN
      expect(service.setLayout).not.toHaveBeenCalled();
    });

    it('setea error si version es null', async () => {
      // GIVEN — no se cargaron ubicaciones, version = null
      const { result } = renderHook(() => useUbicaciones('F001'));

      // WHEN
      await act(async () => { await result.current.setLayout(3); });

      // THEN
      expect(result.current.error).toBe(
        'No se puede configurar el layout: datos no cargados. Recarga la página.'
      );
    });

    it('llama al servicio con folio, cantidad y version', async () => {
      // GIVEN — primero cargamos para tener version
      service.obtenerUbicaciones.mockResolvedValue(mockUbicacionesResult);
      service.setLayout.mockResolvedValue({
        configuracion_layout: { cantidad: 3 },
        version: 2,
      });

      const { result } = renderHook(() => useUbicaciones('F001'));
      await act(async () => { await result.current.cargarUbicaciones(); });

      // WHEN
      await act(async () => { await result.current.setLayout(3); });

      // THEN
      expect(service.setLayout).toHaveBeenCalledWith('F001', 3, 1);
    });
  });

  describe('agregarUbicacion', () => {
    it('setea error si version es null', async () => {
      // GIVEN
      const { result } = renderHook(() => useUbicaciones('F001'));

      // WHEN
      await act(async () => {
        await result.current.agregarUbicacion([{ nombre_ubicacion: 'Nueva' }]);
      });

      // THEN
      expect(result.current.error).toBe(
        'No se puede agregar ubicaciones: datos no cargados. Recarga la página.'
      );
    });

    it('agrega ubicaciones y actualiza version', async () => {
      // GIVEN
      service.obtenerUbicaciones.mockResolvedValue(mockUbicacionesResult);
      const nuevaUbicacion = { nombre_ubicacion: 'Nueva', estado_validacion: 'INCOMPLETA' };
      service.agregarUbicaciones.mockResolvedValue({
        ubicaciones: [mockUbicacionesResult.ubicaciones[0], nuevaUbicacion],
        version: 2,
      });

      const { result } = renderHook(() => useUbicaciones('F001'));
      await act(async () => { await result.current.cargarUbicaciones(); });

      // WHEN
      await act(async () => {
        await result.current.agregarUbicacion([nuevaUbicacion]);
      });

      // THEN
      expect(result.current.ubicaciones).toHaveLength(2);
      expect(result.current.version).toBe(2);
    });
  });

  describe('editarUbicacion', () => {
    it('setea error si version es null', async () => {
      // GIVEN
      const { result } = renderHook(() => useUbicaciones('F001'));

      // WHEN
      await act(async () => {
        await result.current.editarUbicacion(0, { nombre_ubicacion: 'Editado' });
      });

      // THEN
      expect(result.current.error).toBe(
        'No se puede editar ubicaciones: datos no cargados. Recarga la página.'
      );
    });

    it('llama al servicio con los datos correctos', async () => {
      // GIVEN
      service.obtenerUbicaciones.mockResolvedValue(mockUbicacionesResult);
      service.editarUbicacion.mockResolvedValue({
        indice: 0,
        nombre_ubicacion: 'Editado',
      });

      const { result } = renderHook(() => useUbicaciones('F001'));
      await act(async () => { await result.current.cargarUbicaciones(); });

      // WHEN
      await act(async () => {
        await result.current.editarUbicacion(0, { nombre_ubicacion: 'Editado' });
      });

      // THEN
      expect(service.editarUbicacion).toHaveBeenCalledWith(
        'F001', 0, { nombre_ubicacion: 'Editado' }, 1
      );
    });
  });

  describe('getResumen', () => {
    it('no hace nada si folio es null', async () => {
      // GIVEN
      const { result } = renderHook(() => useUbicaciones(null));

      // WHEN
      await act(async () => { await result.current.getResumen(); });

      // THEN
      expect(service.obtenerResumen).not.toHaveBeenCalled();
    });

    it('carga y retorna el resumen', async () => {
      // GIVEN
      const mockResumen = { total: 1, completas: 1, incompletas: 0 };
      service.obtenerResumen.mockResolvedValue(mockResumen);

      // WHEN
      const { result } = renderHook(() => useUbicaciones('F001'));
      let returnValue;
      await act(async () => {
        returnValue = await result.current.getResumen();
      });

      // THEN
      expect(result.current.resumen).toEqual(mockResumen);
      expect(returnValue).toEqual(mockResumen);
    });

    it('setea error cuando el servicio falla', async () => {
      // GIVEN
      service.obtenerResumen.mockRejectedValue({
        response: { data: { detail: 'Error resumen' } },
      });

      // WHEN
      const { result } = renderHook(() => useUbicaciones('F001'));
      await act(async () => {
        try { await result.current.getResumen(); } catch {}
      });

      // THEN
      expect(result.current.error).toBe('Error resumen');
    });
  });
});
