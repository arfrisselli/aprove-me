import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useErrorToast } from '../../components/ErrorToastProvider';
import { payableService } from '../../services/payable.service';
import { getApiErrorMessage } from '../../utils/apiError';

export function PayableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError } = useErrorToast();

  const { data: payable, isLoading, isError } = useQuery({
    queryKey: ['payable', id],
    queryFn: () => payableService.findOne(id!),
    enabled: Boolean(id),
  });

  const removeMutation = useMutation({
    mutationFn: payableService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
      navigate('/payables');
    },
    onError: (err) => {
      showError(getApiErrorMessage(err, 'Não foi possível excluir o pagável.'));
    },
  });

  function handleRemove() {
    if (window.confirm('Deseja realmente excluir este pagável?')) {
      removeMutation.mutate(id!);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !payable) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        <p className="text-red-600">Pagável não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          ← Voltar
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Detalhes do Pagável</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">ID</p>
          <p className="font-mono text-sm text-gray-700">{payable.id}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Valor</p>
          <p className="text-2xl font-bold text-blue-700">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(payable.value)}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Data de Emissão
          </p>
          <p className="text-gray-700">
            {new Date(payable.emissionDate).toLocaleDateString('pt-BR')}
          </p>
        </div>

        {payable.assignor && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Cedente</p>
            <Link
              to={`/assignors/${payable.assignorId}`}
              className="text-blue-600 hover:underline font-medium"
            >
              {payable.assignor.name} →
            </Link>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-5">
        <Link
          to={`/payables/${payable.id}/edit`}
          className="flex-1 text-center border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Editar
        </Link>
        <button
          onClick={handleRemove}
          disabled={removeMutation.isPending}
          className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {removeMutation.isPending ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </div>
  );
}
