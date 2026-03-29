import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorToastProvider } from './components/ErrorToastProvider';
import { Layout } from './components/Layout';
import { PrivateRoute } from './components/PrivateRoute';
import { AssignorDetailPage } from './pages/Assignors/AssignorDetailPage';
import { AssignorEditPage } from './pages/Assignors/AssignorEditPage';
import { AssignorFormPage } from './pages/Assignors/AssignorFormPage';
import { AssignorsListPage } from './pages/Assignors/AssignorsListPage';
import { LoginPage } from './pages/Login/LoginPage';
import { PayableDetailPage } from './pages/Payables/PayableDetailPage';
import { PayableEditPage } from './pages/Payables/PayableEditPage';
import { PayableFormPage } from './pages/Payables/PayableFormPage';
import { PayablesListPage } from './pages/Payables/PayablesListPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Rotas protegidas — PrivateRoute verifica JWT e renderiza Outlet */}
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/payables" element={<PayablesListPage />} />
                <Route path="/payables/new" element={<PayableFormPage />} />
                <Route path="/payables/:id" element={<PayableDetailPage />} />
                <Route path="/payables/:id/edit" element={<PayableEditPage />} />
                <Route path="/assignors" element={<AssignorsListPage />} />
                <Route path="/assignors/new" element={<AssignorFormPage />} />
                <Route path="/assignors/:id/edit" element={<AssignorEditPage />} />
                <Route path="/assignors/:id" element={<AssignorDetailPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/payables" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorToastProvider>
    </QueryClientProvider>
  );
}
