import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { RoomProvider } from './contexts/RoomContext.jsx'; // 👈 Importe o RoomProvider
import './index.css';

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router future={routerFutureFlags}>
      <AuthProvider>
        <RoomProvider> {/* 👈 Envolva o App com o RoomProvider */}
          <App />
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={12}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              duration: 4000,
              // Estilos padrão
              style: {
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                color: '#f3f4f6',
                borderRadius: '0.75rem',
                border: '1px solid rgba(75, 85, 99, 0.3)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(10px)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              },
              // Estilos para sucesso
              success: {
                duration: 4000,
                style: {
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10b981',
                },
              },
              // Estilos para erro
              error: {
                duration: 5000,
                style: {
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#ef4444',
                },
              },
              // Estilos para loading
              loading: {
                duration: Infinity,
                style: {
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                },
              },
            }}
          />
        </RoomProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);