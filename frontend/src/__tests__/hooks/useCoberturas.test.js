import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCoberturas } from '../../hooks/useCoberturas';
import * as service from '../../services/coberturasService';

vi.mock('../../services/coberturasService');

const mockOpciones = [
  { cobertura: 'INCENDIO_EDIFICIOS', nombre: 'Incendio Edificios', activa: true, obligatoria: true },
  { cobertura: 'CATFHM', nombre: 'CATFHM', activa: false, obligatoria: false },
];

describe('useCoberturas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cargar', () => {
    it('carga coberturas y version', async () => {
      // GIVEN
      service.obtenerCoberturas.mockResolvedValue({
        opciones_cobertura: mockOpciones,
        version: 2,
      });

      // WHEN
      const { result } = renderHook(() => useCoberturas('F2026041700001'));
      await act(async () => { await result.current.cargar(); });

      // THEN
      expect(result.current.coberturas).toHaveLength(2);
      expect(result.current.version).toBe(2);
      expect(result.current.loading).toBe(false);
    });

    it('no hace nada si folio es null', async () => {
      // GIVEN
      const { result } = renderHook(() => useCoberturas(null));

      // WHEN
      await act(async () => { await result.current.cargar(); });

      // THEN
      expect(service.obtenerCoberturas).not.toHaveBeenCalled();
    });

    it('setea error cuando service falla', async () => {
      // GIVEN
      service.obtenerCoberturas.mockRejectedValue({
        response: { data: { detail: 'Error de servidor' } },
      });

      // WHEN
      const { result } = renderHook(() => useCoberturas('F001'));
      await act(async () => {
        try { await result.current.cargar(); } catch {}
      });

      // THEN
      expect(result.current.error).toBe('Error de servidor');
    });
  });

  describe('actualizar', () => {
    it('envia coberturas y version al servicio', async () => {
      // GIVEN — cargar primero para tener version
      service.obtenerCoberturas.mockResolvedValue({ opciones_cobertura: mockOpciones, version: 2 });
      service.actualizarCoberturas.mockResolvedValue({ opciones_cobertura: mockOpciones, version: 3 });

      const { result } = renderHook(() => useCoberturas('F2026041700001'));
      await act(async () => { await result.current.cargar(); });

      const nuevas = [{ cobertura: 'INCENDIO_EDIFICIOS', activa: true }];

      // WHEN
      await act(async () => { await result.current.actualizar(nuevas); });

      // THEN
      expect(service.actualizarCoberturas).toHaveBeenCalledWith('F2026041700001', nuevas, 2);
      expect(result.current.version).toBe(3);
    });

    it('no llama al servicio si version es null', async () => {
      // GIVEN — no se llamo cargar(), version = null
      const { result } = renderHook(() => useCoberturas('F2026041700001'));

      // WHEN
      await act(async () => {
        await result.current.actualizar([{ cobertura: 'X', activa: true }]);
      });

      // THEN
      expect(service.actualizarCoberturas).not.toHaveBeenCalled();
    });
  });
});
