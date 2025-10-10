import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { RoomProvider } from './contexts/RoomContext.jsx'; // 👈 Importe o RoomProvider
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <RoomProvider> {/* 👈 Envolva o App com o RoomProvider */}
          <App />
        </RoomProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);