import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';

// Layout
import Layout from './components/Layout/Layout';
import EnvWarning from './components/EnvWarning/EnvWarning';

// Páginas
import Home from './pages/home/Home';
import Login from './pages/Login/Login';
import Agendamentos from './pages/agendamentos/Agendamentos';

// Componente para proteger rotas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
  <>
    <EnvWarning />
      
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
  </>
  );
}

export default App;