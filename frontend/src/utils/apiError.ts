import { AxiosError } from 'axios';

/** Extrai mensagem legível de erros HTTP (ex.: resposta NestJS). */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: unknown } | undefined;
    if (data && typeof data === 'object' && 'message' in data) {
      const m = data.message;
      if (typeof m === 'string' && m.trim()) return m;
      if (Array.isArray(m)) return m.filter((x) => typeof x === 'string').join(', ');
    }
    if (error.response?.statusText) return error.response.statusText;
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
