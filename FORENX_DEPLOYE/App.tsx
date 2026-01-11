import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import EntitiesPage from './pages/EntitiesPage';
import TimelinePage from './pages/TimelinePage';
import SummaryPage from './pages/SummaryPage';
import GraphPage from './pages/GraphPage';
import CaseFilesPage from './pages/CaseFilesPage';
import CaseCorrelationPage from './pages/CaseCorrelationPage';
import { useAuth } from './contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout><Outlet /></Layout> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* All protected routes are nested under a single wrapper */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/cases" element={<CaseFilesPage />} />
        <Route path="/link-analysis" element={<CaseCorrelationPage />} />
        
        {/* Nested routes for a specific case */}
        <Route path="/cases/:caseId">
          <Route path="summary" element={<SummaryPage />} />
          <Route path="entities" element={<EntitiesPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="graph" element={<GraphPage />} />
        </Route>
        
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return <AppRoutes />;
};

export default App;