import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

/** sessionStorage: aviso na tela de login após 401 (sessão expirada). */
export const AUTH_LOGOUT_REASON_KEY = 'aprove:authLogoutReason';
export const AUTH_LOGOUT_REASON_SESSION_EXPIRED = 'session_expired';

export const api = axios.create({
  baseURL: BASE_URL,
});

// Injeta o JWT em todas as requisições autenticadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redireciona para /login quando o token expira (401).
// Não redirecionar no POST /integrations/auth: credenciais inválidas também retornam 401;
// um hard redirect apagaria a mensagem de erro antes de o usuário ler.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const cfg = error.config;
      const isLoginAttempt =
        cfg?.method?.toLowerCase() === 'post' &&
        typeof cfg?.url === 'string' &&
        cfg.url.includes('/integrations/auth');
      if (!isLoginAttempt) {
        localStorage.removeItem('token');
        try {
          sessionStorage.setItem(
            AUTH_LOGOUT_REASON_KEY,
            AUTH_LOGOUT_REASON_SESSION_EXPIRED,
          );
        } catch {
          // sessionStorage indisponível (ex.: modo privado restrito)
        }
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
