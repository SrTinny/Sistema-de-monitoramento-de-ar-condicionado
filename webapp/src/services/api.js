import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001', // URL base da API
});

// Adiciona o token de autenticação em cada requisição, se disponível
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;