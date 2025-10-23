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

// Interceptor de resposta: trata 401/403 removendo token e forçando login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Limpa o token local e redireciona para a tela de login
      localStorage.removeItem('authToken');
      // Se estiver em ambiente de navegador, redireciona
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;