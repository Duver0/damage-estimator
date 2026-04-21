import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalculo } from '../../hooks/useCalculo';
import * as service from '../../services/calculoService';

vi.mock('../../services/calculoService');

const mockResultado = {
  resultado_financiero: {
    prima_neta: 100000,
    prima_comercial: 135000,
    primas_por_ubicacion: [{ ubicacion: 1, prima: 100000 }],
  },
  alertas: [{ mensaje: 'Ubicación incompleta omitida' }],
};

describe('useCalculo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('estado inicial', () => {
    it('inicia con valores null y loading false', () => {
      // GIVEN / WHEN
      const { result } = renderHook(() => useCalculo('F001'));

      // THEN
      expect(result.current.primaNeta).toBeNull();
      expect(result.current.primaComercial).toBeNull();
      expect(result.current.desglose).toBeNull();
      expect(result.current.alertas).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('calcular', () => {
    it('no hace nada si folio es null', async () => {
      // GIVEN
      const { result } = renderHook(() => useCalculo(null));

      // WHEN
      await act(async () => { await result.current.calcular(); });

      // THEN
      expect(service.ejecutarCalculo).not.toHaveBeenCalled();
    });

    it('llama al servicio con el folio correcto', async () => {
      // GIVEN
      service.ejecutarCalculo.mockResolvedValue(mockResultado);

      // WHEN
      const { result } = renderHook(() => useCalculo('F20260417-00001'));
      await act(async () => { await result.current.calcular(); });

      // THEN
      expect(service.ejecutarCalculo).toHaveBeenCalledWith('F20260417-00001');
    });

    it('actualiza primaNeta y primaComercial con el resultado', async () => {
      // GIVEN
      service.ejecutarCalculo.mockResolvedValue(mockResultado);

      // WHEN
      const { result } = renderHook(() => useCalculo('F001'));
      await act(async () => { await result.current.calcular(); });

      // THEN
      expect(result.current.primaNeta).toBe(100000);
      expect(result.current.primaComercial).toBe(135000);
    });

    it('actualiza desglose y alertas', async () => {
      // GIVEN
      service.ejecutarCalculo.mockResolvedValue(mockResultado);

      // WHEN
      const { result } = renderHook(() => useCalculo('F001'));
      await act(async () => { await result.current.calcular(); });

      // THEN
      expect(result.current.desglose).toHaveLength(1);
      expect(result.current.alertas).toHaveLength(1);
      expect(result.current.alertas[0].mensaje).toBe('Ubicación incompleta omitida');
    });

    it('maneja resultado sin resultado_financiero', async () => {
      // GIVEN
      service.ejecutarCalculo.mockResolvedValue({ alertas: [] });

      // WHEN
      const { result } = renderHook(() => useCalculo('F001'));
      await act(async () => { await result.current.calcular(); });

      // THEN
      expect(result.current.primaNeta).toBeUndefined();
      expect(result.current.desglose).toEqual([]);
    });

    it('setea error con detail cuando el servicio falla', async () => {
      // GIVEN
      service.ejecutarCalculo.mockRejectedValue({
        response: { data: { detail: 'No hay ubicaciones calculables' } },
      });

      // WHEN
      const { result } = renderHook(() => useCalculo('F001'));
      await act(async () => {
        try { await result.current.calcular(); } catch {}
      });

      // THEN
      expect(result.current.error).toBe('No hay ubicaciones calculables');
    });

    it('usa mensaje generico cuando error no tiene detail', async () => {
      // GIVEN
      service.ejecutarCalculo.mockRejectedValue(new Error('Network'));

      // WHEN
      const { result } = renderHook(() => useCalculo('F001'));
      await act(async () => {
        try { await result.current.calcular(); } catch {}
      });

      // THEN
      expect(result.current.error).toBe('Error al calcular prima');
    });

    it('loading es false después de completar', async () => {
      // GIVEN
      service.ejecutarCalculo.mockResolvedValue(mockResultado);

      // WHEN
      const { result } = renderHook(() => useCalculo('F001'));
      await act(async () => { await result.current.calcular(); });

      // THEN
      expect(result.current.loading).toBe(false);
    });
  });
});
