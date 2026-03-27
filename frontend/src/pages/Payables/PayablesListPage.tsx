import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { payableService } from '../../services/payable.service';

export function PayablesListPage() {
  const queryClient = useQueryClient();

  const { data: payables = [], isLoading, isError } = useQuery({
    queryKey: ['payables'],
    queryFn: payableService.findAll,
  });

  const removeMutation = useMutation({
    mutationFn: payableService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
    },
  });

  function handleRemove(id: string) {
    if (window.confirm('Deseja realmente excluir este pagável?')) {
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
        <p className="text-red-600">Erro ao carregar pagáveis.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pagáveis</h2>
        <Link
          to="/payables/new"
          className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Pagável
        </Link>
      </div>

      {payables.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Nenhum pagável cadastrado ainda.</p>
          <Link to="/payables/new" className="text-blue-600 hover:underline text-sm mt-2 block">
            Cadastrar primeiro pagável
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">ID</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Valor</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">
                  Data de Emissão
                </th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {payables.map((payable, idx) => (
                <tr
                  key={payable.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                >
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                    <Link
                      to={`/payables/${payable.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {payable.id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(payable.value)}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(payable.emissionDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3 text-right space-x-3">
                    <Link
                      to={`/payables/${payable.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Detalhes
                    </Link>
                    <Link
                      to={`/payables/${payable.id}/edit`}
                      className="text-gray-600 hover:underline"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleRemove(payable.id)}
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
