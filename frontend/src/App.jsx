import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CotizacionProvider } from './contexts/CotizacionContext';
import CotizadorPage from './pages/CotizadorPage';
import DashboardPage from './pages/DashboardPage';
import GeneralInfoPage from './pages/GeneralInfoPage';
import LocationsPage from './pages/LocationsPage';
import TechnicalInfoPage from './pages/TechnicalInfoPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import NotFoundPage from './pages/NotFoundPage';
import QuoteViewPage from './pages/QuoteViewPage';

export default function App() {
  return (
    <CotizacionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cotizador" element={<CotizadorPage />} />
          <Route path="/quotes/:folio/general-info" element={<GeneralInfoPage />} />
          <Route path="/quotes/:folio/locations" element={<LocationsPage />} />
          <Route path="/quotes/:folio/technical-info" element={<TechnicalInfoPage />} />
          <Route path="/quotes/:folio/terms-and-conditions" element={<TermsAndConditionsPage />} />
          <Route path="/quotes/:folio/view" element={<QuoteViewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </CotizacionProvider>
  );
}
