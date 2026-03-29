import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useErrorToast } from '../../components/ErrorToastProvider';
import { assignorService } from '../../services/assignor.service';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatCpfCnpjDisplay } from '../../utils/formatDocumentBr';

export function AssignorsListPage() {
  const queryClient = useQueryClient();
  const { showError } = useErrorToast();

  const { data: assignors = [], isLoading, isError } = useQuery({
    queryKey: ['assignors'],
    queryFn: assignorService.findAll,
  });

  const removeMutation = useMutation({
    mutationFn: assignorService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignors'] });
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Não foi possível excluir o cedente.'));
    },
  });

  function handleRemove(id: string) {
    if (window.confirm('Deseja realmente excluir este cedente?')) {
      removeMutation.mutate(id);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        <p className="text-red-600">Erro ao carregar cedentes.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Cedentes</h2>
        <Link
          to="/assignors/new"
          className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Cedente
        </Link>
      </div>

      {assignors.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Nenhum cedente cadastrado ainda.</p>
          <Link to="/assignors/new" className="text-blue-600 hover:underline text-sm mt-2 block">
            Cadastrar primeiro cedente
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Nome</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">CPF/CNPJ</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">E-mail</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {assignors.map((a, idx) => (
                <tr key={a.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-5 py-3 font-medium text-gray-800">{a.name}</td>
                  <td className="px-5 py-3 text-gray-600">{formatCpfCnpjDisplay(a.document)}</td>
                  <td className="px-5 py-3 text-gray-600">{a.email}</td>
                  <td className="px-5 py-3 text-right space-x-3">
                    <Link
                      to={`/assignors/${a.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Detalhes
                    </Link>
                    <Link
                      to={`/assignors/${a.id}/edit`}
                      className="text-gray-600 hover:underline"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemove(a.id)}
                      className="text-red-500 hover:underline"
                      disabled={removeMutation.isPending}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
