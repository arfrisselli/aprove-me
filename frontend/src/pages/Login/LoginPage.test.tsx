import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorToastProvider } from '../../components/ErrorToastProvider';
import { LoginPage } from './LoginPage';
import * as authService from '../../services/auth.service';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  function renderLogin() {
    return render(
      <MemoryRouter>
        <ErrorToastProvider>
          <LoginPage />
        </ErrorToastProvider>
      </MemoryRouter>,
    );
  }

  it('should render login form', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Login é obrigatório')).toBeInTheDocument();
      expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument();
    });
  });

  it('should call authService.login on valid submit and store token', async () => {
    vi.mocked(authService.authService.login).mockResolvedValue({ token: 'jwt-token' });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Login'), {
      target: { value: 'aprovame' },
    });
    fireEvent.change(screen.getByPlaceholderText('Senha'), {
      target: { value: 'aprovame' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(authService.authService.login).toHaveBeenCalledWith({
        login: 'aprovame',
        password: 'aprovame',
      });
      expect(localStorage.getItem('token')).toBe('jwt-token');
      expect(mockNavigate).toHaveBeenCalledWith('/payables');
    });
  });

  it('should show error message on failed login', async () => {
    vi.mocked(authService.authService.login).mockRejectedValue(
      new Error('Credenciais inválidas. Tente novamente.'),
    );
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Login'), {
      target: { value: 'wrong' },
    });
    fireEvent.change(screen.getByPlaceholderText('Senha'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Credenciais inválidas. Tente novamente.'),
      ).toBeInTheDocument();
    });
  });
});
