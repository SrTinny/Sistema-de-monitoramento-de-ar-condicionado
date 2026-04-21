import axios from 'axios';

// Use a variável de ambiente VITE_API_URL quando disponível (configuração para produção)
// Em desenvolvimento, o fallback é http://localhost:3001
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Log para debug
if (typeof window !== 'undefined') {
  console.log('🔗 API Base URL:', baseURL);
  console.log('🔗 VITE_API_URL env:', import.meta.env.VITE_API_URL);
}

const api = axios.create({
  baseURL, // URL base da API (pode ser configurada no ambiente de deploy)
});

// Adiciona o token de autenticação em cada requisição, se disponível
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta: trata falhas de autenticação removendo token e forçando login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (status === 401 && !isAuthEndpoint) {
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