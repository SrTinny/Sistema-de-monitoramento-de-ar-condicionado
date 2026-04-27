import React, { Suspense, useContext, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';

// Layout
import EnvWarning from './components/EnvWarning/EnvWarning';

// Páginas carregadas sob demanda
const Home = lazy(() => import('./pages/home/Home'));
const Login = lazy(() => import('./pages/Login/Login'));
const Agendamentos = lazy(() => import('./pages/agendamentos/Agendamentos'));
const Layout = lazy(() => import('./components/Layout/Layout'));

const RouteFallback = () => <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} />;

// Componente para proteger rotas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
  <>
    <EnvWarning />
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas que usarão o Layout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Rotas filhas do Layout. O "index" é a rota padrão "/" */}
          <Route index element={<Home />} />
          <Route path="agendamentos" element={<Agendamentos />} />
        </Route>
      </Routes>
    </Suspense>
  </>
  );
}

export default App;