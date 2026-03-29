import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useErrorToast } from '../../components/ErrorToastProvider';
import { authService } from '../../services/auth.service';
import {
  AUTH_LOGOUT_REASON_KEY,
  AUTH_LOGOUT_REASON_SESSION_EXPIRED,
} from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';

const loginSchema = z.object({
  login: z.string().min(1, 'Login é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { showError } = useErrorToast();
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  useEffect(() => {
    try {
      if (
        sessionStorage.getItem(AUTH_LOGOUT_REASON_KEY) ===
        AUTH_LOGOUT_REASON_SESSION_EXPIRED
      ) {
        sessionStorage.removeItem(AUTH_LOGOUT_REASON_KEY);
        setSessionExpiredNotice(true);
      }
    } catch {
      // sessionStorage indisponível
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFormData) {
    try {
      const { token } = await authService.login(data);
      localStorage.setItem('token', token);
      navigate('/payables');
    } catch (err) {
      showError(
        getApiErrorMessage(err, 'Credenciais inválidas. Tente novamente.'),
      );
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">Aprove-me</h1>
          <p className="text-gray-500 mt-2 text-sm">Gestão de recebíveis — Bankme</p>
        </div>

        {sessionExpiredNotice && (
          <div
            className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left"
            role="status"
          >
            <p className="text-sm font-medium text-amber-900">
              Sua sessão expirou.
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Faça login novamente para continuar.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Login
            </label>
            <input
              {...register('login')}
              type="text"
              placeholder="Login"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.login && (
              <p className="text-red-500 text-xs mt-1">{errors.login.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="Senha"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
