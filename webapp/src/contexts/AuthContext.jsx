import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Agora este estado será populado
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');

      if (token) {
        const { jwtDecode } = await import('jwt-decode');
        if (cancelled) {
          return;
        }

        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
        setIsAuthenticated(true);
      }

      if (!cancelled) {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const [{ default: api }, { jwtDecode }] = await Promise.all([
        import('../services/api'),
        import('jwt-decode'),
      ]);

      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;

      if (token) {
        localStorage.setItem('authToken', token);
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};