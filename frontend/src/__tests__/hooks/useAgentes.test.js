import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentes } from '../../hooks/useAgentes';
import * as service from '../../services/catalogosService';

vi.mock('../../services/catalogosService');

const mockAgentes = [
  { codigo: 'AG001', nombre: 'Agente Uno' },
  { codigo: 'AG002', nombre: 'Agente Dos' },
];

describe('useAgentes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('estado inicial', () => {
    it('inicia con agentes vacío, loading false y error null', () => {
      // GIVEN / WHEN
      const { result } = renderHook(() => useAgentes());

      // THEN
      expect(result.current.agentes).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('cargar', () => {
    it('carga agentes correctamente', async () => {
      // GIVEN
      service.obtenerAgentes.mockResolvedValue(mockAgentes);

      // WHEN
      const { result } = renderHook(() => useAgentes());
      await act(async () => { await result.current.cargar(); });

      // THEN
      expect(result.current.agentes).toHaveLength(2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('retorna el resultado del servicio', async () => {
      // GIVEN
      service.obtenerAgentes.mockResolvedValue(mockAgentes);

      // WHEN
      const { result } = renderHook(() => useAgentes());
      let returnValue;
      await act(async () => {
        returnValue = await result.current.cargar();
      });

      // THEN
      expect(returnValue).toEqual(mockAgentes);
    });

    it('setea error cuando el servicio falla con detail', async () => {
      // GIVEN
      service.obtenerAgentes.mockRejectedValue({
        response: { data: { detail: 'Error de servidor' } },
      });

      // WHEN
      const { result } = renderHook(() => useAgentes());
      await act(async () => {
        try { await result.current.cargar(); } catch {}
      });

      // THEN
      expect(result.current.error).toBe('Error de servidor');
      expect(result.current.loading).toBe(false);
    });

    it('usa mensaje generico cuando error no tiene detail', async () => {
      // GIVEN
      service.obtenerAgentes.mockRejectedValue(new Error('Network error'));

      // WHEN
      const { result } = renderHook(() => useAgentes());
      await act(async () => {
        try { await result.current.cargar(); } catch {}
      });

      // THEN
      expect(result.current.error).toBe('Error al cargar agentes');
    });

    it('lanza el error para que el llamador lo maneje', async () => {
      // GIVEN
      service.obtenerAgentes.mockRejectedValue(new Error('fail'));

      // WHEN
      const { result } = renderHook(() => useAgentes());
      let thrown;
      await act(async () => {
        try { await result.current.cargar(); }
        catch (e) { thrown = e; }
      });

      // THEN
      expect(thrown).toBeDefined();
    });
  });

  describe('buscar', () => {
    it('retorna todos los agentes cuando query es vacío', async () => {
      // GIVEN
      service.obtenerAgentes.mockResolvedValue(mockAgentes);
      const { result } = renderHook(() => useAgentes());
      await act(async () => { await result.current.cargar(); });

      // WHEN
      const found = result.current.buscar('');

      // THEN
      expect(found).toHaveLength(2);
    });

    it('filtra por nombre parcial', async () => {
      // GIVEN
      service.obtenerAgentes.mockResolvedValue(mockAgentes);
      const { result } = renderHook(() => useAgentes());
      await act(async () => { await result.current.cargar(); });

      // WHEN
      const found = result.current.buscar('uno');

      // THEN
      expect(found).toHaveLength(1);
      expect(found[0].codigo).toBe('AG001');
    });

    it('filtra por código', async () => {
      // GIVEN
      service.obtenerAgentes.mockResolvedValue(mockAgentes);
      const { result } = renderHook(() => useAgentes());
      await act(async () => { await result.current.cargar(); });

      // WHEN
      const found = result.current.buscar('AG002');

      // THEN
      expect(found).toHaveLength(1);
      expect(found[0].nombre).toBe('Agente Dos');
    });

    it('busqueda es case-insensitive', async () => {
      // GIVEN
      service.obtenerAgentes.mockResolvedValue(mockAgentes);
      const { result } = renderHook(() => useAgentes());
      await act(async () => { await result.current.cargar(); });

      // WHEN
      const found = result.current.buscar('AGENTE DOS');

      // THEN
      expect(found).toHaveLength(1);
    });

    it('retorna array vacío cuando no hay coincidencias', async () => {
      // GIVEN
      service.obtenerAgentes.mockResolvedValue(mockAgentes);
      const { result } = renderHook(() => useAgentes());
      await act(async () => { await result.current.cargar(); });

      // WHEN
      const found = result.current.buscar('AGENTE_XYZ_NO_EXISTE');

      // THEN
      expect(found).toHaveLength(0);
    });
  });
});
