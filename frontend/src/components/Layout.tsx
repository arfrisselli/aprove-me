import { Link, Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

export function Layout() {
  const navigate = useNavigate();

  function handleLogout() {
    authService.logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold text-blue-700">Aprove-me</span>
          <Link
            to="/payables"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Pagáveis
          </Link>
          <Link
            to="/assignors"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Cedentes
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
        >
          Sair
        </button>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
