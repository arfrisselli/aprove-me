import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/auth.service';

export function PrivateRoute() {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
