import React, { createContext, useContext, useState, useCallback } from 'react';

const CotizacionContext = createContext(null);

export function CotizacionProvider({ children }) {
  const [folio, setFolioState] = useState(() => {
    // Persistir folio en localStorage para sobrevivir refrescos de página
    return localStorage.getItem('cotizador_folio') || null;
  });

  const setFolio = useCallback((newFolio) => {
    setFolioState(newFolio);
    if (newFolio) {
      localStorage.setItem('cotizador_folio', newFolio);
    } else {
      localStorage.removeItem('cotizador_folio');
    }
  }, []);

  const getFolio = useCallback(() => folio, [folio]);

  const limpiar = useCallback(() => {
    setFolioState(null);
    localStorage.removeItem('cotizador_folio');
  }, []);

  return (
    <CotizacionContext.Provider value={{ folio, setFolio, getFolio, limpiar }}>
      {children}
    </CotizacionContext.Provider>
  );
}

export function useCotizacionContext() {
  const ctx = useContext(CotizacionContext);
  if (!ctx) {
    throw new Error('useCotizacionContext debe usarse dentro de CotizacionProvider');
  }
  return ctx;
}
