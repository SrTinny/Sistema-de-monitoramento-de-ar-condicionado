import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './index.css';

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router future={routerFutureFlags}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);