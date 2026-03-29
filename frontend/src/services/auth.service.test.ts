import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { api } from './api';

vi.mock('./api', () => ({
  api: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('login should call API and return token', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { token: 'test-token' } });

    const result = await authService.login({
      login: 'fixture-login',
      password: 'fixture-password',
    });

    expect(api.post).toHaveBeenCalledWith('/integrations/auth', {
      login: 'fixture-login',
      password: 'fixture-password',
    });
    expect(result).toEqual({ token: 'test-token' });
  });

  it('logout should remove token from localStorage', () => {
    localStorage.setItem('token', 'test-token');
    authService.logout();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('getToken should return token from localStorage', () => {
    localStorage.setItem('token', 'my-token');
    expect(authService.getToken()).toBe('my-token');
  });

  it('isAuthenticated should return true when token exists', () => {
    localStorage.setItem('token', 'some-token');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('isAuthenticated should return false when no token', () => {
    expect(authService.isAuthenticated()).toBe(false);
  });
});
