import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { renderHook } from '@testing-library/react';
import { CotizacionProvider, useCotizacionContext } from '../../contexts/CotizacionContext';

const wrapper = ({ children }) => (
  <CotizacionProvider>{children}</CotizacionProvider>
);

describe('CotizacionContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('CotizacionProvider', () => {
    it('provee folio null por defecto cuando localStorage esta vacío', () => {
      // GIVEN / WHEN
      const { result } = renderHook(() => useCotizacionContext(), { wrapper });

      // THEN
      expect(result.current.folio).toBeNull();
    });

    it('recupera el folio de localStorage al inicializar', () => {
      // GIVEN
      localStorage.setItem('cotizador_folio', 'F20260417-00001');

      // WHEN
      const { result } = renderHook(() => useCotizacionContext(), { wrapper });

      // THEN
      expect(result.current.folio).toBe('F20260417-00001');
    });

    it('setFolio actualiza el folio y persiste en localStorage', () => {
      // GIVEN
      const { result } = renderHook(() => useCotizacionContext(), { wrapper });

      // WHEN
      act(() => {
        result.current.setFolio('F20260417-99999');
      });

      // THEN
      expect(result.current.folio).toBe('F20260417-99999');
      expect(localStorage.getItem('cotizador_folio')).toBe('F20260417-99999');
    });

    it('setFolio con null elimina de localStorage', () => {
      // GIVEN
      localStorage.setItem('cotizador_folio', 'F001');
      const { result } = renderHook(() => useCotizacionContext(), { wrapper });

      // WHEN
      act(() => {
        result.current.setFolio(null);
      });

      // THEN
      expect(result.current.folio).toBeNull();
      expect(localStorage.getItem('cotizador_folio')).toBeNull();
    });

    it('limpiar resetea el folio y borra localStorage', () => {
      // GIVEN
      localStorage.setItem('cotizador_folio', 'F001');
      const { result } = renderHook(() => useCotizacionContext(), { wrapper });
      act(() => { result.current.setFolio('F001'); });

      // WHEN
      act(() => { result.current.limpiar(); });

      // THEN
      expect(result.current.folio).toBeNull();
      expect(localStorage.getItem('cotizador_folio')).toBeNull();
    });

    it('getFolio retorna el folio actual', () => {
      // GIVEN
      const { result } = renderHook(() => useCotizacionContext(), { wrapper });
      act(() => { result.current.setFolio('F20260417-00042'); });

      // WHEN
      const folio = result.current.getFolio();

      // THEN
      expect(folio).toBe('F20260417-00042');
    });
  });

  describe('useCotizacionContext fuera del provider', () => {
    it('lanza error si se usa fuera del CotizacionProvider', () => {
      // GIVEN / WHEN / THEN
      expect(() => {
        renderHook(() => useCotizacionContext());
      }).toThrow('useCotizacionContext debe usarse dentro de CotizacionProvider');
    });
  });
});
