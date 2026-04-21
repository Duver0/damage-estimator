import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useCotizacion } from '../../hooks/useCotizacion';
import * as cotizacionService from '../../services/cotizacionService';
import { CotizacionProvider } from '../../contexts/CotizacionContext';

vi.mock('../../services/cotizacionService');

const wrapper = ({ children }) => (
  <CotizacionProvider>{children}</CotizacionProvider>
);

describe('useCotizacion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('estado inicial', () => {
    it('inicia con folio null, loading false, error null', () => {
      // GIVEN / WHEN
      const { result } = renderHook(() => useCotizacion(), { wrapper });

      // THEN
      expect(result.current.folio).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.datos).toBeNull();
    });
  });

  describe('crear', () => {
    it('crea cotizacion y actualiza el folio en contexto', async () => {
      // GIVEN
      cotizacionService.crearCotizacion.mockResolvedValue({
        numero_folio: 'F20260417-00001',
        estado_cotizacion: 'CREADA',
      });

      // WHEN
      const { result } = renderHook(() => useCotizacion(), { wrapper });
      await act(async () => {
        await result.current.crear({ datos_asegurado: { nombre: 'Test' } });
      });

      // THEN
      expect(result.current.folio).toBe('F20260417-00001');
      expect(result.current.datos).toBeDefined();
    });

    it('llama crearCotizacion con los datos y la clave de idempotencia', async () => {
      // GIVEN
      cotizacionService.crearCotizacion.mockResolvedValue({ numero_folio: 'F001' });
      const datosForm = { datos_asegurado: { nombre: 'Juan' } };

      // WHEN
      const { result } = renderHook(() => useCotizacion(), { wrapper });
      await act(async () => {
        await result.current.crear(datosForm, 'KEY-123');
      });

      // THEN
      expect(cotizacionService.crearCotizacion).toHaveBeenCalledWith(datosForm, 'KEY-123');
    });

    it('setea error con detail cuando el servicio falla', async () => {
      // GIVEN
      cotizacionService.crearCotizacion.mockRejectedValue({
        response: { data: { detail: 'Error de servidor' } },
      });

      // WHEN
      const { result } = renderHook(() => useCotizacion(), { wrapper });
      await act(async () => {
        try { await result.current.crear({}); } catch {}
      });

      // THEN
      expect(result.current.error).toBe('Error de servidor');
    });

    it('usa mensaje generico cuando error no tiene detail', async () => {
      // GIVEN
      cotizacionService.crearCotizacion.mockRejectedValue(new Error('Network'));

      // WHEN
      const { result } = renderHook(() => useCotizacion(), { wrapper });
      await act(async () => {
        try { await result.current.crear({}); } catch {}
      });

      // THEN
      expect(result.current.error).toBe('Error al crear cotización');
    });
  });

  describe('getState', () => {
    it('retorna null si no hay folio', async () => {
      // GIVEN
      const { result } = renderHook(() => useCotizacion(), { wrapper });

      // WHEN
      let returnValue;
      await act(async () => {
        returnValue = await result.current.getState();
      });

      // THEN
      expect(returnValue).toBeNull();
      expect(cotizacionService.obtenerEstado).not.toHaveBeenCalled();
    });

    it('llama al servicio con el folio provisto como parametro', async () => {
      // GIVEN
      cotizacionService.obtenerEstado.mockResolvedValue({ estado: 'CREADA' });

      // WHEN
      const { result } = renderHook(() => useCotizacion(), { wrapper });
      await act(async () => {
        await result.current.getState('F20260417-00001');
      });

      // THEN
      expect(cotizacionService.obtenerEstado).toHaveBeenCalledWith('F20260417-00001');
    });

    it('setea error cuando el servicio falla', async () => {
      // GIVEN
      cotizacionService.obtenerEstado.mockRejectedValue({
        response: { data: { detail: 'Folio no encontrado' } },
      });

      // WHEN
      const { result } = renderHook(() => useCotizacion(), { wrapper });
      await act(async () => {
        try { await result.current.getState('FNOEXISTE'); } catch {}
      });

      // THEN
      expect(result.current.error).toBe('Folio no encontrado');
    });
  });

  describe('abrirFolioExistente', () => {
    it('actualiza el folio en el contexto', async () => {
      // GIVEN
      const { result } = renderHook(() => useCotizacion(), { wrapper });

      // WHEN
      act(() => {
        result.current.abrirFolioExistente('F20260417-99999');
      });

      // THEN
      expect(result.current.folio).toBe('F20260417-99999');
    });
  });
});
