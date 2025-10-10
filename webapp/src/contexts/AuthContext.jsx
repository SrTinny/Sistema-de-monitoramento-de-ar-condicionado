import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // Poderia guardar dados do user decodificados
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se já existe um token no localStorage ao carregar o app
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      // Aqui você poderia decodificar o token para pegar dados do usuário
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;

      if (token) {
        localStorage.setItem('authToken', token);
        setIsAuthenticated(true);
        navigate('/'); // Redireciona para a Home após o login
      }
    } catch (error) {
      console.error('Erro no login:', error);
      // Lançar o erro para que o componente de login possa tratá-lo
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login'); // Redireciona para a página de login
  };

  if (loading) {
    return <div>Carregando...</div>; // Ou um spinner de loading
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};